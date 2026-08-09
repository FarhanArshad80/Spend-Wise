import { Router, type IRouter } from "express";
import { eq, and, sql, gte, lte } from "drizzle-orm";
import { db, transactionsTable, budgetsTable, budgetAlertsTable, categoriesTable } from "@workspace/db";
import {
  GetDashboardSummaryQueryParams,
  GetSpendingByCategoryQueryParams,
  GetBudgetVsActualQueryParams,
  GetTriggeredAlertsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

function monthBounds(month: string): { start: string; end: string } {
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(year, mon, 0).getDate();
  return { start: `${month}-01`, end: `${month}-${String(lastDay).padStart(2, "0")}` };
}

router.get("/reports/dashboard-summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = GetDashboardSummaryQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const month = query.data.month ?? currentMonth();
  const { start, end } = monthBounds(month);

  const [incomeRow] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "income"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));

  const [expenseRow] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));

  const [overallBudget] = await db
    .select({ amount: budgetsTable.amount })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month), eq(budgetsTable.type, "overall")));

  const totalIncome = Number(incomeRow?.total ?? 0);
  const totalExpenses = Number(expenseRow?.total ?? 0);
  const monthlyBudget = overallBudget ? Number(overallBudget.amount) : null;
  const budgetRemaining = monthlyBudget !== null ? monthlyBudget - totalExpenses : null;
  const budgetPercentUsed = monthlyBudget && monthlyBudget > 0 ? (totalExpenses / monthlyBudget) * 100 : null;

  res.json({
    month,
    totalIncome,
    totalExpenses,
    currentBalance: totalIncome - totalExpenses,
    monthlyBudget,
    budgetSpent: totalExpenses,
    budgetRemaining,
    budgetPercentUsed: budgetPercentUsed !== null ? Math.round(budgetPercentUsed * 100) / 100 : null,
  });
});

router.get("/reports/spending-by-category", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = GetSpendingByCategoryQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const month = query.data.month ?? currentMonth();
  const { start, end } = monthBounds(month);

  const rows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      color: categoriesTable.color,
      total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`))
    .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.color)
    .orderBy(sql`sum(cast(${transactionsTable.amount} as numeric)) DESC`);

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);
  res.json(rows.map((r) => ({
    categoryId: r.categoryId,
    categoryName: r.categoryName ?? "Unknown",
    amount: Number(r.total),
    percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 10000) / 100 : 0,
    color: r.color,
  })));
});

router.get("/reports/monthly-trend", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }

  const results = await Promise.all(
    months.map(async (month) => {
      const { start, end } = monthBounds(month);
      const [inc] = await db.select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "income"),
          sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));
      const [exp] = await db.select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
        .from(transactionsTable)
        .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
          sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));
      const income = Number(inc?.total ?? 0);
      const expenses = Number(exp?.total ?? 0);
      return { month, income, expenses, balance: income - expenses };
    })
  );

  res.json(results);
});

router.get("/reports/budget-vs-actual", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = GetBudgetVsActualQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const month = query.data.month ?? currentMonth();
  const { start, end } = monthBounds(month);

  const budgets = await db
    .select({
      id: budgetsTable.id,
      amount: budgetsTable.amount,
      type: budgetsTable.type,
      categoryId: budgetsTable.categoryId,
      categoryName: categoriesTable.name,
    })
    .from(budgetsTable)
    .leftJoin(categoriesTable, eq(budgetsTable.categoryId, categoriesTable.id))
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const [totalExpRow] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));

  const catRows = await db
    .select({ categoryId: transactionsTable.categoryId, total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`))
    .groupBy(transactionsTable.categoryId);

  const spendingByCat = new Map(catRows.map((r) => [r.categoryId, Number(r.total)]));
  const totalExpenses = Number(totalExpRow?.total ?? 0);

  res.json(budgets.map((b) => {
    const budget = Number(b.amount);
    const actual = b.type === "overall" ? totalExpenses : (spendingByCat.get(b.categoryId ?? 0) ?? 0);
    const remaining = budget - actual;
    return {
      name: b.type === "overall" ? "Overall" : (b.categoryName ?? "Unknown"),
      budget,
      actual,
      remaining,
      percentUsed: budget > 0 ? Math.round((actual / budget) * 10000) / 100 : 0,
      type: b.type,
      categoryId: b.categoryId,
    };
  }));
});

