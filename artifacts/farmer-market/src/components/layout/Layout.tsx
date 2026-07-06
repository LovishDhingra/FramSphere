import { Link, useLocation } from "wouter";
import { useClerk, useUser } from "@clerk/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  LineChart,
  Scale,
  MapPin,
  CloudSun,
  MessageSquare,
  Bell,
  FileText,
  Menu,
  LogOut,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Price Explorer", href: "/prices", icon: LineChart },
  { name: "Fairness Analyzer", href: "/fairness", icon: Scale },
  { name: "Market Finder", href: "/markets", icon: MapPin },
  { name: "Weather Forecast", href: "/weather", icon: CloudSun },
  { name: "AI Assistant", href: "/chat", icon: MessageSquare },
  { name: "Alerts Feed", href: "/alerts", icon: Bell },
  { name: "Gov Schemes", href: "/schemes", icon: FileText },
];

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function UserMenu() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const displayName =
    user?.fullName ||
    user?.firstName ||
    user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "Kisan";

  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-left">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={user?.imageUrl} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold truncate">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive cursor-pointer"
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut } = useClerk();

  const NavLinks = () => (
    <div className="space-y-1">
      {navigation.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.name} href={item.href}>
            <div
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon
                className={cn(
                  "h-5 w-5",
                  isActive ? "text-primary-foreground" : "text-muted-foreground"
                )}
              />
              {item.name}
            </div>
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col border-r bg-sidebar">
        <div className="p-6 flex items-center gap-3 border-b">
          <div className="bg-primary text-primary-foreground p-2 rounded-lg">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight text-sidebar-foreground">Farm Sphere</h1>
            <p className="text-xs text-muted-foreground font-medium">किसान पहले, हमेशा</p>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Market Tools
          </div>
          <NavLinks />
        </nav>
        <div className="p-4 border-t space-y-3">
          <div className="bg-primary/10 rounded-lg p-4 border border-primary/20">
            <h4 className="font-medium text-sm text-primary mb-1">Kisan Helpline</h4>
            <p className="text-xs text-muted-foreground mb-3">Get support directly from our experts</p>
            <Button size="sm" className="w-full font-medium" variant="outline">
              1800-180-1551
            </Button>
          </div>
          <UserMenu />
        </div>
      </aside>

      {/* Mobile Sidebar & Header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden flex items-center justify-between border-b bg-card p-4 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <Sprout className="h-5 w-5" />
            </div>
            <h1 className="font-bold text-base">Farm Sphere</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => signOut({ redirectUrl: basePath || "/" })}
              className="p-2 rounded-md hover:bg-muted transition-colors"
              title="Sign out"
            >
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-mr-2">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col">
                <div className="p-6 flex items-center gap-3 border-b">
                  <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                    <Sprout className="h-6 w-6" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg leading-tight">Farm Sphere</h1>
                    <p className="text-xs text-muted-foreground font-medium">किसान पहले</p>
                  </div>
                </div>
                <nav className="flex-1 overflow-y-auto p-4">
                  <NavLinks />
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
