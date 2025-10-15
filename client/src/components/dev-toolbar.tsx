import { useState } from "react";
import { useLocation } from "wouter";
import { ChevronDown, Settings, Home, DollarSign, Users, Plane, Briefcase, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DevToolbar() {
  const [location, setLocation] = useLocation();
  const [isMinimized, setIsMinimized] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) return null;

  const pages = {
    marketing: [
      { path: "/", label: "Home", icon: Home },
      { path: "/pricing", label: "Pricing", icon: DollarSign },
      { path: "/hangar-locations", label: "Hangar Locations", icon: Plane },
      { path: "/login", label: "Login", icon: Users },
    ],
    dashboards: [
      { path: "/dashboard", label: "Owner Dashboard", icon: Briefcase },
      { path: "/dashboard/more", label: "Owner More", icon: Briefcase },
      { path: "/admin", label: "Admin Dashboard", icon: Settings },
      { path: "/admin/pricing", label: "Pricing Configurator", icon: DollarSign },
      { path: "/cfi", label: "CFI Dashboard", icon: Users },
    ],
  };

  const currentPage = [...pages.marketing, ...pages.dashboards].find(
    (p) => p.path === location
  );

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50" data-testid="dev-toolbar-minimized">
        <Button
          size="icon"
          variant="outline"
          onClick={() => setIsMinimized(false)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-600 shadow-lg"
          data-testid="button-expand-toolbar"
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-yellow-400 border-2 border-yellow-600 rounded-lg shadow-lg p-3 min-w-[280px]"
      data-testid="dev-toolbar"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-black" />
          <span className="text-xs font-mono font-bold text-black">DEV MODE</span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsMinimized(true)}
          className="h-6 w-6 p-0 hover:bg-yellow-500"
          data-testid="button-minimize-toolbar"
        >
          <ChevronDown className="h-3 w-3 text-black" />
        </Button>
      </div>

      <div className="space-y-2">
        <div className="text-xs text-black/70 mb-1">Current: {currentPage?.label || location}</div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white hover:bg-gray-50 text-black border-yellow-600"
              data-testid="dropdown-marketing-pages"
            >
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                <span>Marketing Pages</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px]">
            <DropdownMenuLabel>Marketing</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pages.marketing.map((page) => (
              <DropdownMenuItem
                key={page.path}
                onClick={() => setLocation(page.path)}
                className={location === page.path ? "bg-accent" : ""}
                data-testid={`nav-${page.path.replace(/\//g, '-')}`}
              >
                <page.icon className="h-4 w-4 mr-2" />
                {page.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-white hover:bg-gray-50 text-black border-yellow-600"
              data-testid="dropdown-dashboard-pages"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Dashboards</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[240px]">
            <DropdownMenuLabel>Dashboards</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {pages.dashboards.map((page) => (
              <DropdownMenuItem
                key={page.path}
                onClick={() => setLocation(page.path)}
                className={location === page.path ? "bg-accent" : ""}
                data-testid={`nav-${page.path.replace(/\//g, '-')}`}
              >
                <page.icon className="h-4 w-4 mr-2" />
                {page.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-2 pt-2 border-t border-yellow-600">
        <div className="text-xs text-black/60 font-mono">
          Environment: {import.meta.env.MODE}
        </div>
      </div>
    </div>
  );
}