router.get("/reports/weekly-summary", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(weekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setDate(weekStart.getDate() - 1);

  const fmt = (d: Date) => d.toISOString().split("T")[0];

  const [curExp] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${fmt(weekStart)}`, sql`${transactionsTable.date} <= ${fmt(weekEnd)}`));

  const [prevExp] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${fmt(prevWeekStart)}`, sql`${transactionsTable.date} <= ${fmt(prevWeekEnd)}`));

  const topCatRows = await db
    .select({
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      color: categoriesTable.color,
      total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)`,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${fmt(weekStart)}`, sql`${transactionsTable.date} <= ${fmt(weekEnd)}`))
    .groupBy(transactionsTable.categoryId, categoriesTable.name, categoriesTable.color)
    .orderBy(sql`sum(cast(${transactionsTable.amount} as numeric)) DESC`)
    .limit(3);

  const totalSpent = Number(curExp?.total ?? 0);
  const prevSpent = Number(prevExp?.total ?? 0);
  const grandTotal = topCatRows.reduce((s, r) => s + Number(r.total), 0);

  // Budget progress
  const month = currentMonth();
  const { start: mStart, end: mEnd } = monthBounds(month);
  const [overallBudget] = await db.select({ amount: budgetsTable.amount })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month), eq(budgetsTable.type, "overall")));
  const [monthExp] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${mStart}`, sql`${transactionsTable.date} <= ${mEnd}`));
  const budgetProgress = overallBudget && Number(overallBudget.amount) > 0
    ? Math.round((Number(monthExp?.total ?? 0) / Number(overallBudget.amount)) * 10000) / 100
    : 0;

  res.json({
    weekStart: fmt(weekStart),
    weekEnd: fmt(weekEnd),
    totalSpent,
    previousWeekSpent: prevSpent,
    percentChange: prevSpent > 0 ? Math.round(((totalSpent - prevSpent) / prevSpent) * 10000) / 100 : 0,
    topCategories: topCatRows.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName ?? "Unknown",
      amount: Number(r.total),
      percentage: grandTotal > 0 ? Math.round((Number(r.total) / grandTotal) * 10000) / 100 : 0,
      color: r.color,
    })),
    budgetProgress,
  });
});

router.get("/reports/triggered-alerts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = GetTriggeredAlertsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const month = query.data.month ?? currentMonth();
  const { start, end } = monthBounds(month);

  const alerts = await db
    .select({
      id: budgetAlertsTable.id,
      type: budgetAlertsTable.type,
      categoryId: budgetAlertsTable.categoryId,
      categoryName: categoriesTable.name,
      threshold: budgetAlertsTable.threshold,
    })
    .from(budgetAlertsTable)
    .leftJoin(categoriesTable, eq(budgetAlertsTable.categoryId, categoriesTable.id))
    .where(eq(budgetAlertsTable.userId, userId));

  const [totalExpRow] = await db
    .select({ total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`));

  const catRows = await db
    .select({ categoryId: transactionsTable.categoryId, total: sql<number>`coalesce(sum(cast(${transactionsTable.amount} as numeric)), 0)` })
    .from(transactionsTable)
    .where(and(eq(transactionsTable.userId, userId), eq(transactionsTable.type, "expense"),
      sql`${transactionsTable.date} >= ${start}`, sql`${transactionsTable.date} <= ${end}`))
    .groupBy(transactionsTable.categoryId);

  const spendingByCat = new Map(catRows.map((r) => [r.categoryId, Number(r.total)]));
  const totalExpenses = Number(totalExpRow?.total ?? 0);

  const budgetRows = await db
    .select({ type: budgetsTable.type, categoryId: budgetsTable.categoryId, amount: budgetsTable.amount })
    .from(budgetsTable)
    .where(and(eq(budgetsTable.userId, userId), eq(budgetsTable.month, month)));

  const overallBudget = budgetRows.find((b) => b.type === "overall");
  const catBudgets = new Map(budgetRows.filter((b) => b.type === "category").map((b) => [b.categoryId, Number(b.amount)]));

  const triggered = alerts.filter((a) => {
    const threshold = Number(a.threshold);
    if (a.type === "overall") {
      if (!overallBudget) return false;
      const pct = (totalExpenses / Number(overallBudget.amount)) * 100;
      return pct >= threshold;
    } else {
      const catBudget = catBudgets.get(a.categoryId ?? 0);
      if (!catBudget) return false;
      const spent = spendingByCat.get(a.categoryId ?? 0) ?? 0;
      return (spent / catBudget) * 100 >= threshold;
    }
  }).map((a) => {
    const threshold = Number(a.threshold);
    const budgetAmount = a.type === "overall"
      ? Number(overallBudget?.amount ?? 0)
      : (catBudgets.get(a.categoryId ?? 0) ?? 0);
    const amount = a.type === "overall" ? totalExpenses : (spendingByCat.get(a.categoryId ?? 0) ?? 0);
    return {
      alertId: a.id,
      type: a.type,
      categoryId: a.categoryId,
      categoryName: a.categoryName,
      threshold,
      currentPercentage: budgetAmount > 0 ? Math.round((amount / budgetAmount) * 10000) / 100 : 0,
      amount,
      budgetAmount,
    };
  });

  res.json(triggered);
});

export default router;
