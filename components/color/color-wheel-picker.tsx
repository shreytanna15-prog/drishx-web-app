"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  clamp,
  hslToHex,
  hueSatToPosition,
  touchToHueSat,
  type HslColor,
} from "@/lib/color-utils";

const SEGMENTS = 72;
const MAX_THUMBS = 3;
const WHEEL_SIZE = 280;

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function ringSegmentPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number
) {
  const startOuter = polarToCartesian(cx, cy, outerRadius, endAngle);
  const endOuter = polarToCartesian(cx, cy, outerRadius, startAngle);
  const startInner = polarToCartesian(cx, cy, innerRadius, endAngle);
  const endInner = polarToCartesian(cx, cy, innerRadius, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export type WheelColor = HslColor & {
  id: string;
  hex: string;
};

export function createWheelColor(id: string, hsl: HslColor): WheelColor {
  const normalized = {
    h: clamp(hsl.h, 0, 360),
    s: clamp(hsl.s, 0, 100),
    l: clamp(hsl.l, 0, 100),
  };
  return {
    id,
    ...normalized,
    hex: hslToHex(normalized),
  };
}

const WheelRing = memo(function WheelRing({
  center,
  innerRadius,
  outerRadius,
  centerFill,
}: {
  center: number;
  innerRadius: number;
  outerRadius: number;
  centerFill: string;
}) {
  const segments = useMemo(() => {
    const step = 360 / SEGMENTS;
    return Array.from({ length: SEGMENTS }, (_, index) => {
      const start = index * step;
      const end = start + step;
      const hue = start + step / 2;
      return {
        key: index,
        path: ringSegmentPath(center, center, innerRadius, outerRadius, start, end),
        fill: `hsl(${hue}, 100%, 50%)`,
      };
    });
  }, [center, innerRadius, outerRadius]);

  return (
    <svg width={WHEEL_SIZE} height={WHEEL_SIZE} className="select-none">
      <g>
        {segments.map((segment) => (
          <path key={segment.key} d={segment.path} fill={segment.fill} />
        ))}
      </g>
      <circle cx={center} cy={center} r={innerRadius - 6} fill={centerFill} />
    </svg>
  );
});

export function ColorWheelPicker({
  colors,
  activeColorId,
  onColorChange,
  centerFill = "rgba(15, 22, 32, 0.95)",
}: {
  colors: WheelColor[];
  activeColorId: string;
  onColorChange: (id: string, next: HslColor) => void;
  centerFill?: string;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [thumbPositions, setThumbPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});

  const center = WHEEL_SIZE / 2;
  const outerRadius = WHEEL_SIZE * 0.46;
  const innerRadius = WHEEL_SIZE * 0.28;

  const activeColor =
    colors.find((entry) => entry.id === activeColorId) ?? colors[0] ?? null;

  const syncThumbs = useCallback(() => {
    const next: Record<string, { x: number; y: number }> = {};
    colors.slice(0, MAX_THUMBS).forEach((entry) => {
      const position = hueSatToPosition(
        entry.h,
        entry.s,
        center,
        center,
        innerRadius,
        outerRadius
      );
      next[entry.id] = position;
    });
    setThumbPositions(next);
  }, [center, colors, innerRadius, outerRadius]);

  useEffect(() => {
    if (!draggingRef.current) {
      syncThumbs();
    }
  }, [syncThumbs]);

  const handlePointer = useCallback(
    (clientX: number, clientY: number, commit: boolean) => {
      if (!surfaceRef.current || !activeColor) return;

      const rect = surfaceRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const picked = touchToHueSat(x, y, center, center, innerRadius, outerRadius);
      if (!picked) return;

      const position = hueSatToPosition(
        picked.h,
        picked.s,
        center,
        center,
        innerRadius,
        outerRadius
      );

      setThumbPositions((current) => ({
        ...current,
        [activeColor.id]: position,
      }));

      if (commit) {
        onColorChange(activeColor.id, {
          h: picked.h,
          s: picked.s,
          l: activeColor.l,
        });
      }
    },
    [activeColor, center, innerRadius, onColorChange, outerRadius]
  );

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    handlePointer(event.clientX, event.clientY, false);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    handlePointer(event.clientX, event.clientY, false);
  };

  const onPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    handlePointer(event.clientX, event.clientY, true);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className="flex items-center justify-center">
      <div
        ref={surfaceRef}
        className="relative touch-none"
        style={{ width: WHEEL_SIZE, height: WHEEL_SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <WheelRing
          center={center}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          centerFill={centerFill}
        />
        {colors.slice(0, MAX_THUMBS).map((entry) => {
          const position = thumbPositions[entry.id];
          if (!position) return null;
          const isActive = entry.id === activeColorId;
          const radius = isActive ? 11 : 9;
          return (
            <div
              key={entry.id}
              className="pointer-events-none absolute rounded-full border-2 border-white shadow-md"
              style={{
                left: position.x - radius,
                top: position.y - radius,
                width: radius * 2,
                height: radius * 2,
                backgroundColor: entry.hex,
                borderWidth: isActive ? 3 : 2,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
