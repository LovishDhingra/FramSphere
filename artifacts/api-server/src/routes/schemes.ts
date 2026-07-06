import { Router, type IRouter } from "express";
import { db, schemesTable } from "@workspace/db";
import { ListSchemesQueryParams, ListSchemesResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/schemes", async (req, res): Promise<void> => {
  const parsed = ListSchemesQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const rows = await db.select().from(schemesTable).orderBy(schemesTable.name);

  const result = rows.map((r) => ({
    ...r,
    applicationUrl: r.applicationUrl ?? null,
    applicableCrops: r.applicableCrops ?? [],
    applicableStates: r.applicableStates ?? [],
    deadline: r.deadline ?? null,
  }));

  res.json(ListSchemesResponse.parse(result));
});

export default router;
