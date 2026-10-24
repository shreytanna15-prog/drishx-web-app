"use client";

import Link from "next/link";
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)] px-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.2)] sm:px-6"
      )}
    >
      <h2 className="pt-5 text-sm font-extrabold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
        {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

export function CompanyProfileScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 space-y-4 px-4 py-6 sm:px-6 sm:py-8">
      <ProfileSubpageHeader title="Company Profile" />

      <div className="flex justify-end">
        <Link
          href="/edit-profile"
          className="text-sm font-semibold text-[var(--brand-primary)] underline-offset-2 hover:underline"
        >
          Edit profile
        </Link>
      </div>

      <Section title="Account">
        <DetailRow label="Customer Name" value={user.name || user.email} />
        <DetailRow label="Email" value={user.email} />
        <DetailRow label="Client ID" value={user.id} />
        <DetailRow label="Mobile" value={user.mobileNumber} />
        <DetailRow label="Alternate mobile" value={user.alternateMobileNumber} />
        <DetailRow label="WhatsApp" value={user.whatsappNumber} />
      </Section>

      <Section title="Business info">
        <DetailRow label="Business Name" value={user.businessName} />
        <DetailRow label="Shop name" value={user.shopName} />
        <DetailRow label="Business type" value={user.businessType} />
        <DetailRow label="Address line 1" value={user.addressLine1} />
        <DetailRow label="Address line 2" value={user.addressLine2} />
        <DetailRow label="City" value={user.city} />
        <DetailRow label="State" value={user.state} />
        <DetailRow label="Pincode" value={user.pincode} />
        <DetailRow label="Business email" value={user.businessEmail} />
        <DetailRow label="Shop phone" value={user.shopPhoneNumber} />
      </Section>

      <Section title="GST information">
        <DetailRow label="GST Number" value={user.gstNumber} />
        <DetailRow label="Legal business name" value={user.legalBusinessName} />
        <DetailRow label="Trade name" value={user.tradeName} />
        <DetailRow label="GST registration state" value={user.gstRegistrationState} />
        <DetailRow label="PAN" value={user.panNumber} />
      </Section>

      <Section title="Billing address">
        <DetailRow label="Legal name" value={user.billingLegalName} />
        <DetailRow label="Address" value={user.billingAddress} />
        <DetailRow label="City" value={user.billingCity} />
        <DetailRow label="State" value={user.billingState} />
        <DetailRow label="PIN" value={user.billingPincode} />
        <DetailRow label="GST state" value={user.billingGstState} />
      </Section>

      <Section title="Shipping address">
        <DetailRow label="Legal name" value={user.shippingLegalName} />
        <DetailRow label="Address" value={user.shippingAddress} />
        <DetailRow label="City" value={user.shippingCity} />
        <DetailRow label="State" value={user.shippingState} />
        <DetailRow label="PIN" value={user.shippingPincode} />
      </Section>
    </div>
  );
}
