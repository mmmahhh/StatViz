import { GroupBuilderConfig, GroupBuilderField, RawDataRow } from '../types';

export const DERIVED_GROUP_COLUMN = '__statviz_group__';
export const DERIVED_GROUP_SORT_COLUMN = '__statviz_group_sort__';

const parseCompactDate = (raw: string): Date | null => {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) return null;

  if (trimmed.length === 8) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6));
    const day = Number(trimmed.slice(6, 8));
    if (year >= 1900 && year <= 2999 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      const date = new Date(year, month - 1, day);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  if (trimmed.length === 6) {
    const year = Number(trimmed.slice(0, 4));
    const month = Number(trimmed.slice(4, 6));
    if (year >= 1900 && year <= 2999 && month >= 1 && month <= 12) {
      const date = new Date(year, month - 1, 1);
      if (!Number.isNaN(date.getTime())) return date;
    }
  }

  return null;
};

const parseDateValue = (value: string | number | null | undefined): Date | null => {
  if (value == null || value === '') return null;

  if (typeof value === 'number' && Number.isFinite(value)) {
    const compactDate = parseCompactDate(String(Math.trunc(value)));
    if (compactDate) return compactDate;

    if (value > 20000 && value < 60000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      return new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
    }
    if (value > 1e12) return new Date(value);
    if (value > 1e9) return new Date(value * 1000);
  }

  const compactDate = parseCompactDate(String(value));
  if (compactDate) return compactDate;

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isDateLikeColumn = (data: RawDataRow[], column: string): boolean => {
  if (!column) return false;
  let checked = 0;
  for (const row of data) {
    const value = row[column];
    if (value == null || value === '') continue;
    checked++;
    if (parseDateValue(value) !== null) return true;
    if (checked >= 20) break;
  }
  return false;
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
};

const pad = (value: number) => String(value).padStart(2, '0');

const buildDateLabel = (date: Date, field: GroupBuilderField, includeYear: boolean) => {
  const monthLabel = includeYear ? `${date.getFullYear()}年${date.getMonth() + 1}月` : `${date.getMonth() + 1}月`;
  if (field.transform === 'day') {
    return `${monthLabel}${date.getDate()}日`;
  }
  if (field.transform === 'week') {
    return `${monthLabel}第${getWeekOfMonth(date)}周`;
  }
  return monthLabel;
};

const buildDateSortValue = (date: Date, field: GroupBuilderField) => {
  if (field.transform === 'day') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
  if (field.transform === 'week') {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-W${pad(getWeekOfMonth(date))}`;
  }
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
};

const transformFieldValue = (
  value: string | number | null | undefined,
  field: GroupBuilderField,
  includeYear: boolean
): { label: string; sortValue: string } | null => {
  if (!field.column) return null;

  if (field.transform === 'original') {
    if (value == null || value === '') return null;
    const label = `${field.prefix}${String(value).trim()}`;
    return { label, sortValue: label };
  }

  const date = parseDateValue(value);
  if (!date) return null;

  return {
    label: `${field.prefix}${buildDateLabel(date, field, includeYear)}`,
    sortValue: buildDateSortValue(date, field),
  };
};

const resolveDateYearMode = (data: RawDataRow[], config: GroupBuilderConfig): boolean[] =>
  config.fields.map((field) => {
    if (field.transform === 'original' || !field.column) return false;
    const years = new Set<number>();
    for (const row of data) {
      const date = parseDateValue(row[field.column]);
      if (date) years.add(date.getFullYear());
      if (years.size > 1) return true;
    }
    return false;
  });

export const buildGroupBuilderLabel = (
  row: RawDataRow,
  config: GroupBuilderConfig,
  includeYearByField: boolean[]
): { label: string; sortValue: string } | null => {
  const parts = config.fields
    .filter((field) => field.column)
    .map((field, index) => transformFieldValue(row[field.column], field, includeYearByField[index] ?? false))
    .filter((value): value is { label: string; sortValue: string } => Boolean(value));

  if (parts.length === 0) return null;
  return {
    label: parts.map((part) => part.label).join(config.separator),
    sortValue: parts.map((part) => part.sortValue).join('|'),
  };
};

export const applyGroupBuilder = (data: RawDataRow[], config: GroupBuilderConfig): RawDataRow[] => {
  if (!config.enabled || !config.fields.some((field) => field.column)) return data;
  const includeYearByField = resolveDateYearMode(data, config);

  return data
    .map((row) => {
      const result = buildGroupBuilderLabel(row, config, includeYearByField);
      if (!result) return null;

      return {
        ...row,
        [DERIVED_GROUP_COLUMN]: result.label,
        [DERIVED_GROUP_SORT_COLUMN]: result.sortValue,
      };
    })
    .filter(Boolean) as RawDataRow[];
};

export const describeGroupBuilder = (config: GroupBuilderConfig): string => {
  const activeFields = config.fields.filter((field) => field.column);
  if (activeFields.length === 0) return '';

  return activeFields
    .map((field) => `${field.column}${field.transform === 'original' ? '' : `(${field.transform})`}`)
    .join(' + ');
};
