export function getDisplayName(
  name: string | null | undefined,
  email: string
): string {
  const trimmed = name?.trim();
  if (trimmed) return trimmed;
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
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
