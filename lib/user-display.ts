export type TimeOfDayGreeting =
  | "Good Morning"
  | "Good Afternoon"
  | "Good Evening";

export type TimeOfDayBucket = "morning" | "afternoon" | "evening";

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

/** Local-time bucket: morning 5–11:59, afternoon 12–17:59, evening 18–4:59. */
export function getTimeOfDayBucket(date: Date = new Date()): TimeOfDayBucket {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export function getTimeOfDayGreeting(
  date: Date = new Date()
): TimeOfDayGreeting {
  const bucket = getTimeOfDayBucket(date);
  if (bucket === "morning") return "Good Morning";
  if (bucket === "afternoon") return "Good Afternoon";
  return "Good Evening";
}

export function getTimeOfDayTagline(date: Date = new Date()): string {
  const bucket = getTimeOfDayBucket(date);
  if (bucket === "morning") return "Let's make today more productive!";
  if (bucket === "afternoon") return "Clear mind. Better focus.";
  return "Great vision. Stronger tomorrow.";
}

/** Theme-aware lifestyle hero art from `public/home_imgs`. */
export function getTimeOfDayHeroImageSrc(
  theme: "light" | "dark",
  date: Date = new Date()
): string {
  const bucket = getTimeOfDayBucket(date);
  const tone = theme === "dark" ? "black" : "light";
  return `/home_imgs/${bucket}-${tone}.jpeg`;
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
