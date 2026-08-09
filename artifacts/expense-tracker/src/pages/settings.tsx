import { useGetSettings, useUpdateSettings } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";

export default function SettingsPage() {
  const { data: settings, isLoading } = useGetSettings();
  const updateSettings = useUpdateSettings();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [localSettings, setLocalSettings] = useState({
    currency: 'PKR',
    weeklyEmailEnabled: false,
    defaultView: 'dashboard' as 'dashboard'|'transactions'|'budgets'|'reports'
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings({
        currency: settings.currency || 'PKR',
        weeklyEmailEnabled: settings.weeklyEmailEnabled ?? false,
        defaultView: settings.defaultView || 'dashboard'
      });
    }
  }, [settings]);

  const handleUpdate = (key: string, value: any) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    
    updateSettings.mutate({ data: updated }, {
      onSuccess: () => {
        toast({ title: "Settings saved" });
      },
      onError: () => {
        toast({ title: "Failed to save settings", variant: "destructive" });
        if (settings) setLocalSettings(settings as any);
      }
    });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your account preferences.</p>
      </div>

      {isLoading ? (
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize how SpendWise looks and behaves.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Currency</Label>
                  <p className="text-sm text-slate-500">The currency used for all amounts.</p>
                </div>
                <Select 
                  value={localSettings.currency} 
                  onValueChange={(val) => handleUpdate('currency', val)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PKR">PKR (Rs.)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Default View</Label>
                  <p className="text-sm text-slate-500">The page you see when you log in.</p>
                </div>
                <Select 
                  value={localSettings.defaultView} 
                  onValueChange={(val) => handleUpdate('defaultView', val)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dashboard">Dashboard</SelectItem>
                    <SelectItem value="transactions">Transactions</SelectItem>
                    <SelectItem value="budgets">Budgets</SelectItem>
                    <SelectItem value="reports">Reports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how we communicate with you.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base cursor-pointer" htmlFor="weekly-email">Weekly Summary</Label>
                  <p className="text-sm text-slate-500">Receive a weekly email with your spending overview.</p>
                </div>
                <Switch 
                  id="weekly-email"
                  checked={localSettings.weeklyEmailEnabled}
                  onCheckedChange={(val) => handleUpdate('weeklyEmailEnabled', val)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize the look and feel.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-slate-500">Switch between light and dark modes.</p>
                </div>
                <Select 
                  value={theme} 
                  onValueChange={(val: any) => setTheme(val)}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}