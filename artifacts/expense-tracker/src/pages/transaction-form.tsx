import { useCreateTransaction, useGetTransaction, useUpdateTransaction, useListCategories, getListTransactionsQueryKey, getGetTransactionQueryKey } from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  categoryId: z.coerce.number().positive("Please select a category"),
  date: z.string(),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TransactionFormPage() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const isEditing = Boolean(params.id && params.id !== "new");
  const id = isEditing ? Number(params.id) : null;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: transaction, isLoading: isLoadingTx } = useGetTransaction(id as number, {
    query: {
      enabled: isEditing && id !== null,
      queryKey: getGetTransactionQueryKey(id as number),
    },
  });

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "expense",
      amount: undefined,
      categoryId: undefined,
      date: format(new Date(), "yyyy-MM-dd"),
      note: "",
    },
  });

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        amount: transaction.amount,
        categoryId: transaction.categoryId,
        date: transaction.date.split('T')[0],
        note: transaction.note || "",
      });
    }
  }, [transaction, form]);

  const onSubmit = (data: FormValues) => {
    if (isEditing && id) {
      updateMutation.mutate({ id, data }, {
        onSuccess: () => {
          toast({ title: "Transaction updated" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetTransactionQueryKey(id) });
          setLocation("/transactions");
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" })
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: "Transaction added" });
          queryClient.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
          setLocation("/transactions");
        },
        onError: () => toast({ title: "Failed to add", variant: "destructive" })
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const currentType = form.watch("type");
  const filteredCategories = categories?.filter(c => c.type === currentType) || [];

  if (isEditing && isLoadingTx) {
    return <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <Card><CardContent className="p-6"><Skeleton className="h-96 w-full" /></CardContent></Card>
    </div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/transactions")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {isEditing ? "Edit Transaction" : "New Transaction"}
          </h1>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <button
                  type="button"
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    currentType === 'expense' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                  onClick={() => form.setValue("type", "expense")}
                >
                  Expense
                </button>
                <button
                  type="button"
                  className={`py-2 rounded-md text-sm font-medium transition-colors ${
                    currentType === 'income' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500'
                  }`}
                  onClick={() => form.setValue("type", "income")}
                >
                  Income
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">Rs.</span>
                          <Input type="number" step="0.01" className="pl-10 text-lg font-medium" placeholder="0.00" {...field} value={field.value ?? ""} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value?.toString() || ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredCategories.map(c => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="What was this for?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setLocation("/transactions")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="bg-teal-600 hover:bg-teal-700">
                  {isPending ? "Saving..." : "Save Transaction"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}