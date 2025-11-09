import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type DashboardNavItem = {
  href: string;
  label: string;
  badge?: ReactNode;
  exact?: boolean;
};

export type DashboardLayoutProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  navItems?: DashboardNavItem[];
  titleTestId?: string;
  showHeader?: boolean;
};

export const defaultDashboardNav: DashboardNavItem[] = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/members", label: "Members" },
  { href: "/dashboard/aircraft", label: "Aircraft" },
  { href: "/dashboard/settings", label: "Settings" },
];

export function DashboardLayout({
  title,
  description,
  children,
  actions,
  navItems = defaultDashboardNav,
  titleTestId,
  showHeader = true,
}: DashboardLayoutProps) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-muted/20 text-foreground">
      {showHeader ? (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Freedom Aviation
              </p>
              <h1 className="text-2xl font-bold tracking-tight" data-testid={titleTestId}>
                {title}
              </h1>
              {description ? (
                <p className="text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions ? <div className="flex-shrink-0">{actions}</div> : null}
          </div>
          {navItems.length > 0 ? (
            <div className="border-t border-border/80 bg-background/95">
              <div className="mx-auto flex w-full max-w-6xl overflow-x-auto px-1">
                <nav className="flex w-full gap-1 px-3 py-2">
                  {navItems.map((item) => {
                    const isActive = item.exact
                      ? location === item.href
                      : location === item.href || location.startsWith(`${item.href}/`);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "relative inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                          "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isActive
                            ? "bg-muted text-foreground shadow-sm"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <span>{item.label}</span>
                        {item.badge ? item.badge : null}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="space-y-6">{children}</div>
      </main>
    </div>
  );
}

