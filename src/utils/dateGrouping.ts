import { DateGroupingConfig, RawDataRow } from '../types';

export const DERIVED_DATE_GROUP_COLUMN = '__statviz_date_group__';

const parseDateValue = (value: string | number | null | undefined): Date | null => {
  if (value == null || value === '') return null;

  if (typeof value === 'object') {
    const maybeDate = value as unknown as Date;
    if (maybeDate instanceof Date && !Number.isNaN(maybeDate.getTime())) {
      return maybeDate;
    }
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value > 20000 && value < 60000) {
      const excelEpoch = Date.UTC(1899, 11, 30);
      return new Date(excelEpoch + value * 24 * 60 * 60 * 1000);
    }
    if (value > 1e12) return new Date(value);
    if (value > 1e9) return new Date(value * 1000);
  }

  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getWeekOfMonth = (date: Date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.ceil((date.getDate() + firstDay.getDay()) / 7);
};

const buildPeriodLabel = (date: Date, granularity: DateGroupingConfig['granularity']) => {
  if (granularity === 'day') {
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  }
  if (granularity === 'week') {
    return `${date.getMonth() + 1}月第${getWeekOfMonth(date)}周`;
  }
  return `${date.getMonth() + 1}月`;
};

export const buildDateGroupingLabel = (row: RawDataRow, config: DateGroupingConfig): string | null => {
  const date = parseDateValue(row[config.dateColumn]);
  if (!date) return null;

  const periodLabel = buildPeriodLabel(date, config.granularity);
  const prefix = config.labelPrefix.trim();
  const category = config.categoryColumn ? String(row[config.categoryColumn] ?? '').trim() : '';
  const suffix = `${prefix}${category}`.trim();

  return suffix ? `${periodLabel}${suffix}` : periodLabel;
};

export const applyDateGrouping = (data: RawDataRow[], config: DateGroupingConfig): RawDataRow[] => {
  if (!config.enabled || !config.dateColumn) return data;

  return data
    .map((row) => {
      const label = buildDateGroupingLabel(row, config);
      if (!label) return null;
      return {
        ...row,
        [DERIVED_DATE_GROUP_COLUMN]: label,
      };
    })
    .filter(Boolean) as RawDataRow[];
};
