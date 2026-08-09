import { useGetDashboardSummary, useGetSpendingByCategory, useGetTriggeredAlerts, useListTransactions } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage, cn } from "@/lib/utils";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { AlertCircle, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Plus, ArrowLeftRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: spending, isLoading: isLoadingSpending } = useGetSpendingByCategory();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetTriggeredAlerts();
  const { data: transactionsData, isLoading: isLoadingTransactions } = useListTransactions({ limit: 5 });

  const transactions = transactionsData?.data || [];

  return (
    <div className="space-y-8 pb-8">
      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Alert key={alert.alertId} variant="destructive" className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Budget Alert: {alert.categoryName || "Overall"}</AlertTitle>
              <AlertDescription>
                You've used {formatPercentage(alert.currentPercentage)} of your {formatCurrency(alert.budgetAmount)} budget. 
                Remaining: {formatCurrency(alert.budgetAmount - alert.amount)}.
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Hero Metric */}
      <section>
        {isLoadingSummary ? (
          <Skeleton className="h-[200px] w-full rounded-3xl" />
        ) : summary ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <PieChart className="w-64 h-64 text-teal-500" />
            </div>
            
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                <div>
                  <h2 className="text-slate-500 dark:text-slate-400 font-medium mb-2">Left to spend this month</h2>
                  <div className={cn(
                    "text-5xl md:text-7xl font-bold tracking-tight",
                    summary.budgetPercentUsed !== null && summary.budgetPercentUsed >= 90 ? "text-red-600 dark:text-red-500" :
                    summary.budgetPercentUsed !== null && summary.budgetPercentUsed >= 75 ? "text-amber-600 dark:text-amber-500" :
                    "text-slate-900 dark:text-white"
                  )}>
                    {formatCurrency(summary.budgetRemaining ?? 0)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Link 
                    href="/transactions/new" 
                    className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-teal-700 transition-colors shadow-sm"
                  >
                    <Plus className="h-5 w-5" />
                    New Entry
                  </Link>
                </div>
              </div>

              {summary.monthlyBudget !== null && summary.budgetPercentUsed !== null && (
                <div className="space-y-3 max-w-3xl">
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-slate-600 dark:text-slate-300">
                      Spent: {formatCurrency(summary.budgetSpent)}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Budget: {formatCurrency(summary.monthlyBudget)}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(summary.budgetPercentUsed, 100)} 
                    className="h-3"
                    indicatorClassName={cn(
                      summary.budgetPercentUsed >= 90 ? "bg-red-500" :
                      summary.budgetPercentUsed >= 75 ? "bg-amber-500" :
                      "bg-teal-500"
                    )}
                  />
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Income</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalIncome ?? 0)}
            </h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <ArrowUpRight className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Expenses</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.totalExpenses ?? 0)}
            </h3>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Current Balance</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isLoadingSummary ? <Skeleton className="h-8 w-32" /> : formatCurrency(summary?.currentBalance ?? 0)}
            </h3>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your latest financial activity</CardDescription>
            </div>
            <Link href="/transactions" className="text-sm font-medium text-teal-600 hover:text-teal-700">
              View all
            </Link>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {isLoadingTransactions ? (
              <div className="p-6 space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center h-full text-slate-500">
                <ArrowLeftRight className="h-8 w-8 mb-3 opacity-20" />
                <p>No transactions yet</p>
                <Link href="/transactions/new" className="text-teal-600 font-medium mt-2">Add your first one</Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map(t => (
                  <div key={t.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        t.type === 'income' ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                      )}>
                        {t.type === 'income' ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-1">{t.categoryName || 'Uncategorized'}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {format(new Date(t.date), 'MMM d, yyyy')} {t.note ? `• ${t.note}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className={cn(
                      "font-semibold whitespace-nowrap ml-4",
                      t.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white"
                    )}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="flex flex-col">
          <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800">
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Where your money went this month</CardDescription>
          </CardHeader>
          <CardContent className="p-6 flex-1 flex flex-col justify-center">
            {isLoadingSpending ? (
              <div className="flex justify-center py-12"><Skeleton className="h-48 w-48 rounded-full" /></div>
            ) : !spending || spending.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <PieChart className="h-8 w-8 mx-auto mb-3 opacity-20" />
                <p>Not enough data</p>
              </div>
            ) : (
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={spending}
                      dataKey="amount"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {spending.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || `hsl(var(--chart-${(index % 5) + 1}))`} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  {spending.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center gap-2 truncate">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color || `hsl(var(--chart-${(i % 5) + 1}))` }} />
                      <span className="truncate text-slate-600 dark:text-slate-300">{cat.categoryName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}