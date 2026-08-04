"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-logo";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { DASHBOARD_NAV } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text)]"
    >
      <SidebarHeader className="dashboard-topbar h-14 min-h-14 justify-center gap-0 px-3 py-0 group-data-[collapsible=icon]:px-1.5">
        <Link
          href="/home"
          className="flex w-full items-center gap-2.5 rounded-xl px-0.5 py-1 transition-colors hover:bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))] group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <BrandMark size="sm" className="shrink-0" />
          <div className="grid min-w-0 flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-base font-extrabold tracking-tight text-[var(--brand-text)]">
              Drishx
            </span>
            <span className="truncate text-xs font-medium text-[var(--brand-text-muted)]">
              Customer portal
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {DASHBOARD_NAV.map((item) => {
                const Icon = item.icon;
                const isActive = isNavActive(pathname, item.href);

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className={cn(
                        "h-10 rounded-xl text-[var(--brand-text-muted)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_10%,var(--brand-card))] hover:text-[var(--brand-text)]",
                        isActive &&
                          "bg-[color-mix(in_srgb,var(--brand-primary)_16%,var(--brand-card))] text-[var(--brand-primary)] shadow-[inset_3px_0_0_0_var(--brand-primary)] hover:bg-[color-mix(in_srgb,var(--brand-primary)_20%,var(--brand-card))] hover:text-[var(--brand-primary)] data-[active=true]:bg-[color-mix(in_srgb,var(--brand-primary)_16%,var(--brand-card))] data-[active=true]:text-[var(--brand-primary)]"
                      )}
                    >
                      <Link href={item.href}>
                        <Icon
                          className={cn(
                            "size-[18px] shrink-0",
                            isActive
                              ? "text-[var(--brand-primary)]"
                              : "text-[var(--brand-link)]"
                          )}
                        />
                        <span className="font-semibold">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail className="hover:after:bg-[var(--brand-primary)]/40" />
    </Sidebar>
  );
}
