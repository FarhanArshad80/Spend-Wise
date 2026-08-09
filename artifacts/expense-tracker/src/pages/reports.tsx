import { useGetMonthlyTrend, useGetWeeklySummary, useGetSpendingByCategory, useGetBudgetVsActual } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

// Expense bars use grey (#94a3b8 slate-400) per user request
const EXPENSE_COLOR = "#94a3b8";
const INCOME_COLOR = "hsl(153 60% 53%)";

export default function ReportsPage() {
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend();
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary();
  const { data: spending, isLoading: isLoadingSpending } = useGetSpendingByCategory();
  const { data: budgetVsActual, isLoading: isLoadingBva } = useGetBudgetVsActual();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics and insights into your spending habits.</p>
      </div>

      {/* Row 1: Monthly trend + Weekly summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Income vs Expenses</CardTitle>
              <CardDescription>Monthly comparison over the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTrend ? (
                <Skeleton className="h-[300px] w-full" />
              ) : trend && trend.length > 0 ? (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickFormatter={(val) => `Rs.${val / 1000}k`} />
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expenses" name="Expenses" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weekly Summary */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
              <CardDescription>
                {weekly ? `${format(new Date(weekly.weekStart), "MMM d")} – ${format(new Date(weekly.weekEnd), "MMM d")}` : "Current week"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWeekly ? (
                <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : weekly ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(weekly.totalSpent)}</p>
                    <p className={`text-sm mt-1 font-medium ${weekly.percentChange > 0 ? "text-red-500" : "text-emerald-500"}`}>
                      {weekly.percentChange > 0 ? "+" : ""}{formatPercentage(weekly.percentChange)} vs last week
                    </p>
                  </div>
                  {weekly.budgetProgress > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">Monthly budget progress</p>
                      <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{formatPercentage(weekly.budgetProgress)} used</p>
                    </div>
                  )}
                  {weekly.topCategories.length > 0 && (
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-3">Top Categories</p>
                      <div className="space-y-3">
                        {weekly.topCategories.map(cat => (
                          <div key={cat.categoryId} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || "#0d9488" }}></div>
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.categoryName}</span>
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(cat.amount)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No data for this week.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Row 2: Spending by Category (pie) + Budget vs Actual (bar) */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Spending by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Expense breakdown for this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSpending ? (
              <Skeleton className="h-[280px] w-full" />
            ) : spending && spending.length > 0 ? (
              <div className="flex flex-col gap-4">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={spending}
                        dataKey="amount"
                        nameKey="categoryName"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {spending.map((entry, index) => (
                          <Cell key={index} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0/0.1)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {spending.map((cat, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color || `hsl(var(--chart-${(i % 5) + 1}))` }} />
                        <span className="text-sm text-slate-700 dark:text-slate-300 truncate">{cat.categoryName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-400">{cat.percentage?.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{formatCurrency(cat.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-slate-500">No expense data this month</div>
            )}
          </CardContent>
        </Card>

        {/* Budget vs Actual */}
        <Card>
          <CardHeader>
            <CardTitle>Budget vs Actual</CardTitle>
            <CardDescription>How your spending compares to budgets this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingBva ? (
              <Skeleton className="h-[280px] w-full" />
            ) : budgetVsActual && budgetVsActual.length > 0 ? (
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetVsActual} layout="vertical" margin={{ top: 0, right: 10, left: 60, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" opacity={0.5} />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} tickFormatter={(v) => `Rs.${v / 1000}k`} />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} width={55} />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid var(--border)" }}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="budget" name="Budget" fill="#e2e8f0" radius={[0, 4, 4, 0]} maxBarSize={20} />
                    <Bar dataKey="actual" name="Actual" fill={INCOME_COLOR} radius={[0, 4, 4, 0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-slate-500">No budgets set this month</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
