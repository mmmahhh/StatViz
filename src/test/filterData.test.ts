import { describe, it, expect } from 'vitest';
import { applyFilters } from '../utils/filterData';
import { RawDataRow, FilterRule } from '../types';


describe('applyFilters', () => {
  const data: RawDataRow[] = [
    { name: 'A', value: 1 },
    { name: 'B', value: 2 },
    { name: 'C', value: 3 },
    { name: 'D', value: 4 },
    { name: 'E', value: 5 },
  ];

  it('returns all data when no filters', () => {
    expect(applyFilters(data, [])).toEqual(data);
  });

  it('returns all data when all filters disabled', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: 'A', enabled: false },
    ];
    expect(applyFilters(data, filters)).toEqual(data);
  });

  it('filters by "in" operator', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: ['A', 'C'], enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.name)).toContain('A');
    expect(result.map(r => r.name)).toContain('C');
  });

  it('filters by "not_in" operator', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'not_in', value: ['B', 'D'], enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result.map(r => r.name)).toEqual(['A', 'C', 'E']);
  });

  it('filters by numeric range', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'value', operator: 'range', value: ['2', '4'], enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result.map(r => r.name)).toEqual(['B', 'C', 'D']);
  });

  it('filters by string range', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'range', value: ['B', 'D'], enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result.map(r => r.name)).toEqual(['B', 'C', 'D']);
  });

  it('filters by regex', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'regex', value: '[A-C]', enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result.map(r => r.name)).toEqual(['A', 'B', 'C']);
  });

  it('returns false for invalid regex', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'regex', value: '[invalid', enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(0);
  });

  it('rejects overly long regex patterns (ReDoS guard)', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'regex', value: '(a+)+'.repeat(40), enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(0);
  });

  it('maps group alias on match', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: ['A', 'B'], enabled: true, groupAlias: 'Group1' },
    ];
    const result = applyFilters(data, filters);
    expect(result).toHaveLength(5); // all rows kept, only mapped
    expect(result.find(r => r.name === 'Group1')).toBeDefined();
    expect(result.find(r => r.name === 'C')).toBeDefined(); // unchanged
  });

  it('applies multiple filters (AND)', () => {
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: ['A', 'B', 'C'], enabled: true },
      { id: '2', column: 'value', operator: 'range', value: ['1', '2'], enabled: true },
    ];
    const result = applyFilters(data, filters);
    expect(result.map(r => r.name)).toEqual(['A', 'B']);
  });

  it('handles null values gracefully', () => {
    const dataWithNull: RawDataRow[] = [
      { name: 'A', value: 1 },
      { name: null as unknown as number, value: 2 },
    ];
    const filters: FilterRule[] = [
      { id: '1', column: 'name', operator: 'in', value: ['A'], enabled: true },
    ];
    const result = applyFilters(dataWithNull, filters);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('A');
  });
});
