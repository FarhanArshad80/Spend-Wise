import { useListCategories } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tags, Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useListCategories();

  const expenseCategories = categories?.filter(c => c.type === 'expense') || [];
  const incomeCategories = categories?.filter(c => c.type === 'income') || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Categories</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Organize your transactions.</p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Expense Categories</h2>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-full" /><Skeleton className="h-16 w-full" /></div>
          ) : (
            <div className="grid gap-3">
              {expenseCategories.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.color ? `${c.color}20` : '#f1f5f9', color: c.color || '#64748b' }}>
                        <Tags className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Income Categories</h2>
          {isLoading ? (
            <div className="space-y-3"><Skeleton className="h-16 w-full" /></div>
          ) : (
            <div className="grid gap-3">
              {incomeCategories.map(c => (
                <Card key={c.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: c.color ? `${c.color}20` : '#f1f5f9', color: c.color || '#64748b' }}>
                        <Tags className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-slate-900 dark:text-white">{c.name}</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}