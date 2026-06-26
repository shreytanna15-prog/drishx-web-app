"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  ProfileSubpageHeader,
} from "@/components/profile/profile-screen";
import { cn } from "@/lib/utils";

type DetailRowProps = {
  label: string;
  value?: string | null;
};

function DetailRow({ label, value }: DetailRowProps) {
  return (
    <div className="grid gap-1 border-b border-[var(--brand-card-border)] py-4 last:border-b-0 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-6">
      <dt className="text-xs font-bold uppercase tracking-wider text-[var(--brand-label)]">
        {label}
      </dt>
      <dd className="text-sm font-semibold text-[var(--brand-text)] sm:text-base">
        {value?.trim() ? value : "—"}
      </dd>
    </div>
  );
}

export function CompanyProfileScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader title="Company Profile" />

      <section
        className={cn(
          "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)] sm:px-6"
        )}
      >
        <dl>
          <DetailRow label="Customer Name" value={user.name || user.email} />
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Client ID" value={user.id} />
          <DetailRow label="Business Name" value={user.businessName} />
          <DetailRow label="GST Number" value={user.gstNumber} />
          <DetailRow label="Business Address" value={user.businessAddress} />
          <DetailRow label="State" value={user.state} />
          <DetailRow label="Pincode" value={user.pincode} />
        </dl>
      </section>
    </div>
  );
}
