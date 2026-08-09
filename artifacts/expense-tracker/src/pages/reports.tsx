import { useGetMonthlyTrend, useGetWeeklySummary } from "@workspace/api-client-react";
import { formatCurrency, formatPercentage } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function ReportsPage() {
  const { data: trend, isLoading: isLoadingTrend } = useGetMonthlyTrend();
  const { data: weekly, isLoading: isLoadingWeekly } = useGetWeeklySummary();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Analytics and insights into your spending habits.</p>
      </div>

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
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--muted-foreground)' }} tickFormatter={(val) => `Rs.${val/1000}k`} />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)' }}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="income" name="Income" fill="hsl(153 60% 53%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                      <Bar dataKey="expenses" name="Expenses" fill="hsl(215 25% 27%)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-slate-500">No data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>This Week</CardTitle>
              <CardDescription>Current week summary</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingWeekly ? (
                <div className="space-y-4"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
              ) : weekly ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Total Spent</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(weekly.totalSpent)}</p>
                    <p className={`text-sm mt-1 font-medium ${weekly.percentChange > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                      {weekly.percentChange > 0 ? '+' : ''}{formatPercentage(weekly.percentChange)} vs last week
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-3">Top Categories</p>
                    <div className="space-y-3">
                      {weekly.topCategories.map(cat => (
                        <div key={cat.categoryId} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color || '#0d9488' }}></div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat.categoryName}</span>
                          </div>
                          <span className="text-sm text-slate-600 dark:text-slate-400">{formatCurrency(cat.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No data for this week.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}