import { Router, type IRouter } from "express";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";
import { db, transactionsTable, categoriesTable } from "@workspace/db";
import {
  CreateTransactionBody,
  UpdateTransactionBody,
  UpdateTransactionParams,
  GetTransactionParams,
  DeleteTransactionParams,
  ListTransactionsQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = ListTransactionsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const {
    type,
    categoryId,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    search,
    limit = 50,
    offset = 0,
  } = query.data;

  const conditions = [eq(transactionsTable.userId, userId)];
  if (type) conditions.push(eq(transactionsTable.type, type));
  if (categoryId) conditions.push(eq(transactionsTable.categoryId, Math.round(categoryId)));
  if (dateFrom) conditions.push(gte(transactionsTable.date, dateFrom));
  if (dateTo) conditions.push(lte(transactionsTable.date, dateTo));
  if (amountMin) conditions.push(gte(transactionsTable.amount, String(amountMin)));
  if (amountMax) conditions.push(lte(transactionsTable.amount, String(amountMax)));
  if (search) conditions.push(like(transactionsTable.note, `%${search}%`));

  const [data, countResult] = await Promise.all([
    db
      .select({
        id: transactionsTable.id,
        userId: transactionsTable.userId,
        type: transactionsTable.type,
        amount: transactionsTable.amount,
        categoryId: transactionsTable.categoryId,
        categoryName: categoriesTable.name,
        date: transactionsTable.date,
        note: transactionsTable.note,
        recurringId: transactionsTable.recurringId,
        createdAt: transactionsTable.createdAt,
        updatedAt: transactionsTable.updatedAt,
      })
      .from(transactionsTable)
      .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
      .where(and(...conditions))
      .orderBy(sql`${transactionsTable.date} DESC, ${transactionsTable.createdAt} DESC`)
      .limit(Math.round(limit))
      .offset(Math.round(offset)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(transactionsTable)
      .where(and(...conditions)),
  ]);

  res.json({
    data: data.map((t) => ({ ...t, amount: Number(t.amount) })),
    total: Number(countResult[0]?.count ?? 0),
  });
});

router.post("/transactions", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId,
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      categoryId: Math.round(parsed.data.categoryId),
      date: parsed.data.date,
      note: parsed.data.note ?? null,
    })
    .returning();

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, tx.categoryId));

  res.status(201).json({ ...tx, amount: Number(tx.amount), categoryName: category?.name ?? null });
});

router.get("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = GetTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const [tx] = await db
    .select({
      id: transactionsTable.id,
      userId: transactionsTable.userId,
      type: transactionsTable.type,
      amount: transactionsTable.amount,
      categoryId: transactionsTable.categoryId,
      categoryName: categoriesTable.name,
      date: transactionsTable.date,
      note: transactionsTable.note,
      recurringId: transactionsTable.recurringId,
      createdAt: transactionsTable.createdAt,
      updatedAt: transactionsTable.updatedAt,
    })
    .from(transactionsTable)
    .leftJoin(categoriesTable, eq(transactionsTable.categoryId, categoriesTable.id))
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  res.json({ ...tx, amount: Number(tx.amount) });
});

router.patch("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = UpdateTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTransactionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const updateData: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.categoryId !== undefined) updateData.categoryId = Math.round(parsed.data.categoryId);
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.note !== undefined) updateData.note = parsed.data.note;

  const [tx] = await db
    .update(transactionsTable)
    .set(updateData)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)))
    .returning();

  if (!tx) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, tx.categoryId));

  res.json({ ...tx, amount: Number(tx.amount), categoryName: category?.name ?? null });
});

router.delete("/transactions/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = DeleteTransactionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  await db
    .delete(transactionsTable)
    .where(and(eq(transactionsTable.id, id), eq(transactionsTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
