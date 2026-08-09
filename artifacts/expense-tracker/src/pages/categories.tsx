import { useState } from "react";
import { useListCategories, useCreateCategory, useDeleteCategory, getListCategoriesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tags, Plus, Trash2 } from "lucide-react";

const PRESET_COLORS = [
  "#f97316", "#ef4444", "#a855f7", "#3b82f6", "#10b981",
  "#f59e0b", "#ec4899", "#06b6d4", "#84cc16", "#6b7280",
];

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "expense", color: PRESET_COLORS[0] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const expenseCategories = categories?.filter(c => c.type === "expense") || [];
  const incomeCategories = categories?.filter(c => c.type === "income") || [];

  function openDialog() {
    setForm({ name: "", type: "expense", color: PRESET_COLORS[0] });
    setError("");
    setOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    setError("");
    try {
      await createCategory.mutateAsync({
        data: { name: form.name.trim(), type: form.type as "expense" | "income", color: form.color, icon: "" },
      });
      await queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
      setOpen(false);
    } catch (e: any) {
      setError(e?.message || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this category? Existing transactions won't be affected.")) return;
    await deleteCategory.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() });
  }

  function CategoryCard({ c }: { c: NonNullable<typeof categories>[number] }) {
    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: c.color ? `${c.color}25` : "#f1f5f9", color: c.color || "#64748b" }}
            >
              <Tags className="h-5 w-5" />
            </div>
            <div>
              <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
              {c.isDefault && (
                <span className="ml-2 text-xs text-slate-400 dark:text-slate-500">default</span>
              )}
            </div>
          </div>
          {!c.isDefault && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-500"
              onClick={() => handleDelete(c.id!)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize your transactions.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={openDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Expense */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Expense Categories</h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-3">
              {expenseCategories.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No expense categories yet.</p>
              ) : (
                expenseCategories.map(c => <CategoryCard key={c.id} c={c} />)
              )}
            </div>
          )}
        </div>

        {/* Income */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Income Categories</h2>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="grid gap-3">
              {incomeCategories.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No income categories yet.</p>
              ) : (
                incomeCategories.map(c => <CategoryCard key={c.id} c={c} />)
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Category</DialogTitle>
            <DialogDescription>Create a custom income or expense category.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Groceries"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${form.color === color ? "border-slate-900 dark:border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    onClick={() => setForm(f => ({ ...f, color }))}
                  />
                ))}
              </div>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
