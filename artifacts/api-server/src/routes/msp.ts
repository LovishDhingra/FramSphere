import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, mspTable } from "@workspace/db";
import { ListMspQueryParams, ListMspResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/msp", async (req, res): Promise<void> => {
  const parsed = ListMspQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { crop, year } = parsed.data;

  const conditions = [];
  if (crop) conditions.push(eq(mspTable.crop, crop));
  if (year) conditions.push(eq(mspTable.year, year));

  const rows = await db
    .select()
    .from(mspTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(mspTable.year, mspTable.crop);

  const result = rows.map((r) => ({
    ...r,
    variety: r.variety ?? null,
    mspPrice: Number(r.mspPrice),
  }));

  res.json(ListMspResponse.parse(result));
});

export default router;
