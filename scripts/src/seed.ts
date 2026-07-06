/**
 * Database seed script — run once on a fresh database to populate curated
 * reference data that has no live public API (MSP rates, government
 * schemes) plus a few illustrative demo alerts.
 *
 * Markets and mandi prices are NOT seeded here — they are synced live from
 * data.gov.in on API server boot and every 6 hours (see
 * artifacts/api-server/src/lib/syncMandiData.ts). Do not add synthetic
 * market/price data back here.
 *
 * Usage: pnpm --filter @workspace/scripts run seed
 */

import {
  mspTable,
  alertsTable,
  schemesTable,
} from "../../lib/db/src/schema/index.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. Copy .env.example to .env and fill it in.");
}

const DATABASE_URL = process.env.DATABASE_URL;
const isNeon = DATABASE_URL.includes("neon.tech");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any;

if (isNeon) {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = await import("ws");
  neonConfig.webSocketConstructor = ws.default;
  pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, {});
} else {
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");
  pool = new pg.default.Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, {});
}

// ─── Alerts ───────────────────────────────────────────────────────────────────

const alerts = [
  {
    type: "exploitation",
    crop: "Wheat",
    market: "Khanna Mandi",
    state: "Punjab",
    severity: "high",
    title: "Price Suppression Detected at Khanna Mandi",
    description: "Multiple farmers reported being offered Rs. 1850/quintal for wheat against the mandi modal price of Rs. 2420. Arthiyas are citing artificial moisture content issues.",
    affectedFarmers: 450,
    isResolved: false,
  },
  {
    type: "msp_violation",
    crop: "Paddy",
    market: "Patna Market",
    state: "Bihar",
    severity: "critical",
    title: "MSP Violation - Paddy Prices Below Support Price",
    description: "Paddy prices at Patna Market have dropped to Rs. 1980/quintal, below the MSP of Rs. 2300. Immediate government procurement needed.",
    affectedFarmers: 1200,
    isResolved: false,
  },
  {
    type: "anomaly",
    crop: "Onion",
    market: "Azadpur Mandi",
    state: "Delhi",
    severity: "medium",
    title: "Unusual Price Drop in Onion Arrivals",
    description: "Onion prices fell 28% in 3 days at Azadpur despite reduced arrivals. Possible hoarding or market manipulation suspected.",
    affectedFarmers: 180,
    isResolved: false,
  },
  {
    type: "market_crash",
    crop: "Tomato",
    market: "Lasalgaon Mandi",
    state: "Maharashtra",
    severity: "high",
    title: "Tomato Price Crash - Flash Supply Surge",
    description: "Tomato prices crashed 45% due to sudden supply surge from Karnataka. Farmers advised to delay arrivals by 5-7 days if storage is available.",
    affectedFarmers: 320,
    isResolved: false,
  },
  {
    type: "exploitation",
    crop: "Cotton",
    market: "Rajkot Mandi",
    state: "Gujarat",
    severity: "high",
    title: "Cotton Quality Fraud Reported",
    description: "Traders allegedly using tampered moisture meters to classify Grade A cotton as Grade B, resulting in 15-20% price reduction for farmers.",
    affectedFarmers: 95,
    isResolved: false,
  },
  {
    type: "anomaly",
    crop: "Mustard",
    market: "Kota Mandi",
    state: "Rajasthan",
    severity: "medium",
    title: "Mustard Prices 12% Below MSP",
    description: "Current mustard prices at Kota Mandi are Rs. 5220/quintal against MSP of Rs. 5950. Farmers urged to approach government procurement centers.",
    affectedFarmers: 275,
    isResolved: false,
  },
  {
    type: "market_crash",
    crop: "Paddy",
    market: "Warangal Mandi",
    state: "Telangana",
    severity: "critical",
    title: "Warangal Paddy Market Oversupply Crisis",
    description: "Unprecedented paddy arrivals causing severe price depression. State procurement machinery overwhelmed. Government intervention requested.",
    affectedFarmers: 2100,
    isResolved: false,
  },
];

// ─── Government Schemes ───────────────────────────────────────────────────────

