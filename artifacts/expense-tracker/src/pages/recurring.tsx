import { useState } from "react";
import {
  useListRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useListCategories,
  getListRecurringQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/utils";
import { Repeat, Plus, Calendar, Pencil, Trash2, Power, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface RecurringForm {
  type: "expense" | "income";
  amount: string;
  categoryId: string;
  recurringDay: string;
  note: string;
}

const EMPTY_FORM: RecurringForm = { type: "expense", amount: "", categoryId: "", recurringDay: "1", note: "" };

export default function RecurringPage() {
  const queryClient = useQueryClient();
  const { data: recurring, isLoading } = useListRecurring();
  const { data: allCategories } = useListCategories();
  const createRecurring = useCreateRecurring();
  const updateRecurring = useUpdateRecurring();
  const deleteRecurring = useDeleteRecurring();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<RecurringForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = allCategories?.filter(c => c.type === form.type) || [];

  function openAdd() {
    setEditId(null);
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(r: NonNullable<typeof recurring>[number]) {
    setEditId(r.id!);
    setForm({
      type: r.type as "expense" | "income",
      amount: String(r.amount),
      categoryId: String(r.categoryId),
      recurringDay: String(r.recurringDay),
      note: r.note || "",
    });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setError("Please enter a valid amount."); return;
    }
    if (!form.categoryId) { setError("Please select a category."); return; }
    const day = Number(form.recurringDay);
    if (!day || day < 1 || day > 28) { setError("Day must be between 1 and 28."); return; }

    setSaving(true); setError("");
    try {
      if (editId !== null) {
        await updateRecurring.mutateAsync({
          id: editId,
          data: {
            type: form.type,
            amount: Number(form.amount),
            categoryId: Number(form.categoryId),
            recurringDay: day,
            note: form.note || undefined,
          },
        });
      } else {
        await createRecurring.mutateAsync({
          data: {
            type: form.type,
            amount: Number(form.amount),
            categoryId: Number(form.categoryId),
            recurringDay: day,
            note: form.note || undefined,
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getListRecurringQueryKey() });
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(r: NonNullable<typeof recurring>[number]) {
    await updateRecurring.mutateAsync({ id: r.id!, data: { isActive: !r.isActive } });
    await queryClient.invalidateQueries({ queryKey: getListRecurringQueryKey() });
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this recurring transaction?")) return;
    await deleteRecurring.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListRecurringQueryKey() });
  }

  const ordinalDay = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Automate your regular income and expenses.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openAdd}>
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring
        </Button>
      </div>

      {/* Email reminder notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800 text-sm text-teal-800 dark:text-teal-300">
        <Mail className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          You'll receive an email reminder on the <strong>1st of every month</strong> listing all your active recurring transactions.
        </span>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : recurring?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Repeat className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p className="mb-2">No recurring transactions set up.</p>
            <Button variant="outline" size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4 mr-1" /> Add your first one
            </Button>
          </div>
        ) : (
          recurring?.map(r => (
            <Card key={r.id} className={!r.isActive ? "opacity-60" : ""}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    r.type === "income" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                      {r.note || r.categoryName || "Untitled"}
                      {!r.isActive && <Badge variant="secondary">Inactive</Badge>}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {r.categoryName} · Every {ordinalDay(r.recurringDay!)} of the month
                    </p>
                    {r.note && r.categoryName && (
                      <p className="text-xs text-slate-400 mt-0.5">{r.categoryName}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-6">
                  <div className={`text-lg font-bold ${r.type === "income" ? "text-emerald-600" : "text-slate-900 dark:text-white"}`}>
                    {r.type === "income" ? "+" : "-"}{formatCurrency(r.amount)}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-teal-600"
                      title="Edit"
                      onClick={() => openEdit(r)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 ${r.isActive ? "text-slate-400 hover:text-amber-500" : "text-slate-400 hover:text-emerald-500"}`}
                      title={r.isActive ? "Pause" : "Activate"}
                      onClick={() => handleToggleActive(r)}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-500"
                      title="Delete"
                      onClick={() => handleDelete(r.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Recurring" : "Add Recurring Transaction"}</DialogTitle>
            <DialogDescription>
              Set up a bill or income that repeats every month on a fixed day.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={v => setForm(f => ({ ...f, type: v as "expense" | "income", categoryId: "" }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCategories.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-amount">Amount</Label>
              <Input
                id="rec-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-day">Day of month (1–28)</Label>
              <Input
                id="rec-day"
                type="number"
                min="1"
                max="28"
                value={form.recurringDay}
                onChange={e => setForm(f => ({ ...f, recurringDay: e.target.value }))}
              />
              <p className="text-xs text-slate-500">Max 28 to ensure it runs every month.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="rec-note">Note / Name (optional)</Label>
              <Input
                id="rec-note"
                placeholder="e.g. Netflix subscription"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editId ? "Save Changes" : "Add Recurring"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
