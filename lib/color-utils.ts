export type HslColor = {
  h: number;
  s: number;
  l: number;
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function hslToHex({ h, s, l }: HslColor): string {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp(s, 0, 100) / 100;
  const light = clamp(l, 0, 100) / 100;

  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - chroma / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) {
    r = chroma;
    g = x;
  } else if (hue < 120) {
    r = x;
    g = chroma;
  } else if (hue < 180) {
    g = chroma;
    b = x;
  } else if (hue < 240) {
    g = x;
    b = chroma;
  } else if (hue < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function mixHslColors(colors: HslColor[], weights?: number[]): HslColor {
  if (colors.length === 0) {
    return { h: 0, s: 0, l: 50 };
  }

  const normalizedWeights =
    weights && weights.length === colors.length
      ? weights
      : colors.map(() => 1 / colors.length);

  const totalWeight = normalizedWeights.reduce((sum, weight) => sum + weight, 0);

  let x = 0;
  let y = 0;
  let weightedLightness = 0;
  let weightedSaturation = 0;

  colors.forEach((color, index) => {
    const weight = normalizedWeights[index] / totalWeight;
    const angle = (color.h * Math.PI) / 180;
    x += Math.cos(angle) * color.s * weight;
    y += Math.sin(angle) * color.s * weight;
    weightedLightness += color.l * weight;
    weightedSaturation += color.s * weight;
  });

  const hue = (Math.atan2(y, x) * 180) / Math.PI;
  const saturation = Math.sqrt(x * x + y * y);

  return {
    h: Math.round(hue < 0 ? hue + 360 : hue),
    s: Math.round(clamp(saturation || weightedSaturation, 0, 100)),
    l: Math.round(clamp(weightedLightness, 0, 100)),
  };
}

function wheelHueToRadians(hue: number): number {
  return ((hue - 90) * Math.PI) / 180;
}

function pointToWheelHue(dx: number, dy: number): number {
  const radians = Math.atan2(dy, dx);
  const hue = (radians * 180) / Math.PI + 90;
  return ((hue % 360) + 360) % 360;
}

export function touchToHueSat(
  x: number,
  y: number,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number
): HslColor | null {
  const dx = x - cx;
  const dy = y - cy;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < innerRadius * 0.85 || distance > outerRadius * 1.08) {
    return null;
  }

  const hue = pointToWheelHue(dx, dy);
  const saturation = clamp(
    ((distance - innerRadius) / (outerRadius - innerRadius)) * 100,
    0,
    100
  );

  return { h: hue, s: saturation, l: 50 };
}

export function hueSatToPosition(
  h: number,
  s: number,
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number
) {
  const radius =
    innerRadius + (clamp(s, 0, 100) / 100) * (outerRadius - innerRadius);
  const angle = wheelHueToRadians(h);
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "").trim();
  const value =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  if (value.length !== 6) {
    return `rgba(0, 0, 0, ${clamp(alpha, 0, 1)})`;
  }

  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${clamp(alpha, 0, 1)})`;
}
