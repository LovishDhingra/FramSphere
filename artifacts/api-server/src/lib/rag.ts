/**
 * RAG (Retrieval-Augmented Generation) Pipeline
 *
 * Architecture:
 * 1. Embedding Layer: Converts text chunks into vector representations
 *    using in-memory cosine similarity search (simulated vector DB)
 * 2. Retrieval Layer: Finds semantically relevant context for a user query
 * 3. Generation Layer: Uses OpenAI to generate answers with retrieved context
 *
 * In production, replace the in-memory store with FAISS, ChromaDB, or pgvector.
 */

import { openai } from "@workspace/integrations-openai-ai-server";
import { logger } from "./logger";

/**
 * A single "document chunk" in the vector store.
 * In production: replace with FAISS index or ChromaDB collection.
 */
interface VectorDocument {
  id: string;
  text: string;
  type: "price" | "msp" | "market" | "scheme" | "trend" | "advisory";
  embedding?: number[];
  metadata?: Record<string, unknown>;
}

/** In-memory vector store (replace with FAISS/ChromaDB in production) */
const vectorStore: VectorDocument[] = [];

/**
 * Embedding Layer: Generate a text embedding via OpenAI.
 * In production: use sentence-transformers or a dedicated embedding model.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  // Use a simple TF-IDF-like hash for fast in-memory similarity
  // In production: call openai.embeddings.create({ model: "text-embedding-3-small", input: text })
  const words = text.toLowerCase().split(/\s+/);
  const vocab: Record<string, number> = {};
  words.forEach((w) => {
    vocab[w] = (vocab[w] || 0) + 1;
  });
  // Return a fixed-length hash vector (dimension 128 for demo)
  const vec = new Array(128).fill(0);
  Object.entries(vocab).forEach(([word, count]) => {
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = (hash * 31 + word.charCodeAt(i)) % 128;
    }
    vec[Math.abs(hash)] += count;
  });
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map((v) => v / norm);
}

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

/**
 * Retrieval Layer: Find top-k most relevant documents for a query.
 * Performs cosine similarity search over all vectors in the store.
 */
