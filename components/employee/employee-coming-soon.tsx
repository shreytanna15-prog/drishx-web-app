import { Construction, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { EmployeeNavItem } from "@/lib/employee-dashboard-nav";
import { cn } from "@/lib/utils";

type EmployeeComingSoonProps = {
  item: EmployeeNavItem;
};

export function EmployeeComingSoonScreen({ item }: EmployeeComingSoonProps) {
  const Icon = item.icon;

  return (
    <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
      <Card
        className={cn(
          "w-full max-w-lg rounded-2xl border py-0 shadow-[var(--brand-card-shadow)]",
          "border-[var(--brand-card-border)] bg-[var(--brand-card)]"
        )}
      >
        <CardHeader className="items-center border-b border-[var(--brand-card-border)] px-6 py-8 text-center">
          <span className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
            <Icon className="size-8" />
          </span>
          <CardTitle className="text-2xl font-extrabold text-[var(--brand-text)]">
            {item.label}
          </CardTitle>
          <CardDescription className="text-base text-[var(--brand-text-muted)]">
            {item.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-8 text-center">
          <div className="flex items-center gap-2 rounded-full border border-[var(--brand-card-border)] bg-[var(--brand-primary)]/10 px-4 py-2">
            <Construction className="size-4 text-[var(--brand-primary)]" />
            <span className="text-sm font-semibold text-[var(--brand-link)]">
              Coming soon
            </span>
            <Sparkles className="size-4 text-[var(--brand-primary)]" />
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-[var(--brand-text-muted)]">
            The {item.label.toLowerCase()} section for the operations portal is
            being built for the web. It is available in the mobile app and will
            be added here shortly.
          </p>
          <Button
            asChild
            className={cn(
              "mt-2 rounded-xl font-bold",
              "bg-gradient-to-b from-[#f5ad42] to-[#e8941f] text-[var(--brand-primary-text)]",
              "hover:from-[#f7b84e] hover:to-[#ec9d28]"
            )}
          >
            <Link href="/employee/home">Back to Home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
