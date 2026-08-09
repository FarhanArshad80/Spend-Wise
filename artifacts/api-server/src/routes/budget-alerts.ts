import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, budgetAlertsTable, categoriesTable } from "@workspace/db";
import {
  CreateBudgetAlertBody,
  UpdateBudgetAlertBody,
  UpdateBudgetAlertParams,
  DeleteBudgetAlertParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/budget-alerts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const rows = await db
    .select({
      id: budgetAlertsTable.id,
      userId: budgetAlertsTable.userId,
      type: budgetAlertsTable.type,
      categoryId: budgetAlertsTable.categoryId,
      categoryName: categoriesTable.name,
      threshold: budgetAlertsTable.threshold,
      createdAt: budgetAlertsTable.createdAt,
      updatedAt: budgetAlertsTable.updatedAt,
    })
    .from(budgetAlertsTable)
    .leftJoin(categoriesTable, eq(budgetAlertsTable.categoryId, categoriesTable.id))
    .where(eq(budgetAlertsTable.userId, userId));

  res.json(rows.map((r) => ({ ...r, threshold: Number(r.threshold) })));
});

router.post("/budget-alerts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateBudgetAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(budgetAlertsTable)
    .values({
      userId,
      type: parsed.data.type,
      categoryId: parsed.data.categoryId ? Math.round(parsed.data.categoryId) : undefined,
      threshold: String(parsed.data.threshold),
    })
    .returning();

  res.status(201).json({ ...row, threshold: Number(row.threshold), categoryName: null });
});

router.patch("/budget-alerts/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = UpdateBudgetAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBudgetAlertBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const [row] = await db
    .update(budgetAlertsTable)
    .set({ threshold: parsed.data.threshold !== undefined ? String(parsed.data.threshold) : undefined })
    .where(and(eq(budgetAlertsTable.id, id), eq(budgetAlertsTable.userId, userId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Budget alert not found" });
    return;
  }

  res.json({ ...row, threshold: Number(row.threshold), categoryName: null });
});

router.delete("/budget-alerts/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = DeleteBudgetAlertParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  await db
    .delete(budgetAlertsTable)
    .where(and(eq(budgetAlertsTable.id, id), eq(budgetAlertsTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
