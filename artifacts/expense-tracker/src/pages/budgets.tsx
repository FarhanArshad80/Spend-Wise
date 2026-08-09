import { useState } from "react";
import {
  useListBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  useListCategories,
  getListBudgetsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, AlertTriangle, AlertCircle } from "lucide-react";

export default function BudgetsPage() {
  const queryClient = useQueryClient();
  const currentMonth = format(new Date(), "yyyy-MM");
  const { data: budgets, isLoading } = useListBudgets({ month: currentMonth });
  const { data: categories } = useListCategories({ type: "expense" });
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"overall" | "category">("overall");
  const [editId, setEditId] = useState<number | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const overallBudget = budgets?.find(b => b.type === "overall");
  const categoryBudgets = budgets?.filter(b => b.type === "category") || [];

  function openOverallDialog(existing?: typeof overallBudget) {
    setDialogMode("overall");
    setEditId(existing?.id ?? null);
    setAmountInput(existing ? String(existing.amount) : "");
    setCategoryId("");
    setFormError("");
    setDialogOpen(true);
  }

  function openCategoryDialog(existing?: (typeof categoryBudgets)[number]) {
    setDialogMode("category");
    setEditId(existing?.id ?? null);
    setAmountInput(existing ? String(existing.amount) : "");
    setCategoryId(existing?.categoryId ? String(existing.categoryId) : "");
    setFormError("");
    setDialogOpen(true);
  }

  async function handleSave() {
    const amount = Number(amountInput);
    if (!amountInput || isNaN(amount) || amount <= 0) {
      setFormError("Please enter a valid amount."); return;
    }
    if (dialogMode === "category" && !categoryId) {
      setFormError("Please select a category."); return;
    }

    setSaving(true); setFormError("");
    try {
      if (editId !== null) {
        await updateBudget.mutateAsync({ id: editId, data: { amount } });
      } else {
        await createBudget.mutateAsync({
          data: {
            month: currentMonth,
            amount,
            type: dialogMode,
            categoryId: dialogMode === "category" ? Number(categoryId) : undefined,
          },
        });
      }
      await queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey({ month: currentMonth }) });
      setDialogOpen(false);
    } catch (e: any) {
      setFormError(e?.message || "Failed to save budget.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this budget?")) return;
    await deleteBudget.mutateAsync({ id });
    await queryClient.invalidateQueries({ queryKey: getListBudgetsQueryKey({ month: currentMonth }) });
  }

  function BudgetStatusBadge({ pct }: { pct: number }) {
    if (pct >= 100) return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
        Exceeded
      </span>
    );
    if (pct >= 90) return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        90% used
      </span>
    );
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Budgets</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your spending limits for {format(new Date(), "MMMM yyyy")}.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={() => openCategoryDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category Budget
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Overall Budget */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Monthly Budget</CardTitle>
                <CardDescription>Your total spending limit for {format(new Date(), "MMMM")}</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openOverallDialog(overallBudget)}
                className="shrink-0"
              >
                {overallBudget ? <><Pencil className="h-3 w-3 mr-1" /> Edit</> : <><Plus className="h-3 w-3 mr-1" /> Set Budget</>}
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4"><Skeleton className="h-20 w-full" /></div>
              ) : overallBudget ? (
                <div className="space-y-4">
                  {/* Exceeded warning */}
                  {(overallBudget.percentUsed || 0) >= 100 && (
                    <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 p-3">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-700 dark:text-red-400 text-sm ml-1">
                        Budget exceeded by <strong>{formatCurrency((overallBudget.spent || 0) - overallBudget.amount)}</strong>.
                      </AlertDescription>
                    </Alert>
                  )}
                  {(overallBudget.percentUsed || 0) >= 90 && (overallBudget.percentUsed || 0) < 100 && (
                    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 p-3">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm ml-1">
                        Only <strong>{formatCurrency(overallBudget.remaining || 0)}</strong> remaining (10% or less).
                      </AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Spent</span>
                      <span className="font-medium">{formatCurrency(overallBudget.spent || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Budget</span>
                      <span className="font-medium">{formatCurrency(overallBudget.amount)}</span>
                    </div>
                    <Progress
                      value={Math.min(overallBudget.percentUsed || 0, 100)}
                      className="h-3"
                      indicatorClassName={cn(
                        (overallBudget.percentUsed || 0) >= 100 ? "bg-red-500" :
                        (overallBudget.percentUsed || 0) >= 90 ? "bg-amber-500" :
                        "bg-teal-500"
                      )}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-slate-400">{formatPercentage(overallBudget.percentUsed || 0)} used</span>
                      <BudgetStatusBadge pct={overallBudget.percentUsed || 0} />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Remaining</span>
                    <span className={cn(
                      "text-xl font-bold",
                      (overallBudget.percentUsed || 0) >= 100 ? "text-red-600 dark:text-red-400" :
                      "text-slate-900 dark:text-white"
                    )}>
                      {(overallBudget.percentUsed || 0) >= 100 ? "-" : ""}{formatCurrency(Math.abs(overallBudget.remaining || 0))}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-4">No monthly budget set for {format(new Date(), "MMMM")}.</p>
                  <Button variant="outline" size="sm" onClick={() => openOverallDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> Set Monthly Budget
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Category Budgets */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle>Category Budgets</CardTitle>
                <CardDescription>Track spending limits by category</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => openCategoryDialog()}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : categoryBudgets.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-500 mb-4">No category budgets yet.</p>
                  <Button variant="outline" size="sm" onClick={() => openCategoryDialog()}>
                    <Plus className="h-4 w-4 mr-1" /> Add your first
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {categoryBudgets.map(b => {
                    const pct = b.percentUsed || 0;
                    const exceeded = pct >= 100;
                    const overBy = exceeded ? (b.spent || 0) - b.amount : 0;
                    return (
                      <div key={b.id}>
                        <div className="flex justify-between items-start mb-1.5">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">{b.categoryName}</p>
                            <p className="text-xs text-slate-500">{formatCurrency(b.spent || 0)} of {formatCurrency(b.amount)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <BudgetStatusBadge pct={pct} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-teal-600" onClick={() => openCategoryDialog(b)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-red-500" onClick={() => handleDelete(b.id!)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <Progress
                          value={Math.min(pct, 100)}
                          className="h-2"
                          indicatorClassName={cn(
                            pct >= 100 ? "bg-red-500" :
                            pct >= 90 ? "bg-amber-500" :
                            "bg-teal-500"
                          )}
                        />
                        {exceeded && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            You have exceeded your {b.categoryName} budget by <strong>{formatCurrency(overBy)}</strong>.
                          </p>
                        )}
                        {!exceeded && pct >= 90 && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Only {formatCurrency(b.remaining || 0)} remaining.
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Set Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit Budget" : dialogMode === "overall" ? "Set Monthly Budget" : "Add Category Budget"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "overall"
                ? `Set your total spending limit for ${format(new Date(), "MMMM yyyy")}.`
                : "Set a spending cap for a specific expense category."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {dialogMode === "category" && !editId && (
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expense category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="budget-amount">Budget Amount</Label>
              <Input
                id="budget-amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                value={amountInput}
                onChange={e => setAmountInput(e.target.value)}
                autoFocus
              />
            </div>
            {formError && <p className="text-sm text-red-500">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editId ? "Save Changes" : "Set Budget"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
