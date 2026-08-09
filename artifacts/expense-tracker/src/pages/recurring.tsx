import { useListRecurring } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Repeat, Plus, Calendar, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function RecurringPage() {
  const { data: recurring, isLoading } = useListRecurring();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Recurring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Automate your regular income and expenses.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring
        </Button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : recurring?.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Repeat className="h-8 w-8 mx-auto mb-3 opacity-20" />
            <p>No recurring transactions set up.</p>
          </div>
        ) : (
          recurring?.map(r => (
            <Card key={r.id} className={r.isActive ? '' : 'opacity-60'}>
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    r.type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}>
                    <Calendar className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      {r.categoryName || 'Uncategorized'}
                      {!r.isActive && <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Inactive</span>}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Recurs on day {r.recurringDay} of every month
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className={`text-lg font-bold ${r.type === 'income' ? 'text-emerald-600' : 'text-slate-900 dark:text-white'}`}>
                    {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount)}
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}