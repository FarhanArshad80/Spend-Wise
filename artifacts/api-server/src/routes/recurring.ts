import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, recurringTransactionsTable, categoriesTable, transactionsTable } from "@workspace/db";
import {
  CreateRecurringBody,
  UpdateRecurringBody,
  UpdateRecurringParams,
  DeleteRecurringParams,
  ProcessRecurringParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/recurring", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  const rows = await db
    .select({
      id: recurringTransactionsTable.id,
      userId: recurringTransactionsTable.userId,
      type: recurringTransactionsTable.type,
      amount: recurringTransactionsTable.amount,
      categoryId: recurringTransactionsTable.categoryId,
      categoryName: categoriesTable.name,
      recurringDay: recurringTransactionsTable.recurringDay,
      note: recurringTransactionsTable.note,
      isActive: recurringTransactionsTable.isActive,
      lastProcessedDate: recurringTransactionsTable.lastProcessedDate,
      createdAt: recurringTransactionsTable.createdAt,
      updatedAt: recurringTransactionsTable.updatedAt,
    })
    .from(recurringTransactionsTable)
    .leftJoin(categoriesTable, eq(recurringTransactionsTable.categoryId, categoriesTable.id))
    .where(eq(recurringTransactionsTable.userId, userId))
    .orderBy(recurringTransactionsTable.createdAt);

  res.json(rows.map((r) => ({ ...r, amount: Number(r.amount) })));
});

router.post("/recurring", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateRecurringBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(recurringTransactionsTable)
    .values({
      userId,
      type: parsed.data.type,
      amount: String(parsed.data.amount),
      categoryId: Math.round(parsed.data.categoryId),
      recurringDay: Math.round(parsed.data.recurringDay),
      note: parsed.data.note ?? null,
      isActive: true,
    })
    .returning();

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));

  res.status(201).json({ ...row, amount: Number(row.amount), categoryName: category?.name ?? null });
});

router.patch("/recurring/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = UpdateRecurringParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRecurringBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const updateData: Record<string, unknown> = {};
  if (parsed.data.type !== undefined) updateData.type = parsed.data.type;
  if (parsed.data.amount !== undefined) updateData.amount = String(parsed.data.amount);
  if (parsed.data.categoryId !== undefined) updateData.categoryId = Math.round(parsed.data.categoryId);
  if (parsed.data.recurringDay !== undefined) updateData.recurringDay = Math.round(parsed.data.recurringDay);
  if (parsed.data.note !== undefined) updateData.note = parsed.data.note;
  if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

  const [row] = await db
    .update(recurringTransactionsTable)
    .set(updateData)
    .where(and(eq(recurringTransactionsTable.id, id), eq(recurringTransactionsTable.userId, userId)))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Recurring transaction not found" });
    return;
  }

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, row.categoryId));

  res.json({ ...row, amount: Number(row.amount), categoryName: category?.name ?? null });
});

router.delete("/recurring/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = DeleteRecurringParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  await db
    .delete(recurringTransactionsTable)
    .where(and(eq(recurringTransactionsTable.id, id), eq(recurringTransactionsTable.userId, userId)));

  res.sendStatus(204);
});

router.post("/recurring/:id/process", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = ProcessRecurringParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const [recurring] = await db
    .select()
    .from(recurringTransactionsTable)
    .where(and(eq(recurringTransactionsTable.id, id), eq(recurringTransactionsTable.userId, userId)));

  if (!recurring) {
    res.status(404).json({ error: "Recurring transaction not found" });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  const [tx] = await db
    .insert(transactionsTable)
    .values({
      userId,
      type: recurring.type,
      amount: recurring.amount,
      categoryId: recurring.categoryId,
      date: today,
      note: recurring.note,
      recurringId: recurring.id,
    })
    .returning();

  await db
    .update(recurringTransactionsTable)
    .set({ lastProcessedDate: today })
    .where(eq(recurringTransactionsTable.id, id));

  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, tx.categoryId));

  res.status(201).json({ ...tx, amount: Number(tx.amount), categoryName: category?.name ?? null });
});

export default router;
