import { useEffect, useRef, Component, type ReactNode } from "react";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
import { Switch, Route, useLocation, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/layout/Layout";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";

import Dashboard from "@/pages/dashboard";
import Prices from "@/pages/prices";
import Fairness from "@/pages/fairness";
import Markets from "@/pages/markets";
import Weather from "@/pages/weather";
import Chat from "@/pages/chat";
import Alerts from "@/pages/alerts";
import Schemes from "@/pages/schemes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// ---------------------------------------------------------------------------
// Error boundary — prevents any React render error from producing a blank
// white screen.  Catches runtime TypeErrors (e.g. undefined property access)
// and shows a friendly recovery UI instead.
// ---------------------------------------------------------------------------
interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return { hasError: true, message };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    console.error("[AppErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">
              Something went wrong
            </h1>
            <p className="text-muted-foreground text-sm">{this.state.message}</p>
            <button
              className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => {
                this.setState({ hasError: false, message: "" });
                window.location.reload();
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);

const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "hsl(140, 40%, 30%)",
    colorForeground: "hsl(120, 20%, 15%)",
    colorMutedForeground: "hsl(120, 10%, 40%)",
    colorDanger: "hsl(0, 60%, 50%)",
    colorBackground: "hsl(40, 33%, 98%)",
    colorInput: "hsl(40, 20%, 85%)",
    colorInputForeground: "hsl(120, 20%, 15%)",
    colorNeutral: "hsl(40, 20%, 70%)",
    fontFamily: "Inter, sans-serif",
    borderRadius: "0.5rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-border",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-foreground font-bold",
    headerSubtitle: "text-muted-foreground",
    socialButtonsBlockButtonText: "text-foreground font-medium",
    formFieldLabel: "text-foreground font-medium",
    footerActionLink: "text-primary font-semibold hover:text-primary/80",
    footerActionText: "text-muted-foreground",
    dividerText: "text-muted-foreground",
    identityPreviewEditButton: "text-primary",
    formFieldSuccessText: "text-primary",
    alertText: "text-foreground",
    logoBox: "flex justify-center mb-1",
    logoImage: "h-12 w-12",
    socialButtonsBlockButton: "border border-border bg-background hover:bg-muted transition-colors",
    formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
    formFieldInput: "border-input bg-background text-foreground placeholder:text-muted-foreground focus:border-primary",
    footerAction: "bg-muted/40",
    dividerLine: "bg-border",
    alert: "border-border",
    otpCodeFieldInput: "border-input bg-background text-foreground text-center",
    formFieldRow: "gap-3",
    main: "gap-5",
    badge: { display: "none" },
  },
};

function useHideClerkDevBadge() {
  useEffect(() => {
    const BADGE_TEXTS = ["development mode", "sandbox mode"];
    const hide = () => {
      document.querySelectorAll<HTMLElement>('[class*="cl-"]').forEach((el) => {
        const text = el.textContent?.toLowerCase().trim() ?? "";
        if (BADGE_TEXTS.some((t) => text === t || text.startsWith(t))) {
          let target: HTMLElement = el;
          while (
            target.parentElement &&
            (target.parentElement.textContent?.toLowerCase().trim() === text ||
              target.parentElement.children.length === 1)
          ) {
            target = target.parentElement;
          }
          target.style.display = "none";
        }
      });
    };
    const observer = new MutationObserver(hide);
    observer.observe(document.body, { childList: true, subtree: true });
    hide();
    return () => observer.disconnect();
  }, []);
}

function SignInPage() {
  useHideClerkDevBadge();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground">
            Welcome back to <span className="font-semibold text-primary">Farm Sphere</span>
          </p>
        </div>
        <SignIn
          routing="path"
          path={`${basePath}/sign-in`}
          signUpUrl={`${basePath}/sign-up`}
        />
      </div>
    </div>
  );
}

function SignUpPage() {
  useHideClerkDevBadge();
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center mb-2">
          <p className="text-sm text-muted-foreground">
            Join <span className="font-semibold text-primary">Farm Sphere</span> — Free forever
          </p>
        </div>
        <SignUp
          routing="path"
          path={`${basePath}/sign-up`}
          signInUrl={`${basePath}/sign-in`}
        />
      </div>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Dashboard />
        </Layout>
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function ProtectedRoutes() {
  return (
    <>
      <Show when="signed-in">
        <Layout>
          <Switch>
            <Route path="/prices" component={Prices} />
            <Route path="/fairness" component={Fairness} />
            <Route path="/markets" component={Markets} />
            <Route path="/weather" component={Weather} />
            <Route path="/chat" component={Chat} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/schemes" component={Schemes} />
            <Route component={NotFound} />
          </Switch>
        </Layout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
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
      localization={{
        signIn: {
          start: {
            title: "Sign in to Farm Sphere",
            subtitle: "Your personal market intelligence platform",
          },
        },
        signUp: {
          start: {
            title: "Create your free account",
            subtitle: "Get started with Farm Sphere today",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ClerkQueryClientCacheInvalidator />
          <Switch>
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/" component={HomeRedirect} />
            <Route path="/:rest*" component={ProtectedRoutes} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <WouterRouter base={basePath}>
        <ClerkProviderWithRoutes />
      </WouterRouter>
    </AppErrorBoundary>
  );
}

export default App;
