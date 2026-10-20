"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { RoleProvider, RoleSwitcher } from "@/components/role-provider";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Requests" },
  { href: "/audit", label: "Audit" },
];

function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-3 text-sm">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-muted-foreground hover:text-foreground",
            pathname === link.href && "text-foreground font-medium",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <RoleProvider>
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#eef2f7_0%,_#f8fafc_45%,_#ffffff_100%)]">
        <header className="border-b bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
            <div className="flex items-center gap-6">
              <Link href="/" className="font-semibold tracking-tight">
                AI Triage Console
              </Link>
              <Suspense fallback={<nav className="flex gap-3 text-sm" />}>
                <NavLinks />
              </Suspense>
            </div>
            <RoleSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
      </div>
    </RoleProvider>
  );
}
