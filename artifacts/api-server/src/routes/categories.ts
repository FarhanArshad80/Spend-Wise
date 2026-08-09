import { Router, type IRouter } from "express";
import { eq, and, or, isNull } from "drizzle-orm";
import { db, categoriesTable } from "@workspace/db";
import {
  CreateCategoryBody,
  UpdateCategoryBody,
  UpdateCategoryParams,
  DeleteCategoryParams,
  ListCategoriesQueryParams,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/categories", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const query = ListCategoriesQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const conditions = [
    or(eq(categoriesTable.userId, userId), isNull(categoriesTable.userId)),
  ];
  if (query.data.type) {
    conditions.push(eq(categoriesTable.type, query.data.type));
  }

  const categories = await db
    .select()
    .from(categoriesTable)
    .where(and(...conditions))
    .orderBy(categoriesTable.isDefault, categoriesTable.name);

  res.json(categories);
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({ ...parsed.data, userId, isDefault: false })
    .returning();

  res.status(201).json(category);
});

router.patch("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  const [category] = await db
    .update(categoriesTable)
    .set(parsed.data)
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)))
    .returning();

  if (!category) {
    res.status(404).json({ error: "Category not found" });
    return;
  }

  res.json(category);
});

router.delete("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const id = Math.round(params.data.id);
  await db
    .delete(categoriesTable)
    .where(and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)));

  res.sendStatus(204);
});

export default router;
