import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, userSettingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";
import { requireAuth } from "../middlewares/requireAuth";

const router: IRouter = Router();

router.get("/settings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;

  let [settings] = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));

  if (!settings) {
    // JIT provision default settings
    [settings] = await db
      .insert(userSettingsTable)
      .values({ userId })
      .returning();
  }

  res.json(settings);
});

router.patch("/settings", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId as string;
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Upsert settings
  const existing = await db
    .select()
    .from(userSettingsTable)
    .where(eq(userSettingsTable.userId, userId));

  let settings;
  if (existing.length === 0) {
    [settings] = await db
      .insert(userSettingsTable)
      .values({ userId, ...parsed.data })
      .returning();
  } else {
    [settings] = await db
      .update(userSettingsTable)
      .set(parsed.data)
      .where(eq(userSettingsTable.userId, userId))
      .returning();
  }

  res.json(settings);
});

export default router;
