"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import {
  Heart,
  LayoutDashboard,
  HandHeart,
  ClipboardList,
  Building2,
  Shield,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const donorLinks = [
  { href: "/donor", label: "Dashboard", icon: LayoutDashboard },
  { href: "/donor/matches", label: "My Matches", icon: HandHeart },
];

const hospitalLinks = [
  { href: "/hospital", label: "Dashboard", icon: LayoutDashboard },
  { href: "/hospital/new-request", label: "New Request", icon: ClipboardList },
];

const adminLinks = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/donors", label: "Donors", icon: HandHeart },
  { href: "/admin/organizations", label: "Organizations", icon: Building2 },
  { href: "/admin/analytics", label: "Analytics", icon: Shield },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const links =
    user.role === "donor"
      ? donorLinks
      : user.role === "hospital_staff"
      ? hospitalLinks
      : adminLinks;

  const roleLabel =
    user.role === "donor"
      ? "Donor"
      : user.role === "hospital_staff"
      ? "Hospital Staff"
      : "Admin";

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-surface border border-border"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 h-full w-64 bg-surface border-r border-border z-40 flex flex-col transition-transform lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-6 border-b border-border">
          <Link href="/" className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-primary" fill="currentColor" />
            <span className="text-xl font-bold">Keyzdom</span>
          </Link>
        </div>

        <div className="p-4 border-b border-border">
          <div className="text-sm font-medium text-text-primary">{user.name}</div>
          <div className="text-xs text-text-secondary">{roleLabel}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {links.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-primary/5 hover:text-text-primary"
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <ThemeToggle />
          <button
            onClick={() => {
              logout();
              window.location.href = "/";
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
