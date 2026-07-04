import { formatPowerLabel } from '@/lib/cart-utils';
import { formatAxisValue } from '@/lib/lens-display';
import { isAllowedCompoundCombo, powerKey, type WholesaleGridMode } from '@/lib/wholesale-powers';
import { isAllowedCrossCombo } from '@/lib/cross-power';

export const MATRIX_INITIAL_ROWS = 10;
export const MATRIX_INITIAL_COLS = 10;
export const MATRIX_LOAD_MORE_ROWS = 5;
export const MATRIX_LOAD_MORE_COLS = 5;

export type MatrixCell = {
  key: string;
  subLabel?: string;
};

/** One rendered matrix row (SPH, CYL, or SPH+ADD for compound bifocal). */
export type WholesaleMatrixRow = {
  id: string;
  label: string;
  subLabel?: string;
  power?: number;
  sph?: number;
  cyl?: number;
  add?: number;
};

export type WholesaleMatrixSpec = {
  rows: WholesaleMatrixRow[];
  cols: number[];
  rowHeader: string;
  colHeader: string;
  formatCol: (value: number) => string;
  cellsAt: (row: WholesaleMatrixRow, colValue: number) => MatrixCell[];
};

export type GridEntry = {
  key: string;
  label: string;
  sph: number;
  cyl: number | null;
  add: number | null;
  sphAdd: number | null;
  cylAdd: number | null;
  axis: number | null;
};

export type BuildMatrixParams = {
  mode: WholesaleGridMode;
  isBifocalLens: boolean;
  isSingleVision: boolean;
  sphList: number[];
  cylList: number[];
  /** Shared ADD range for Kryptok / Progressive (applies to both SPH and CYL). */
  addList: number[];
  /** Fixed axis from the product card (not user-selectable). */
  productAxis: number | null;
  crossPowerMeta?: { maxCyl: number } | null;
};

export function qtyKeyCompound(sph: number, cyl: number) {
  return `${powerKey(sph)}|${powerKey(cyl)}`;
}

export function qtyKeySphAdd(sph: number, add: number) {
  return `${powerKey(sph)}|add:${powerKey(add)}`;
}

export function qtyKeyCylAxisAdd(cyl: number, axis: number, add: number) {
  return `${powerKey(cyl)}|axis:${axis}|add:${powerKey(add)}`;
}

/** Compound Kryptok / Progressive: one ADD value shared for SPH and CYL. */
export function qtyKeyCompoundBifocal(
  sph: number,
  cyl: number,
  axis: number,
  add: number
) {
  return `${powerKey(sph)}|${powerKey(cyl)}|axis:${axis}|add:${powerKey(add)}`;
}

/** @deprecated Use qtyKeyCompoundBifocal */
export function qtyKeyCompoundKryptok(
  sph: number,
  cyl: number,
  axis: number,
  add: number,
  _cylAdd?: number
) {
  return qtyKeyCompoundBifocal(sph, cyl, axis, add);
}

function isAllowedMatrixCombo(
  sph: number,
  cyl: number,
  params: Pick<BuildMatrixParams, 'isSingleVision' | 'crossPowerMeta'>
): boolean {
  if (params.crossPowerMeta) {
    return isAllowedCrossCombo(sph, cyl);
  }
  if (params.isSingleVision) {
    return isAllowedCompoundCombo(sph, cyl);
  }
  return isAllowedCompoundCombo(sph, cyl);
}

function compoundRowValues(
  sphList: number[],
  cylList: number[],
  params: Pick<BuildMatrixParams, 'isSingleVision' | 'crossPowerMeta'>
): number[] {
  return sphList.filter((sph) =>
    cylList.some((cyl) => isAllowedMatrixCombo(sph, cyl, params))
  );
}

function powerRow(value: number): WholesaleMatrixRow {
  return { id: powerKey(value), label: formatPowerLabel(value), power: value };
}

function compoundSphCylPairRows(
  sphList: number[],
  cylList: number[],
  params: Pick<BuildMatrixParams, 'isSingleVision' | 'crossPowerMeta'>
): WholesaleMatrixRow[] {
  const rows: WholesaleMatrixRow[] = [];
  for (const sph of sphList) {
    for (const cyl of cylList) {
      if (!isAllowedMatrixCombo(sph, cyl, params)) {
        continue;
      }
      rows.push({
        id: qtyKeyCompound(sph, cyl),
        label: `${formatPowerLabel(sph)}/${formatPowerLabel(cyl)}`,
        sph,
        cyl,
      });
    }
  }
  return rows;
}

