import { useListBudgets, useUpdateBudget, getListBudgetsQueryKey } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function BudgetsPage() {
  const currentMonth = format(new Date(), 'yyyy-MM');
  const { data: budgets, isLoading } = useListBudgets({ month: currentMonth });

  const overallBudget = budgets?.find(b => b.type === 'overall');
  const categoryBudgets = budgets?.filter(b => b.type === 'category') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Budgets</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your spending limits for {format(new Date(), 'MMMM yyyy')}.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Overall Budget</CardTitle>
              <CardDescription>Your total spending limit for the month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4"><Skeleton className="h-20 w-full" /></div>
              ) : overallBudget ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-slate-500">Spent</span>
                      <span className="font-medium">{formatCurrency(overallBudget.spent || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-slate-500">Total Budget</span>
                      <span className="font-medium">{formatCurrency(overallBudget.amount)}</span>
                    </div>
                    <Progress 
                      value={Math.min(overallBudget.percentUsed || 0, 100)} 
                      className="h-3"
                      indicatorClassName={(overallBudget.percentUsed || 0) >= 90 ? "bg-red-500" : (overallBudget.percentUsed || 0) >= 75 ? "bg-amber-500" : "bg-teal-500"}
                    />
                  </div>
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-sm text-slate-500">Remaining</span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(overallBudget.remaining || 0)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No overall budget set.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Category Budgets</CardTitle>
              <CardDescription>Track spending by specific categories</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-6">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : categoryBudgets.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No category budgets set.</p>
              ) : (
                <div className="space-y-8">
                  {categoryBudgets.map(b => (
                    <div key={b.id}>
                      <div className="flex justify-between items-end mb-2">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{b.categoryName}</p>
                          <p className="text-xs text-slate-500">{formatCurrency(b.spent || 0)} of {formatCurrency(b.amount)}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-semibold ${(b.percentUsed || 0) >= 90 ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                            {formatPercentage(b.percentUsed || 0)}
                          </p>
                        </div>
                      </div>
                      <Progress 
                        value={Math.min(b.percentUsed || 0, 100)} 
                        className="h-2"
                        indicatorClassName={(b.percentUsed || 0) >= 90 ? "bg-red-500" : (b.percentUsed || 0) >= 75 ? "bg-amber-500" : "bg-teal-500"}
                      />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}