import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, chatMessagesTable } from "@workspace/db";
import {
  ChatQueryBody,
  ChatQueryResponse,
  GetChatHistoryQueryParams,
  GetChatHistoryResponse,
} from "@workspace/api-zod";
import { ragQuery, seedVectorStore } from "../lib/rag";
import { randomUUID } from "crypto";

const router: IRouter = Router();

/**
 * POST /chat
 * RAG-powered chatbot endpoint. When the user is authenticated via Clerk,
 * uses their userId as the sessionId so each user gets a private chat history.
 */
router.post("/chat", async (req, res): Promise<void> => {
  const parsed = ChatQueryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { query, sessionId: incomingSessionId, context } = parsed.data;

  await seedVectorStore();

  const { userId } = getAuth(req);
  const sessionId = userId ?? incomingSessionId ?? randomUUID();

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content: query,
    latencyMs: null,
  });

  const ragResult = await ragQuery(query, context ?? {});

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "assistant",
    content: ragResult.answer,
    latencyMs: ragResult.latencyMs,
  });

  const result = {
    answer: ragResult.answer,
    sources: ragResult.sources,
    sessionId,
    latencyMs: ragResult.latencyMs,
    model: ragResult.model,
  };

  res.json(ChatQueryResponse.parse(result));
});

/**
 * GET /chat/history
 * Returns chat history for the authenticated user (filtered by their userId).
 * Falls back to returning recent global messages if not authenticated.
 */
router.get("/chat/history", async (req, res): Promise<void> => {
  const parsed = GetChatHistoryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { limit } = parsed.data;

  const { userId } = getAuth(req);

  const rows = userId
    ? await db
        .select()
        .from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, userId))
        .orderBy(desc(chatMessagesTable.createdAt))
        .limit(limit ?? 20)
    : await db
        .select()
        .from(chatMessagesTable)
        .orderBy(desc(chatMessagesTable.createdAt))
        .limit(limit ?? 20);

  const result = rows.reverse().map((r) => ({
    ...r,
    role: r.role as "user" | "assistant",
    createdAt: r.createdAt.toISOString(),
    latencyMs: r.latencyMs ?? null,
  }));

  res.json(GetChatHistoryResponse.parse(result));
});

export default router;
