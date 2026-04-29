import React from 'react';
import { List } from 'react-window';
import { RawDataRow } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { EditableCell } from './EditableCell';

interface VirtualTableProps {
  data: RawDataRow[];
  columns: string[];
  height?: number;
  rowHeight?: number;
  datasetId: string;
  onUpdateCell: (datasetId: string, rowIndex: number, column: string, value: string | number) => void;
  isExporting?: boolean;
}

interface RowData {
  data: RawDataRow[];
  columns: string[];
  datasetId: string;
  onUpdateCell: (datasetId: string, rowIndex: number, column: string, value: string | number) => void;
}

const TableRow = ({
  index,
  style,
  data,
  columns,
  datasetId,
  onUpdateCell,
}: RowData & {
  ariaAttributes: { "aria-posinset": number; "aria-setsize": number; role: "listitem" };
  index: number;
  style: React.CSSProperties;
}) => {
  const row = data[index];
  return (
    <div style={style} className="flex border-b border-linear-borderSubtle/20 hover:bg-white/5 transition-colors group">
      <div className="flex-none w-16 px-4 py-2 text-center text-linear-quaternary font-mono text-[12px] border-r border-linear-borderSubtle/50 flex items-center justify-center">
        {index + 1}
      </div>
      {columns.map((col) => (
        <div
          key={col}
          className="flex-none w-40 px-4 py-2 border-x border-linear-borderSubtle/20 overflow-hidden flex items-center"
        >
          <EditableCell
            value={row[col] as string | number | null}
            datasetId={datasetId}
            rowIndex={index}
            column={col}
            disabled={false}
            onUpdate={onUpdateCell}
          />
        </div>
      ))}
    </div>
  );
};

export const VirtualTable: React.FC<VirtualTableProps> = ({
  data,
  columns,
  height = 400,
  rowHeight = 36,
  datasetId,
  onUpdateCell,
  isExporting = false,
}) => {
  const { t } = useTranslation();

  const itemData = React.useMemo(
    () => ({ data, columns, datasetId, onUpdateCell }),
    [data, columns, datasetId, onUpdateCell],
  );

  if (isExporting) {
    const exportLimit = 500;
    const isTruncated = data.length > exportLimit;
    const exportRows = data.slice(0, exportLimit);

    return (
      <div className="flex flex-col gap-2">
        {isTruncated && (
          <div className="text-[12px] text-amber-500 font-linear-medium bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20">
            ⚠️ {t('app.exportTruncated', { n: exportLimit, total: data.length })}
          </div>
        )}
        <table className="w-full text-left text-[13px] text-linear-secondary whitespace-nowrap table-fixed">
          <thead className="bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[11px] border-b border-linear-borderSubtle">
            <tr>
              <th className="px-4 py-3 font-medium w-16 text-center border-r border-linear-borderSubtle/50">{t('app.row')}</th>
              {columns.map((col) => (
                <th key={col} className="px-4 py-3 font-medium border-x border-linear-borderSubtle/20 w-40">{col}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-linear-borderSubtle/20">
            {exportRows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 text-center text-linear-quaternary font-mono text-[12px] border-r border-linear-borderSubtle/50">{idx + 1}</td>
                {columns.map((col) => (
                  <td key={col} className="px-4 py-2 border-x border-linear-borderSubtle/20">
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 bg-[#0a0a0b] flex flex-col">
      <div className="flex bg-[#121314] text-linear-quaternary font-linear-emphasis uppercase tracking-wider text-[11px] border-b border-linear-borderSubtle shrink-0">
        <div className="flex-none w-16 px-4 py-3 font-medium text-center border-r border-linear-borderSubtle/50">{t('app.row')}</div>
        {columns.map((col) => (
          <div key={col} className="flex-none w-40 px-4 py-3 font-medium border-x border-linear-borderSubtle/20">{col}</div>
        ))}
      </div>
      <List
        defaultHeight={height}
        rowCount={data.length}
        rowHeight={rowHeight}
        rowComponent={TableRow}
        rowProps={itemData}
        overscanCount={5}
      />
    </div>
  );
};