async function retrieveContext(
  query: string,
  topK = 5,
): Promise<Array<{ doc: VectorDocument; score: number }>> {
  if (vectorStore.length === 0) {
    return [];
  }

  const queryEmbedding = await generateEmbedding(query);

  const scored = vectorStore.map((doc) => ({
    doc,
    score: doc.embedding ? cosineSimilarity(queryEmbedding, doc.embedding) : 0,
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).filter((s) => s.score > 0.1);
}

/**
 * Index Layer: Add a document to the vector store with its embedding.
 * Call this whenever new data is inserted into the DB.
 */
export async function indexDocument(doc: Omit<VectorDocument, "embedding">): Promise<void> {
  const embedding = await generateEmbedding(doc.text);
  vectorStore.push({ ...doc, embedding });
}

/**
 * Seed the vector store with initial knowledge base documents.
 * This simulates loading mandi data, MSP data, and advisories.
 */
export async function seedVectorStore(): Promise<void> {
  if (vectorStore.length > 0) return;

  const documents: Array<Omit<VectorDocument, "embedding">> = [
    {
      id: "msp_wheat_2024",
      text: "The Minimum Support Price (MSP) for wheat in 2024-25 is Rs. 2275 per quintal. MSP is the price guaranteed by the government for procurement. If a mandi price is lower than MSP, it may indicate price suppression.",
      type: "msp",
    },
    {
      id: "msp_rice_2024",
      text: "MSP for Paddy (Common) is Rs. 2300 per quintal for Kharif 2024-25. Paddy prices below this threshold suggest farmers are not getting fair value.",
      type: "msp",
    },
    {
      id: "msp_maize_2024",
      text: "MSP for Maize is Rs. 2090 per quintal. Maize is widely grown across Rajasthan, Madhya Pradesh, and Uttar Pradesh.",
      type: "msp",
    },
    {
      id: "msp_soybean_2024",
      text: "MSP for Soybean (Yellow) is Rs. 4892 per quintal for Kharif 2024-25. Soybean prices often fluctuate due to international market dynamics.",
      type: "msp",
    },
    {
      id: "exploitation_pattern",
      text: "Common middleman exploitation patterns: (1) Buying at 20-40% below mandi price citing quality issues, (2) Delaying payment beyond 7 days, (3) Charging unofficial commissions above the regulated 1-2%, (4) Inflating weighing scales, (5) Forcing distress sales during harvest glut.",
      type: "advisory",
    },
    {
      id: "price_fairness_guide",
      text: "A price deviation of more than 20% below the mandi modal price is a strong indicator of exploitation. Deviations of 10-20% may suggest market friction. Anything within 10% of modal price is considered fair.",
      type: "advisory",
    },
    {
      id: "pm_kisan_scheme",
      text: "PM-KISAN scheme provides Rs. 6000/year direct income support to farmer families. All land-holding farmers except institutional landholders are eligible. Apply at pmkisan.gov.in.",
      type: "scheme",
    },
    {
      id: "pmfby_scheme",
      text: "PM Fasal Bima Yojana (PMFBY) is a crop insurance scheme covering all food crops, oilseeds, and commercial/horticultural crops. Premium is 2% for Kharif crops and 1.5% for Rabi crops.",
      type: "scheme",
    },
    {
      id: "market_timing_advice",
      text: "Generally, prices are lower immediately after harvest due to supply glut. Storing crops for 2-3 months post-harvest often yields 15-25% higher prices. States with Bhawantar Bhugtan Yojana (MP) offer price deficiency payments.",
      type: "advisory",
    },
    {
      id: "weather_price_correlation",
      text: "Unseasonal rainfall or drought increases vegetable prices by 30-80% within 2 weeks. Wheat prices typically rise 8-12% during summer (March-May). Onion and tomato show highest weather-price correlation.",
      type: "advisory",
    },
    {
      id: "apmc_regulations",
      text: "APMC (Agricultural Produce Market Committee) mandis are regulated markets. Commission agents (arthiyas) charge 2-2.5% for wheat and paddy. Farmers have the right to sell outside APMC in states with amended APMC acts.",
      type: "advisory",
    },
    {
      id: "e_nam_market",
      text: "e-NAM (National Agriculture Market) is an online trading platform connecting 1000+ mandis. Farmers can get better prices by accessing buyers from across India. Minimum lot size and quality standards apply.",
      type: "market",
    },
  ];

  for (const doc of documents) {
    await indexDocument(doc);
  }

  logger.info({ count: documents.length }, "RAG vector store seeded");
}

export interface RAGSource {
  text: string;
  type: string;
  relevanceScore: number;
}

export interface RAGResult {
  answer: string;
  sources: RAGSource[];
  latencyMs: number;
  model: string;
}

/**
 * Generation Layer: The main RAG query function.
 * 1. Retrieve relevant context documents
 * 2. Build an augmented prompt with context
 * 3. Generate answer using OpenAI GPT
 *
 * This is the core of the RAG pipeline.
 */
export async function ragQuery(
  query: string,
  extraContext?: { crop?: string; market?: string; state?: string },
): Promise<RAGResult> {
  const startTime = Date.now();

  // Step 1: Retrieval — find relevant knowledge base entries
  const retrieved = await retrieveContext(query, 5);

  // Step 2: Build context string from retrieved documents
  let contextStr = "";
  if (retrieved.length > 0) {
    contextStr =
      "\n\nRelevant information from the knowledge base:\n" +
      retrieved
        .map((r, i) => `[Source ${i + 1} - ${r.doc.type}]: ${r.doc.text}`)
        .join("\n\n");
  }

  // Add extra context if provided
  if (extraContext) {
    const parts = [];
    if (extraContext.crop) parts.push(`Crop: ${extraContext.crop}`);
    if (extraContext.market) parts.push(`Market: ${extraContext.market}`);
    if (extraContext.state) parts.push(`State: ${extraContext.state}`);
    if (parts.length > 0) {
      contextStr += `\n\nUser context: ${parts.join(", ")}`;
    }
  }

  // Step 3: Generation — use OpenAI to generate a helpful response
  const systemPrompt = `You are an expert agricultural market intelligence assistant helping Indian farmers make informed decisions. 
You have deep knowledge of:
- Mandi (wholesale market) prices across India
- Minimum Support Prices (MSP) for various crops
- Middleman exploitation patterns and how to detect them
- Government schemes for farmers
- Weather impacts on agricultural prices
- Market timing and selling strategies

Always provide:
1. Direct, actionable advice in simple language
2. Specific price comparisons when relevant
3. Warnings if exploitation is suspected
4. Recommendations for better alternatives

Be empathetic to farmers' challenges. Detect and flag any exploitation patterns.${contextStr}`;

  const model = process.env.OPENAI_MODEL ?? "gpt-5.2";

  const completion = await openai.chat.completions.create({
    model,
    max_tokens: 1024,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ],
  });

  const answer = completion.choices[0]?.message?.content ?? "I could not generate a response. Please try again.";
  const latencyMs = Date.now() - startTime;

  const sources: RAGSource[] = retrieved.map((r) => ({
    text: r.doc.text.substring(0, 200) + (r.doc.text.length > 200 ? "..." : ""),
    type: r.doc.type,
    relevanceScore: Math.round(r.score * 100) / 100,
  }));

  return { answer, sources, latencyMs, model };
}

/**
 * Price Fairness Engine
 * Compares a quoted price against mandi price and MSP to detect exploitation
 */
export function calculateFairnessScore(
  offeredPrice: number,
  mandiModalPrice: number,
  mspPrice: number | null,
): {
  deviationFromMandi: number;
  deviationFromMsp: number | null;
  anomalyScore: number;
  verdict: "fair" | "suspicious" | "exploitative";
} {
  const deviationFromMandi = ((offeredPrice - mandiModalPrice) / mandiModalPrice) * 100;
  const deviationFromMsp = mspPrice
    ? ((offeredPrice - mspPrice) / mspPrice) * 100
    : null;

  // Anomaly score: 0 = perfectly fair, 1 = completely exploitative
  // Based on deviation from mandi price and MSP
  let anomalyScore = 0;
  if (deviationFromMandi < -30) anomalyScore += 0.6;
  else if (deviationFromMandi < -20) anomalyScore += 0.4;
  else if (deviationFromMandi < -10) anomalyScore += 0.2;

  if (deviationFromMsp !== null) {
    if (deviationFromMsp < -20) anomalyScore += 0.4;
    else if (deviationFromMsp < -10) anomalyScore += 0.2;
    else if (deviationFromMsp < 0) anomalyScore += 0.1;
  }

  anomalyScore = Math.min(1, anomalyScore);

  let verdict: "fair" | "suspicious" | "exploitative";
  if (anomalyScore >= 0.6) verdict = "exploitative";
  else if (anomalyScore >= 0.25) verdict = "suspicious";
  else verdict = "fair";

  return {
    deviationFromMandi: Math.round(deviationFromMandi * 100) / 100,
    deviationFromMsp: deviationFromMsp !== null ? Math.round(deviationFromMsp * 100) / 100 : null,
    anomalyScore: Math.round(anomalyScore * 1000) / 1000,
    verdict,
  };
}
