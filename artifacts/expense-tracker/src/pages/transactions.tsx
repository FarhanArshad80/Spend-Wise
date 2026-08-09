import { useListTransactions, useDeleteTransaction, getListTransactionsQueryKey } from "@workspace/api-client-react";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const { data: transactionsData, isLoading } = useListTransactions({ search: search || undefined });
  const deleteMutation = useDeleteTransaction();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transactions = transactionsData?.data || [];

  const handleDelete = (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Transaction deleted" });
        queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to delete transaction", variant: "destructive" });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transactions</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage your income and expenses.</p>
        </div>
        <Link href="/transactions/new" className="inline-flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm shrink-0">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search transactions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-50 dark:bg-slate-950/50"
            />
          </div>
          <Button variant="outline" size="icon" className="shrink-0 text-slate-500">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Note</th>
                <th className="px-6 py-3 font-medium text-right">Amount</th>
                <th className="px-6 py-3 font-medium text-right w-[60px]"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                    <td className="px-6 py-4"></td>
                  </tr>
                ))
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {format(new Date(t.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-200">
                      {t.categoryName || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {t.note || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                    }`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/transactions/${t.id}/edit`}>
                            <DropdownMenuItem className="cursor-pointer">
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem 
                            className="text-red-600 cursor-pointer"
                            onClick={() => handleDelete(t.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}