import { Router, type IRouter } from "express";
import { and, eq, desc } from "drizzle-orm";
import { db, alertsTable } from "@workspace/db";
import { ListAlertsQueryParams, ListAlertsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/alerts", async (req, res): Promise<void> => {
  const parsed = ListAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { state, severity } = parsed.data;

  const conditions = [];
  if (state) conditions.push(eq(alertsTable.state, state));
  if (severity) conditions.push(eq(alertsTable.severity, severity));

  const rows = await db
    .select()
    .from(alertsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(alertsTable.createdAt))
    .limit(100);

  const result = rows.map((r) => ({
    ...r,
    type: r.type as "exploitation" | "anomaly" | "msp_violation" | "market_crash",
    severity: r.severity as "low" | "medium" | "high" | "critical",
    affectedFarmers: r.affectedFarmers ?? null,
    createdAt: r.createdAt.toISOString(),
  }));

  res.json(ListAlertsResponse.parse(result));
});

export default router;
