const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;

export function isValidHexColor(value: string | null | undefined): value is string {
  return Boolean(value?.trim() && HEX_COLOR_PATTERN.test(value.trim()));
}

/** Extract hex from a color-lens notes line, e.g. `Color: Brown (#8B5A2B)`. */
export function parseColorHexFromNotesLine(line: string): string | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith("Color:")) {
    return null;
  }

  const match = trimmed.match(/\((#[0-9A-Fa-f]{3,8})\)/);
  const hex = match?.[1]?.trim();
  return isValidHexColor(hex) ? hex.toUpperCase() : null;
}

/** First color hex found in a multi-line color-lens order notes block. */
export function parseColorHexFromNotes(notes: string | null | undefined): string | null {
  if (!notes?.trim()) {
    return null;
  }

  for (const line of notes.split("\n")) {
    const hex = parseColorHexFromNotesLine(line);
    if (hex) {
      return hex;
    }
  }

  return null;
}