export function buildWholesaleMatrixSpec(params: BuildMatrixParams): WholesaleMatrixSpec | null {
  const {
    mode,
    isBifocalLens,
    isSingleVision,
    sphList,
    cylList,
    addList,
    productAxis,
    crossPowerMeta,
  } = params;

  const axisForKey = productAxis ?? 0;

  if (mode === 'sph-only') {
    const cols = isBifocalLens ? addList : [0];
    if (sphList.length === 0 || cols.length === 0) return null;
    return {
      rows: sphList.map((sph) => powerRow(sph)),
      cols,
      rowHeader: 'SPH',
      colHeader: isBifocalLens ? 'ADD' : 'QTY',
      formatCol: (value) => (isBifocalLens ? formatPowerLabel(value) : '—'),
      cellsAt: (row, col) => {
        const sph = row.power;
        if (sph == null) return [];
        if (isBifocalLens) {
          return [{ key: qtyKeySphAdd(sph, col) }];
        }
        return [{ key: powerKey(sph) }];
      },
    };
  }

  if (mode === 'cyl-only') {
    const cols = isBifocalLens ? addList : [0];
    if (cylList.length === 0 || cols.length === 0) return null;
    return {
      rows: cylList.map((cyl) => powerRow(cyl)),
      cols,
      rowHeader: 'CYL',
      colHeader: isBifocalLens ? 'ADD' : 'QTY',
      formatCol: (value) => (isBifocalLens ? formatPowerLabel(value) : '—'),
      cellsAt: (row, col) => {
        const cyl = row.power;
        if (cyl == null) return [];
        if (isBifocalLens) {
          return [{ key: qtyKeyCylAxisAdd(cyl, axisForKey, col) }];
        }
        return [{ key: powerKey(cyl) }];
      },
    };
  }

  if (mode === 'compound') {
    if (sphList.length === 0 || cylList.length === 0) return null;
    const sphRows = compoundRowValues(sphList, cylList, {
      isSingleVision,
      crossPowerMeta,
    });
    if (sphRows.length === 0) return null;

    if (isBifocalLens) {
      const rows = compoundSphCylPairRows(sphList, cylList, {
        isSingleVision,
        crossPowerMeta,
      });
      if (rows.length === 0 || addList.length === 0) return null;
      return {
        rows,
        cols: addList,
        rowHeader: 'SPH/CYL',
        colHeader: 'ADD',
        formatCol: formatPowerLabel,
        cellsAt: (row, add) => {
          const sph = row.sph;
          const cyl = row.cyl;
          if (sph == null || cyl == null) return [];
          return [{ key: qtyKeyCompoundBifocal(sph, cyl, axisForKey, add) }];
        },
      };
    }

    return {
      rows: sphRows.map((sph) => powerRow(sph)),
      cols: cylList,
      rowHeader: 'SPH',
      colHeader: 'CYL',
      formatCol: formatPowerLabel,
      cellsAt: (row, cyl) => {
        const sph = row.power;
        if (sph == null) return [];
        if (!isAllowedMatrixCombo(sph, cyl, { isSingleVision, crossPowerMeta })) return [];
        return [{ key: qtyKeyCompound(sph, cyl) }];
      },
    };
  }

  return null;
}

