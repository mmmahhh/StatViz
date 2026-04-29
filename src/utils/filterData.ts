import { RawDataRow, FilterRule } from '../types';
import { safeRegexTestSync } from './safeRegex';

export const applyFilters = (data: RawDataRow[], filters: FilterRule[]): RawDataRow[] => {
  if (!filters || filters.length === 0) return data;

  const activeFilters = filters.filter(f => f.enabled);
  if (activeFilters.length === 0) return data;

  return data.map(row => {
    // We create a new row to avoid mutating the original data
    const newRow = { ...row };
    let keepRow = true;

    for (const rule of activeFilters) {
      const cellValue = row[rule.column];
      const valStr = String(cellValue ?? '');

      let matched = false;

      if (rule.operator === 'in') {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        matched = values.includes(valStr);
      } else if (rule.operator === 'not_in') {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        matched = !values.includes(valStr);
      } else if (rule.operator === 'range') {
        const values = Array.isArray(rule.value) ? rule.value : [rule.value];
        if (values.length >= 2) {
          // Attempt numeric range first, then string range
          const numCell = Number(cellValue);
          const min = Number(values[0]);
          const max = Number(values[1]);
          if (!isNaN(numCell) && !isNaN(min) && !isNaN(max)) {
            matched = numCell >= min && numCell <= max;
          } else {
            matched = valStr >= String(values[0]) && valStr <= String(values[1]);
          }
        }
      } else if (rule.operator === 'regex') {
        // Use safe regex validation to prevent ReDoS attacks
        matched = safeRegexTestSync(String(rule.value), valStr);
      }

      if (matched && rule.groupAlias) {
        newRow[rule.column] = rule.groupAlias;
      } else if (!matched && !rule.groupAlias) {
        // If it's a strict filter (no alias mapping) and it didn't match, drop the row
        keepRow = false;
        break;
      } else if (matched && !rule.groupAlias) {
        // Strict filter matched, keep it
      } else if (!matched && rule.groupAlias) {
        // It's a mapping rule but didn't match. We keep the row and its original value.
      }
    }

    return keepRow ? newRow : null;
  }).filter(Boolean) as RawDataRow[];
};
