/**
 * Monthly recurring-transaction email reminder.
 *
 * Runs at 08:00 on the 1st of every month.
 * Sends one email per user listing all their active recurring transactions.
 *
 * Required env vars to enable sending:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 *
 * If those are absent the job still runs but prints a summary to the console
 * so you can verify it's working before wiring up an SMTP provider.
 */

import cron from "node-cron";
import nodemailer from "nodemailer";
import { eq, and } from "drizzle-orm";
import { db, recurringTransactionsTable, categoriesTable } from "@workspace/db";
import { clerkClient } from "@clerk/express";

const CURRENCY_SYMBOL = "Rs.";

function fmt(amount: number): string {
  return `${CURRENCY_SYMBOL} ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
}

function ordinalDay(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

async function buildTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

async function sendReminderEmails(): Promise<void> {
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  console.log(`[recurringReminder] Running monthly reminder job for ${month}…`);

  // Fetch all active recurring transactions with their category names
  const rows = await db
    .select({
      userId: recurringTransactionsTable.userId,
      type: recurringTransactionsTable.type,
      amount: recurringTransactionsTable.amount,
      recurringDay: recurringTransactionsTable.recurringDay,
      note: recurringTransactionsTable.note,
      categoryName: categoriesTable.name,
    })
    .from(recurringTransactionsTable)
    .leftJoin(categoriesTable, eq(recurringTransactionsTable.categoryId, categoriesTable.id))
    .where(eq(recurringTransactionsTable.isActive, true));

  if (rows.length === 0) {
    console.log("[recurringReminder] No active recurring transactions — nothing to send.");
    return;
  }

  // Group by userId
  const byUser = new Map<string, typeof rows>();
  for (const row of rows) {
    if (!byUser.has(row.userId)) byUser.set(row.userId, []);
    byUser.get(row.userId)!.push(row);
  }

  const transporter = await buildTransporter();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "SpendWise <noreply@spendwise.app>";

  for (const [userId, transactions] of byUser.entries()) {
    // Resolve email via Clerk
    let email: string | null = null;
    try {
      const user = await clerkClient.users.getUser(userId);
      email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress ?? null;
    } catch {
      console.warn(`[recurringReminder] Could not resolve email for userId=${userId}`);
    }

    const expenseRows = transactions.filter(t => t.type === "expense");
    const incomeRows = transactions.filter(t => t.type === "income");

    const listHtml = (items: typeof rows) =>
      items.map(t =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${t.note || t.categoryName || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;">${t.categoryName || "—"}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:right;">${fmt(Number(t.amount))}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;text-align:center;">${ordinalDay(t.recurringDay!)}</td>
        </tr>`
      ).join("");

    const tableHtml = (title: string, items: typeof rows, color: string) =>
      items.length === 0 ? "" : `
        <h3 style="color:${color};margin:24px 0 8px;">${title}</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;">Name / Note</th>
              <th style="padding:8px 12px;text-align:left;font-weight:600;color:#475569;">Category</th>
              <th style="padding:8px 12px;text-align:right;font-weight:600;color:#475569;">Amount</th>
              <th style="padding:8px 12px;text-align:center;font-weight:600;color:#475569;">Due Day</th>
            </tr>
          </thead>
          <tbody>${listHtml(items)}</tbody>
        </table>`;

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:32px 0;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
    <div style="background:#0d9488;padding:28px 32px;">
      <h1 style="color:#fff;margin:0;font-size:22px;">SpendWise — Monthly Reminder</h1>
      <p style="color:#ccfbf1;margin:6px 0 0;font-size:14px;">${month}</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#475569;margin:0 0 16px;">Here's a summary of your recurring transactions for this month.</p>
      ${tableHtml("Recurring Expenses", expenseRows, "#dc2626")}
      ${tableHtml("Recurring Income", incomeRows, "#059669")}
      <p style="color:#94a3b8;font-size:12px;margin:28px 0 0;">
        You can manage your recurring transactions in SpendWise under <strong>Recurring</strong>.<br>
        To stop receiving these reminders, turn off the relevant recurring transactions.
      </p>
    </div>
  </div>
</body>
</html>`;

    const textLines = transactions.map(t =>
      `• ${t.note || t.categoryName || "—"} (${t.categoryName}) — ${fmt(Number(t.amount))} on the ${ordinalDay(t.recurringDay!)} [${t.type}]`
    );
    const text = `SpendWise – Monthly Reminder for ${month}\n\nYour recurring transactions:\n${textLines.join("\n")}\n\nManage them at SpendWise > Recurring.`;

    if (transporter && email) {
      try {
        await transporter.sendMail({
          from,
          to: email,
          subject: `SpendWise – Your recurring transactions for ${month}`,
          text,
          html,
        });
        console.log(`[recurringReminder] Email sent to ${email} (${transactions.length} items)`);
      } catch (err) {
        console.error(`[recurringReminder] Failed to send to ${email}:`, err);
      }
    } else {
      // No SMTP configured — log what would be sent
      console.log(`[recurringReminder] (no SMTP) Would email ${email ?? userId}:`);
      textLines.forEach(l => console.log(`  ${l}`));
    }
  }

  console.log("[recurringReminder] Done.");
}

export function scheduleRecurringReminder(): void {
  // "0 8 1 * *" = 08:00 on the 1st of every month
  cron.schedule("0 8 1 * *", () => {
    sendReminderEmails().catch(err =>
      console.error("[recurringReminder] Unhandled error:", err)
    );
  }, { timezone: "Asia/Karachi" });

  console.log("[recurringReminder] Monthly email reminder scheduled (1st of each month at 08:00 PKT).");
}
