import { Link, useLocation } from "wouter";
import { cn, formatCurrency } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  PieChart, 
  Tags, 
  Repeat, 
  BarChart3, 
  Settings
} from "lucide-react";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/recurring", label: "Recurring", icon: Repeat },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { data: summary } = useGetDashboardSummary();

  const isCurrent = (href: string) => location.startsWith(href);

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-teal-700 dark:text-teal-500">
          <img src="/logo.svg" alt="SpendWise" className="h-7 w-auto block dark:hidden" />
          <img src="/logo.svg" alt="SpendWise" className="h-7 w-auto hidden dark:block dark:invert" />
        </Link>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} className="block">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isCurrent(item.href)
                  ? "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
          </Link>
        ))}
      </nav>

      {summary && summary.budgetPercentUsed !== null && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 m-4 rounded-xl">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Monthly Budget</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(summary.budgetRemaining ?? 0)} left
            </span>
          </div>
          <Progress 
            value={Math.min(summary.budgetPercentUsed, 100)} 
            className="h-1.5"
            indicatorClassName={cn(
              summary.budgetPercentUsed >= 90 ? "bg-red-500" :
              summary.budgetPercentUsed >= 75 ? "bg-amber-500" :
              "bg-teal-500"
            )}
          />
        </div>
      )}
    </aside>
  );
}