/** Build a cart line entry from matrix row/col (same source as cellsAt). */
export function resolveGridEntryFromMatrixCell(
  row: WholesaleMatrixRow,
  colValue: number,
  params: BuildMatrixParams,
  key: string
): GridEntry | null {
  const { mode, isBifocalLens, productAxis } = params;
  const axis = productAxis ?? 0;

  if (mode === 'sph-only') {
    const sph = row.power;
    if (sph == null) return null;
    if (isBifocalLens) {
      return {
        key,
        label: `SPH ${formatPowerLabel(sph)} · ADD ${formatPowerLabel(colValue)}`,
        sph,
        cyl: null,
        add: colValue,
        sphAdd: colValue,
        cylAdd: null,
        axis: null,
      };
    }
    return {
      key,
      label: formatPowerLabel(sph),
      sph,
      cyl: null,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  if (mode === 'cyl-only') {
    const cyl = row.power;
    if (cyl == null) return null;
    if (isBifocalLens) {
      return {
        key,
        label: `CYL ${formatPowerLabel(cyl)} · AXIS ${formatAxisValue(axis)} · ADD ${formatPowerLabel(colValue)}`,
        sph: 0,
        cyl,
        add: colValue,
        sphAdd: null,
        cylAdd: colValue,
        axis,
      };
    }
    return {
      key,
      label: formatPowerLabel(cyl),
      sph: 0,
      cyl,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  if (mode === 'compound') {
    if (isBifocalLens) {
      const sph = row.sph;
      const cyl = row.cyl;
      if (sph == null || cyl == null) return null;
      return {
        key,
        label: `SPH ${formatPowerLabel(sph)} · CYL ${formatPowerLabel(cyl)} · ADD ${formatPowerLabel(colValue)} · AXIS ${formatAxisValue(axis)}`,
        sph,
        cyl,
        add: colValue,
        sphAdd: colValue,
        cylAdd: colValue,
        axis,
      };
    }
    const sph = row.power;
    if (sph == null) return null;
    return {
      key,
      label: `SPH ${formatPowerLabel(sph)} / CYL ${formatPowerLabel(colValue)}`,
      sph,
      cyl: colValue,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  return null;
}

/** Collect cart entries by walking the rendered matrix (avoids fragile key parsing). */
export function collectQtyEntriesFromSpec(
  spec: WholesaleMatrixSpec,
  qtyMap: Record<string, string>,
  params: BuildMatrixParams
): Array<GridEntry & { pairs: number }> {
  const entries: Array<GridEntry & { pairs: number }> = [];

  for (const row of spec.rows) {
    for (const col of spec.cols) {
      for (const cell of spec.cellsAt(row, col)) {
        const pairs = Number(qtyMap[cell.key]);
        if (!Number.isInteger(pairs) || pairs < 1) {
          continue;
        }

        const entry =
          resolveGridEntryFromMatrixCell(row, col, params, cell.key) ??
          resolveGridEntryFromKey(cell.key, params);
        if (entry) {
          entries.push({ ...entry, pairs });
        }
      }
    }
  }

  return entries;
}

function resolveGridEntryByKeyShape(key: string, params: BuildMatrixParams): GridEntry | null {
  const axisFallback = params.productAxis ?? 0;

  const compoundBifocal = key.match(/^([^|]+)\|([^|]+)\|axis:(\d+)\|add:(.+)$/);
  if (compoundBifocal) {
    const sph = Number(compoundBifocal[1]);
    const cyl = Number(compoundBifocal[2]);
    const axis = Number(compoundBifocal[3]);
    const add = Number(compoundBifocal[4]);
    if (![sph, cyl, add].every(Number.isFinite)) return null;
    return {
      key,
      label: `SPH ${formatPowerLabel(sph)} · CYL ${formatPowerLabel(cyl)} · ADD ${formatPowerLabel(add)} · AXIS ${formatAxisValue(axis)}`,
      sph,
      cyl,
      add,
      sphAdd: add,
      cylAdd: add,
      axis,
    };
  }

  const cylBifocal = key.match(/^([^|]+)\|axis:(\d+)\|add:(.+)$/);
  if (cylBifocal) {
    const cyl = Number(cylBifocal[1]);
    const axis = Number(cylBifocal[2]);
    const add = Number(cylBifocal[3]);
    if (!Number.isFinite(cyl) || !Number.isFinite(add)) return null;
    return {
      key,
      label: `CYL ${formatPowerLabel(cyl)} · AXIS ${formatAxisValue(axis)} · ADD ${formatPowerLabel(add)}`,
      sph: 0,
      cyl,
      add,
      sphAdd: null,
      cylAdd: add,
      axis,
    };
  }

  const sphBifocal = key.match(/^([^|]+)\|add:(.+)$/);
  if (sphBifocal) {
    const sph = Number(sphBifocal[1]);
    const add = Number(sphBifocal[2]);
    if (!Number.isFinite(sph) || !Number.isFinite(add)) return null;
    return {
      key,
      label: `SPH ${formatPowerLabel(sph)} · ADD ${formatPowerLabel(add)}`,
      sph,
      cyl: null,
      add,
      sphAdd: add,
      cylAdd: null,
      axis: null,
    };
  }

  const compoundSv = key.match(/^([^|]+)\|([^|]+)$/);
  if (compoundSv) {
    const sph = Number(compoundSv[1]);
    const cyl = Number(compoundSv[2]);
    if (!Number.isFinite(sph) || !Number.isFinite(cyl)) return null;
    return {
      key,
      label: `SPH ${formatPowerLabel(sph)} / CYL ${formatPowerLabel(cyl)}`,
      sph,
      cyl,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  const single = Number(key);
  if (!Number.isFinite(single)) return null;

  if (params.mode === 'cyl-only') {
    return {
      key,
      label: formatPowerLabel(single),
      sph: 0,
      cyl: single,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: params.isBifocalLens ? axisFallback : null,
    };
  }

  return {
    key,
    label: formatPowerLabel(single),
    sph: single,
    cyl: null,
    add: null,
    sphAdd: null,
    cylAdd: null,
    axis: null,
  };
}

export function resolveGridEntryFromKey(key: string, params: BuildMatrixParams): GridEntry | null {
  const { mode, isBifocalLens } = params;

  if (mode === 'sph-only') {
    if (isBifocalLens) {
      const match = key.match(/^([^|]+)\|add:(.+)$/);
      if (!match) return null;
      const sph = Number(match[1]);
      const add = Number(match[2]);
      if (!Number.isFinite(sph) || !Number.isFinite(add)) return null;
      return {
        key,
        label: `SPH ${formatPowerLabel(sph)} · ADD ${formatPowerLabel(add)}`,
        sph,
        cyl: null,
        add,
        sphAdd: add,
        cylAdd: null,
        axis: null,
      };
    }
    const sph = Number(key);
    if (!Number.isFinite(sph)) return null;
    return {
      key,
      label: formatPowerLabel(sph),
      sph,
      cyl: null,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  if (mode === 'cyl-only') {
    if (isBifocalLens) {
      const match = key.match(/^([^|]+)\|axis:(\d+)\|add:(.+)$/);
      if (!match) return null;
      const cyl = Number(match[1]);
      const axis = Number(match[2]);
      const add = Number(match[3]);
      if (!Number.isFinite(cyl) || !Number.isFinite(add)) return null;
      return {
        key,
        label: `CYL ${formatPowerLabel(cyl)} · AXIS ${formatAxisValue(axis)} · ADD ${formatPowerLabel(add)}`,
        sph: 0,
        cyl,
        add,
        sphAdd: null,
        cylAdd: add,
        axis,
      };
    }
    const cyl = Number(key);
    if (!Number.isFinite(cyl)) return null;
    return {
      key,
      label: formatPowerLabel(cyl),
      sph: 0,
      cyl,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  if (mode === 'compound') {
    if (isBifocalLens) {
      const sharedAddMatch = key.match(/^([^|]+)\|([^|]+)\|axis:(\d+)\|add:(.+)$/);
      if (sharedAddMatch) {
        const sph = Number(sharedAddMatch[1]);
        const cyl = Number(sharedAddMatch[2]);
        const axis = Number(sharedAddMatch[3]);
        const add = Number(sharedAddMatch[4]);
        if (![sph, cyl, add].every(Number.isFinite)) return null;
        return {
          key,
          label: `SPH ${formatPowerLabel(sph)} · CYL ${formatPowerLabel(cyl)} · ADD ${formatPowerLabel(add)} · AXIS ${formatAxisValue(axis)}`,
          sph,
          cyl,
          add,
          sphAdd: add,
          cylAdd: add,
          axis,
        };
      }
      const legacyMatch = key.match(/^([^|]+)\|([^|]+)\|axis:(\d+)\|sphAdd:([^|]+)\|cylAdd:(.+)$/);
      if (!legacyMatch) return null;
      const sph = Number(legacyMatch[1]);
      const cyl = Number(legacyMatch[2]);
      const axis = Number(legacyMatch[3]);
      const sphAdd = Number(legacyMatch[4]);
      const cylAdd = Number(legacyMatch[5]);
      if (![sph, cyl, sphAdd, cylAdd].every(Number.isFinite)) return null;
      const add = sphAdd;
      return {
        key,
        label: `SPH ${formatPowerLabel(sph)} · CYL ${formatPowerLabel(cyl)} · ADD ${formatPowerLabel(add)} · AXIS ${formatAxisValue(axis)}`,
        sph,
        cyl,
        add,
        sphAdd: add,
        cylAdd: add,
        axis,
      };
    }
    const match = key.match(/^([^|]+)\|([^|]+)$/);
    if (!match) return null;
    const sph = Number(match[1]);
    const cyl = Number(match[2]);
    if (!Number.isFinite(sph) || !Number.isFinite(cyl)) return null;
    return {
      key,
      label: `SPH ${formatPowerLabel(sph)} / CYL ${formatPowerLabel(cyl)}`,
      sph,
      cyl,
      add: null,
      sphAdd: null,
      cylAdd: null,
      axis: null,
    };
  }

  return resolveGridEntryByKeyShape(key, params);
}

export function countMatrixCells(spec: WholesaleMatrixSpec): number {
  let count = 0;
  for (const row of spec.rows) {
    for (const col of spec.cols) {
      count += spec.cellsAt(row, col).length;
    }
  }
  return count;
}

export function countVisibleMatrixCells(
  spec: WholesaleMatrixSpec,
  visibleRowCount: number,
  visibleColCount: number
): number {
  let count = 0;
  const rows = spec.rows.slice(0, visibleRowCount);
  const cols = spec.cols.slice(0, visibleColCount);
  for (const row of rows) {
    for (const col of cols) {
      count += spec.cellsAt(row, col).length;
    }
  }
  return count;
}

const QTY_MAP_CHUNK_SIZE = 250;

/** Build qty map in chunks so the UI stays responsive on large ranges. */
export async function buildWholesaleQtyMap(
  params: BuildMatrixParams,
  defaultPairs: number
): Promise<Record<string, string>> {
  const {
    mode,
    isBifocalLens,
    isSingleVision,
    sphList,
    cylList,
    addList,
    productAxis,
    crossPowerMeta,
  } = params;

  const axisForKey = productAxis ?? 0;
  const pairsText = String(defaultPairs);
  const next: Record<string, string> = {};

  if (mode === 'sph-only') {
    if (isBifocalLens) {
      for (const sph of sphList) {
        for (const add of addList) {
          next[qtyKeySphAdd(sph, add)] = pairsText;
        }
      }
    } else {
      for (const sph of sphList) {
        next[powerKey(sph)] = pairsText;
      }
    }
    return next;
  }

  if (mode === 'cyl-only') {
    if (isBifocalLens) {
      for (const cyl of cylList) {
        for (const add of addList) {
          next[qtyKeyCylAxisAdd(cyl, axisForKey, add)] = pairsText;
        }
      }
    } else {
      for (const cyl of cylList) {
        next[powerKey(cyl)] = pairsText;
      }
    }
    return next;
  }

  if (mode === 'compound') {
    if (isBifocalLens) {
      let pending = 0;
      for (const sph of sphList) {
        for (const cyl of cylList) {
          if (!isAllowedMatrixCombo(sph, cyl, { isSingleVision, crossPowerMeta })) {
            continue;
          }
          for (const add of addList) {
            next[qtyKeyCompoundBifocal(sph, cyl, axisForKey, add)] = pairsText;
            pending += 1;
            if (pending >= QTY_MAP_CHUNK_SIZE) {
              pending = 0;
              await yieldToUi();
            }
          }
        }
      }
    } else {
      let pending = 0;
      for (const sph of sphList) {
        for (const cyl of cylList) {
          if (!isAllowedMatrixCombo(sph, cyl, { isSingleVision, crossPowerMeta })) {
            continue;
          }
          next[qtyKeyCompound(sph, cyl)] = pairsText;
          pending += 1;
          if (pending >= QTY_MAP_CHUNK_SIZE) {
            pending = 0;
            await yieldToUi();
          }
        }
      }
    }
  }

  return next;
}

export function yieldToUi(): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}
