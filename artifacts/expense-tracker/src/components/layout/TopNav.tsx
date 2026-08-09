import { UserButton } from "@clerk/react";

export function TopNav() {
  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shrink-0">
      <div className="flex items-center md:hidden">
        {/* Mobile menu toggle would go here */}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <UserButton 
          appearance={{
            elements: {
              avatarBox: "w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700"
            }
          }}
        />
      </div>
    </header>
  );
}