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
import { EMPLOYEE_DASHBOARD_NAV } from "@/lib/employee-dashboard-nav";
import { cn } from "@/lib/utils";

function isNavActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function EmployeeAppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      className="border-[var(--brand-card-border)] bg-[var(--brand-card)] text-[var(--brand-text)]"
    >
      <SidebarHeader className="dashboard-topbar !flex-row gap-0 !p-0 px-3">
        <SidebarMenu className="w-full">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="h-11 rounded-xl hover:bg-[color-mix(in_srgb,var(--brand-primary)_12%,var(--brand-card))]"
            >
              <Link href="/employee/home">
                <BrandMark className="dashboard-sidebar__nav-icon size-8 shadow-[0_2px_8px_rgba(0,0,0,0.22)]" />
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-base font-extrabold tracking-tight text-[var(--brand-text)]">
                    Drishx
                  </span>
                  <span className="truncate text-xs font-medium text-[var(--brand-text-muted)]">
                    Operations portal
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
            Operations
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1 px-1">
              {EMPLOYEE_DASHBOARD_NAV.map((item) => {
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
