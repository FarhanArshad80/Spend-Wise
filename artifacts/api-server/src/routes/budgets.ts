import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, budgetsTable, transactionsTable, categoriesTable } from "@workspace/db";
import {
  CreateBudgetBody,
  UpdateBudgetBody,
  UpdateBudgetParams,
  DeleteBudgetParams,
  ListBudgetsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

router.get("/budgets", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = ListBudgetsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const month = query.data.month ?? currentMonth();

  const budgets = await db
    .select({
      id: budgetsTable.id,
      userId: budgetsTable.userId,
      month: budgetsTable.month,
      amount: budgetsTable.amount,
      type: budgetsTable.type,
      categoryId: budgetsTable.categoryId,
      categoryName: categoriesTable.name,
      createdAt: budgetsTable.createdAt,
      updatedAt: budgetsTable.updatedAt,
    })
    .from(budgetsTable)
    .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  // Compute spent/remaining per budget
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-31`;

  const spendingRows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      total: sql<number>`sum(cast(${transactionsTable.amount} as numeric))`,
    })
    .from(transactionsTable)
    .where(
      and(
        eq(transactionsTable.userId, userId),
        eq(transactionsTable.type, "expense"),
        sql`${transactionsTable.date} >= ${monthStart}`,
        sql`${transactionsTable.date} <= ${monthEnd}`,
      ),
    )
    .groupBy(transactionsTable.categoryId);

  const totalExpenses = spendingRows.reduce((sum, r) => sum + Number(r.total), 0);
  const spendingByCat = new Map(spendingRows.map((r) => [r.categoryId, Number(r.total)]));

  const result = budgets.map((b) => {
    const budgetAmount = Number(b.amount);
    const spent = b.type === "overall" ? totalExpenses : (spendingByCat.get(b.categoryId ?? 0) ?? 0);
    const remaining = budgetAmount - spent;
    const percentUsed = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0;
    return {
      ...b,
      amount: budgetAmount,
      spent,
      remaining,
      percentUsed: Math.round(percentUsed * 100) / 100,
    };
  });

  res.json(result);
});

router.post("/budgets", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [budget] = await db
    .insert(budgetsTable)
    .values({
      userId,
      month: parsed.data.month,
      amount: String(parsed.data.amount),
      type: parsed.data.type,
      categoryId: parsed.data.categoryId ? Math.round(parsed.data.categoryId) : undefined,
    })
    .returning();

  res.status(201).json({ ...budget, amount: Number(budget.amount), spent: 0, remaining: Number(budget.amount), percentUsed: 0, categoryName: null });
});

router.patch("/budgets/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = UpdateBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBudgetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const [budget] = await db
    .update(budgetsTable)
    .set({ amount: parsed.data.amount !== undefined ? String(parsed.data.amount) : undefined })
    .where(and(eq(budgetsTable.id, id), eq(budgetsTable.userId, userId)))
    .returning();

  if (!budget) {
    res.status(404).json({ error: "Budget not found" });
    return;
  }

  res.json({ ...budget, amount: Number(budget.amount), categoryName: null });
});

router.delete("/budgets/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = DeleteBudgetParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  await db
    .delete(budgetsTable)
    .where(and(eq(budgetsTable.id, id), eq(budgetsTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
