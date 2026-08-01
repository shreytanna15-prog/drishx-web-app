export type TimeOfDayGreeting =
  | "Good Morning"
  | "Good Afternoon"
  | "Good Evening";

export function getDisplayName(
  name: string | null | undefined,
  email: string
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

/** Prefer business/company name, then personal name, then email local-part. */
export function getCompanyDisplayName(
  businessName: string | null | undefined,
  name: string | null | undefined,
  email: string
): string {
  const company = businessName?.trim();
  if (company) return company;
  return getDisplayName(name, email);
}

/** Local-time greeting: Morning 5–11, Afternoon 12–16, Evening 17–4. */
export function getTimeOfDayGreeting(
  date: Date = new Date()
): TimeOfDayGreeting {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function getInitials(
  name: string | null | undefined,
  email: string
): string {
  const full = getDisplayName(name, email);
  const parts = full.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return full.slice(0, 2).toUpperCase();
}
