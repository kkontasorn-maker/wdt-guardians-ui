"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { AdminSidebarNav, AdminWordmark } from "@/components/admin/sidebar-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-brand-paper">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col bg-brand-ink lg:flex">
        <AdminWordmark />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <AdminSidebarNav />
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border/80 bg-brand-paper/95 px-4 backdrop-blur-md sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label="Open backoffice menu"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-60 max-w-[85vw] border-r-0 bg-brand-ink p-0 text-white [&>button]:border-0 [&>button]:bg-transparent [&>button]:text-white [&>button]:shadow-none [&>button]:ring-offset-0 [&>button]:hover:bg-white/10"
              >
                <SheetTitle className="sr-only">Backoffice navigation</SheetTitle>
                <div className="pr-12">
                  <AdminWordmark />
                </div>
                <AdminSidebarNav onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>
            <p className="truncate font-heading text-sm font-extrabold tracking-tight text-brand-ink sm:text-base">
              <span className="sm:hidden">Backoffice</span>
              <span className="hidden sm:inline">Backoffice Console</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className="shrink-0 border-brand-orange/40 bg-accent px-2.5 py-1 text-[11px] font-semibold tracking-wide text-brand-deep"
          >
            DEMO DATA · Admin
          </Badge>
        </header>
        <main className="px-4 py-5 sm:px-6 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
