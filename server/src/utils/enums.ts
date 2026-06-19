const toDb: Record<string, string> = {
  'Closed - Won': 'ClosedWon',
  'Closed - Lost': 'ClosedLost',
  'In Progress': 'InProgress',
};

const toUi: Record<string, string> = {
  ClosedWon: 'Closed - Won',
  ClosedLost: 'Closed - Lost',
  InProgress: 'In Progress',
};

// UI/display value -> DB enum value (e.g. "Closed - Won" -> "ClosedWon").
export const normalizeEnum = (value: unknown): string =>
  typeof value === 'string' ? toDb[value] || value : String(value ?? '');

// DB enum value -> UI/display value. Always returns a string so callers can
// safely call string methods (e.g. .toUpperCase()) on the result.
export const presentEnum = (value: unknown): string =>
  typeof value === 'string' ? toUi[value] || value : String(value ?? '');

export const mapEnumsForDb = <T extends Record<string, unknown>>(data: T, fields: string[]) => {
  const next = { ...data };
  fields.forEach((field) => {
    if (field in next) next[field as keyof T] = normalizeEnum(next[field as keyof T]) as T[keyof T];
  });
  return next;
};

export const mapRecordForUi = <T extends Record<string, unknown>>(record: T | null) => {
  if (!record) return record;
  const next: Record<string, unknown> = { ...record };
  ['status', 'stage', 'priority'].forEach((field) => {
    if (field in next) next[field] = presentEnum(next[field]);
  });
  return next as T;
};
