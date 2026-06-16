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

export const normalizeEnum = (value: unknown) =>
  typeof value === 'string' ? toDb[value] || value : value;

export const presentEnum = (value: unknown) =>
  typeof value === 'string' ? toUi[value] || value : value;

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
