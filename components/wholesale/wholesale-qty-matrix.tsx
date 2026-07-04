"use client";

import { memo, useMemo } from "react";
import { Input } from "@/components/ui/input";
import type {
  WholesaleMatrixRow,
  WholesaleMatrixSpec,
} from "@/lib/wholesale-matrix";
import { cn } from "@/lib/utils";

type WholesaleQtyMatrixProps = {
  spec: WholesaleMatrixSpec;
  visibleRows: WholesaleMatrixRow[];
  visibleCols: number[];
  qtyMap: Record<string, string>;
  onQtyChange: (key: string, value: string) => void;
};

type MatrixRowItem = {
  row: WholesaleMatrixRow;
  rowIndex: number;
  showPrimaryLabel: boolean;
};

const MatrixCell = memo(function MatrixCell({
  cellKey,
  value,
  onQtyChange,
}: {
  cellKey: string;
  value: string;
  onQtyChange: (key: string, value: string) => void;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onQtyChange(cellKey, e.target.value.replace(/\D/g, ""))}
      inputMode="numeric"
      placeholder="0"
      className="h-9 w-full min-w-[52px] max-w-[72px] rounded-lg border-[var(--brand-input-border)] bg-[var(--brand-input-bg)] text-center text-sm font-bold"
    />
  );
});

export function WholesaleQtyMatrix({
  spec,
  visibleRows,
  visibleCols,
  qtyMap,
  onQtyChange,
}: WholesaleQtyMatrixProps) {
  const rowItems = useMemo((): MatrixRowItem[] => {
    return visibleRows.map((row, rowIndex) => ({
      row,
      rowIndex,
      showPrimaryLabel:
        rowIndex === 0 || row.label !== visibleRows[rowIndex - 1]?.label,
    }));
  }, [visibleRows]);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--brand-card-border)] bg-[var(--brand-card)]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_85%,var(--brand-primary)_15%)]">
              <th className="relative min-w-[88px] border-r border-[var(--brand-card-border)] px-2 py-3 text-left">
                <span className="absolute bottom-1 left-2 text-[8px] font-extrabold uppercase tracking-wide text-[var(--brand-text-muted)]">
                  {spec.rowHeader}
                </span>
                <span className="absolute right-2 top-1 text-[8px] font-extrabold uppercase tracking-wide text-[var(--brand-text-muted)]">
                  {spec.colHeader}
                </span>
                <span
                  aria-hidden
                  className="absolute left-0 top-1/2 block h-px w-[120%] -rotate-[52deg] bg-[var(--brand-card-border)]"
                />
              </th>
              {visibleCols.map((col) => (
                <th
                  key={`col-${col}`}
                  className="min-w-[76px] border-r border-[var(--brand-card-border)] px-2 py-3 text-center text-xs font-extrabold text-[var(--brand-text)] last:border-r-0"
                >
                  {spec.formatCol(col)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowItems.map((item) => (
              <tr
                key={item.row.id}
                className="border-b border-[var(--brand-card-border)] last:border-b-0"
              >
                <td className="min-w-[88px] border-r border-[var(--brand-card-border)] bg-[color-mix(in_srgb,var(--brand-card)_92%,var(--brand-primary)_8%)] px-2 py-2 align-middle">
                  {item.showPrimaryLabel ? (
                    <p className="text-center text-[10px] font-extrabold leading-tight text-[var(--brand-text)]">
                      {item.row.label}
                    </p>
                  ) : null}
                  {item.row.subLabel ? (
                    <p
                      className={cn(
                        "text-center text-[9px] font-bold text-[var(--brand-text-muted)]",
                        !item.showPrimaryLabel && "text-[11px] font-extrabold text-[var(--brand-text)]"
                      )}
                    >
                      {item.row.subLabel}
                    </p>
                  ) : null}
                </td>
                {visibleCols.map((col) => {
                  const cells = spec.cellsAt(item.row, col);
                  const cell = cells[0];
                  if (!cell) {
                    return (
                      <td
                        key={`${item.row.id}-${col}`}
                        className="border-r border-[var(--brand-card-border)] px-2 py-2 text-center text-[var(--brand-text-muted)] last:border-r-0"
                      >
                        —
                      </td>
                    );
                  }
                  return (
                    <td
                      key={`${item.row.id}-${col}`}
                      className="border-r border-[var(--brand-card-border)] px-2 py-2 text-center last:border-r-0"
                    >
                      <MatrixCell
                        cellKey={cell.key}
                        value={qtyMap[cell.key] ?? ""}
                        onQtyChange={onQtyChange}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
