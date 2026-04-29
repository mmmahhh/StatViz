import React, { useState, useRef, useEffect, useCallback } from 'react';

interface EditableCellProps {
  value: string | number | null;
  datasetId: string;
  rowIndex: number;
  column: string;
  disabled: boolean;
  onUpdate: (datasetId: string, rowIndex: number, column: string, value: string | number) => void;
}

/**
 * A controlled, inline-editable table cell.
 * Replaces contentEditable with a proper <input> to avoid
 * React virtual DOM conflicts, rich-text paste issues, and
 * unreliable textContent extraction.
 */
export const EditableCell: React.FC<EditableCellProps> = React.memo(({
  value,
  datasetId,
  rowIndex,
  column,
  disabled,
  onUpdate,
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = String(value ?? '');

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft === displayValue) return; // no change

    const trimmed = draft.trim();
    if (trimmed === '') {
      onUpdate(datasetId, rowIndex, column, '');
      return;
    }
    const numValue = parseFloat(trimmed);
    onUpdate(datasetId, rowIndex, column, isNaN(numValue) ? trimmed : numValue);
  }, [draft, displayValue, datasetId, rowIndex, column, onUpdate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commit();
    } else if (e.key === 'Escape') {
      setEditing(false);
      setDraft(displayValue);
    } else if (e.key === 'Tab') {
      commit(); // commit and let default Tab behavior move focus
    }
  }, [commit, displayValue]);

  const startEditing = useCallback(() => {
    if (disabled) return;
    setDraft(displayValue);
    setEditing(true);
  }, [disabled, displayValue]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        placeholder="输入数值…"
        className="w-full h-full bg-linear-brand/10 text-white text-[13px] font-mono outline-none border-none px-1 py-0 [font-variant-numeric:tabular-nums]"
        aria-label={`正在编辑第 ${rowIndex + 1} 行 ${column} 列`}
      />
    );
  }

  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onClick={startEditing}
      onDoubleClick={startEditing}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          startEditing();
        }
      }}
      className={`w-full min-h-[20px] cursor-text px-1 py-0 focus:outline-none focus:ring-2 focus:ring-linear-brand/50 rounded-sm motion-safe:transition-shadow [font-variant-numeric:tabular-nums] ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      title={disabled ? undefined : '点击或按回车键编辑'}
      aria-label={`编辑第 ${rowIndex + 1} 行 ${column} 列: ${displayValue}`}
      role="button"
    >
      {displayValue}
    </div>
  );
});

EditableCell.displayName = 'EditableCell';