const schemes = [
  {
    name: "PM Kisan Samman Nidhi (PM-KISAN)",
    ministry: "Ministry of Agriculture",
    description: "Direct income support to farmer families owning cultivable land. Rs. 6000 per year transferred in three equal installments.",
    eligibility: "All land-holding farmer families with cultivable land. Excludes institutional landholders, government employees, income taxpayers, and professionals.",
    benefit: "Rs. 6000 per year direct bank transfer in three installments of Rs. 2000 each (April, August, December).",
    applicationUrl: "https://pmkisan.gov.in",
    applicableCrops: [],
    applicableStates: [],
    deadline: null,
  },
  {
    name: "PM Fasal Bima Yojana (PMFBY)",
    ministry: "Ministry of Agriculture",
    description: "Comprehensive crop insurance covering pre-sowing to post-harvest losses due to natural calamities, pests, and diseases.",
    eligibility: "All farmers including sharecroppers and tenant farmers growing notified crops. Compulsory for loanee farmers.",
    benefit: "Premium: 2% for Kharif crops, 1.5% for Rabi food crops, 5% for horticulture/commercial crops. Balance premium paid by Government.",
    applicationUrl: "https://pmfby.gov.in",
    applicableCrops: ["Wheat", "Paddy", "Maize", "Cotton", "Soybean", "Mustard", "Groundnut"],
    applicableStates: [],
    deadline: "15 Jul",
  },
  {
    name: "Kisan Credit Card (KCC)",
    ministry: "Ministry of Finance",
    description: "Provides farmers with affordable credit for agricultural needs including seeds, fertilisers, and post-harvest expenses.",
    eligibility: "All farmers including small, marginal, oral lessees, and sharecroppers. Allied activities and non-farm income also covered.",
    benefit: "Credit up to Rs. 3 lakh at 7% interest rate (effective 4% with government interest subvention). No processing fee for loans up to Rs. 3 lakh.",
    applicationUrl: "https://agricoop.nic.in",
    applicableCrops: [],
    applicableStates: [],
    deadline: null,
  },
  {
    name: "Pradhan Mantri Krishi Sinchayee Yojana (PMKSY)",
    ministry: "Ministry of Jal Shakti",
    description: "Har Khet Ko Pani — ensuring irrigation access to every farm. Promotes micro-irrigation (drip and sprinkler) for water use efficiency.",
    eligibility: "All farmers. Priority to small and marginal farmers. SC/ST farmers get additional 10% subsidy.",
    benefit: "55-75% subsidy on drip and sprinkler irrigation systems. Subsidised water connections. Free drip irrigation kits for small farmers.",
    applicationUrl: "https://pmksy.gov.in",
    applicableCrops: [],
    applicableStates: [],
    deadline: null,
  },
  {
    name: "National Agriculture Market (e-NAM)",
    ministry: "Ministry of Agriculture",
    description: "Pan-India electronic trading portal networking existing APMC mandis. Enables farmers to sell produce online across state borders.",
    eligibility: "Any farmer registered at a linked APMC mandi. Requires Aadhaar card and bank account.",
    benefit: "Access to national market. Transparent auction process. Payment within 24 hours. No middlemen. Better price discovery.",
    applicationUrl: "https://enam.gov.in",
    applicableCrops: ["Wheat", "Paddy", "Maize", "Cotton", "Onion", "Tomato", "Mustard"],
    applicableStates: ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Rajasthan", "Maharashtra", "Gujarat"],
    deadline: null,
  },
  {
    name: "Soil Health Card Scheme",
    ministry: "Ministry of Agriculture",
    description: "Provides farmers a soil health card with crop-wise recommendations on nutrients and fertilisers to improve productivity.",
    eligibility: "All farmers. Soil tested once every 2 years.",
    benefit: "Free soil testing. Personalised fertiliser recommendations. Reduces input costs by 8-10%. Improves yield by 5-6%.",
    applicationUrl: "https://soilhealth.dac.gov.in",
    applicableCrops: [],
    applicableStates: [],
    deadline: null,
  },
  {
    name: "Pradhan Mantri Annadata Aay Sanrakshan Abhiyan (PM-AASHA)",
    ministry: "Ministry of Agriculture",
    description: "Price support mechanism to protect farmers from market price crash. Includes Price Support Scheme (PSS) and Price Deficiency Payment Scheme (PDPS).",
    eligibility: "Farmers growing oilseeds, pulses, and copra notified under the scheme in states that have opted in.",
    benefit: "Government procurement at MSP when market prices fall below MSP. Direct bank transfer of price difference under PDPS.",
    applicationUrl: "https://agricoop.nic.in",
    applicableCrops: ["Mustard", "Groundnut", "Soybean", "Gram", "Lentil", "Sunflower"],
    applicableStates: ["Rajasthan", "Madhya Pradesh", "Maharashtra", "Uttar Pradesh", "Karnataka"],
    deadline: null,
  },
];

// ─── MSP Records (curated — no verified live government API exists) ─────────

const mspRecords = [
  { crop: "Wheat", variety: "Lokwan", mspPrice: "2275", season: "Rabi", year: 2025, announcedBy: "Government of India" },
  { crop: "Paddy", variety: "Common", mspPrice: "2300", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Cotton", variety: "Medium Staple", mspPrice: "7121", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Maize", variety: "General", mspPrice: "2225", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Soybean", variety: "Yellow", mspPrice: "4892", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Groundnut", variety: "General", mspPrice: "6783", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Sunflower", variety: "General", mspPrice: "7280", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Mustard", variety: "General", mspPrice: "5950", season: "Rabi", year: 2025, announcedBy: "Government of India" },
  { crop: "Gram", variety: "General", mspPrice: "5650", season: "Rabi", year: 2025, announcedBy: "Government of India" },
  { crop: "Lentil", variety: "General", mspPrice: "6425", season: "Rabi", year: 2025, announcedBy: "Government of India" },
  { crop: "Jowar", variety: "Hybrid", mspPrice: "3371", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Bajra", variety: "General", mspPrice: "2625", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Ragi", variety: "General", mspPrice: "4290", season: "Kharif", year: 2025, announcedBy: "Government of India" },
  { crop: "Sugarcane", variety: "General", mspPrice: "370", season: "Annual", year: 2025, announcedBy: "Government of India" },
  { crop: "Onion", variety: "Red", mspPrice: "800", season: "Annual", year: 2025, announcedBy: "Government of India" },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting database seed (curated reference data only)...\n");
  console.log("   Markets and mandi prices are populated separately by the live");
  console.log("   data.gov.in sync when the API server boots — not seeded here.\n");

  console.log("💰 Seeding MSP records...");
  await db.insert(mspTable).values(mspRecords);
  console.log(`   ✓ ${mspRecords.length} MSP records inserted`);

  console.log("🚨 Seeding alerts...");
  await db.insert(alertsTable).values(alerts);
  console.log(`   ✓ ${alerts.length} alerts inserted`);

  console.log("📋 Seeding government schemes...");
  await db.insert(schemesTable).values(schemes);
  console.log(`   ✓ ${schemes.length} schemes inserted`);

  console.log("\n✅ Seed complete! Your database is ready.");
  await pool.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
