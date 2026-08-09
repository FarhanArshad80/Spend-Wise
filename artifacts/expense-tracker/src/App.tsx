import { type ReactNode } from 'react';
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from '@clerk/react';
import { publishableKeyFromHost } from '@clerk/react/internal';
import { shadcn } from '@clerk/themes';
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import NotFound from '@/pages/not-found';

import LandingPage from '@/pages/landing';
import DashboardPage from '@/pages/dashboard';
import TransactionsPage from '@/pages/transactions';
import TransactionFormPage from '@/pages/transaction-form';
import BudgetsPage from '@/pages/budgets';
import CategoriesPage from '@/pages/categories';
import RecurringPage from '@/pages/recurring';
import ReportsPage from '@/pages/reports';
import SettingsPage from '@/pages/settings';
import { Shell } from '@/components/layout/Shell';

import { ThemeProvider } from '@/components/theme-provider';

const queryClient = new QueryClient();

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath) ? path.slice(basePath.length) || '/' : path;
}

if (!clerkPubKey) throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: basePath || '/',
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: '#0d9488',
    colorForeground: '#0f172a',
    colorMutedForeground: '#64748b',
    colorDanger: '#dc2626',
    colorBackground: '#f8fafc',
    colorInput: '#ffffff',
    colorInputForeground: '#0f172a',
    colorNeutral: '#cbd5e1',
    fontFamily: 'Inter, sans-serif',
    borderRadius: '0.75rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white dark:bg-slate-900 rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-slate-900 dark:text-white font-bold text-2xl',
    headerSubtitle: 'text-slate-500 dark:text-slate-400 text-sm',
    socialButtonsBlockButtonText: 'text-slate-700 dark:text-slate-300 font-medium',
    formFieldLabel: 'text-slate-700 dark:text-slate-300 text-sm font-medium',
    footerActionLink: 'text-teal-600 font-medium hover:text-teal-700',
    footerActionText: 'text-slate-500 dark:text-slate-400 text-sm',
    dividerText: 'text-slate-400 text-xs',
    identityPreviewEditButton: 'text-teal-600',
    formFieldSuccessText: 'text-teal-600 text-xs',
    alertText: 'text-slate-700 dark:text-slate-300 text-sm',
    logoBox: 'flex justify-center mb-2',
    logoImage: 'h-10 w-auto',
    socialButtonsBlockButton: 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg',
    formButtonPrimary: 'bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg',
    formFieldInput: 'border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500',
    footerAction: 'border-t border-slate-100 dark:border-slate-800 pt-4',
    dividerLine: 'bg-slate-200 dark:bg-slate-800',
    alert: 'border border-red-100 bg-red-50 rounded-lg',
    otpCodeFieldInput: 'border border-slate-200 rounded-lg',
    formFieldRow: 'gap-3',
    main: 'gap-4',
  },
};

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 px-4">
      <div className="w-full max-w-lg">
        <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} />
      </div>
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50/30 dark:from-slate-950 dark:to-teal-950/20 px-4">
      <div className="w-full max-w-lg">
        <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} />
      </div>
    </div>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const uid = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== uid) qc.clear();
      prevUserIdRef.current = uid;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in"><Redirect to="/dashboard" /></Show>
      <Show when="signed-out"><LandingPage /></Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <Shell>
          <Component />
        </Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            {/* Protected Routes */}
            <Route path="/dashboard"><ProtectedRoute component={DashboardPage} /></Route>
            <Route path="/transactions"><ProtectedRoute component={TransactionsPage} /></Route>
            <Route path="/transactions/new"><ProtectedRoute component={TransactionFormPage} /></Route>
            <Route path="/transactions/:id/edit"><ProtectedRoute component={TransactionFormPage} /></Route>
            <Route path="/budgets"><ProtectedRoute component={BudgetsPage} /></Route>
            <Route path="/categories"><ProtectedRoute component={CategoriesPage} /></Route>
            <Route path="/recurring"><ProtectedRoute component={RecurringPage} /></Route>
            <Route path="/reports"><ProtectedRoute component={ReportsPage} /></Route>
            <Route path="/settings"><ProtectedRoute component={SettingsPage} /></Route>
            
            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="spendwise-theme">
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </ThemeProvider>
  );
}

export default App;
