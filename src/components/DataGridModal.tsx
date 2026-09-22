import React, { useState, useMemo, useEffect } from 'react';
import { SchemaState, Table } from '../engine/types';
import { generateMockDataJson, generateMockDataCsv, generateAllTablesMockJson } from '../engine/mockDataGen';
import {
  Table as TableIcon,
  X,
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCw,
  Search,
  Check,
  Copy,
  Hash,
} from 'lucide-react';

interface DataGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SchemaState;
}

export const DataGridModal: React.FC<DataGridModalProps> = ({
  isOpen,
  onClose,
  schema,
}) => {
  const [selectedTableId, setSelectedTableId] = useState<string>(
    schema.tables[0]?.id || ''
  );
  const [rowCount, setRowCount] = useState<number>(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCell, setCopiedCell] = useState<string | null>(null);
  const [seedKey, setSeedKey] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync selectedTableId if tables change
  const activeTable = useMemo(() => {
    return (
      schema.tables.find((t) => t.id === selectedTableId) ||
      schema.tables[0] ||
      null
    );
  }, [schema.tables, selectedTableId]);

  // Generate rows for active table
  const rawRows = useMemo(() => {
    if (!activeTable) return [];
    // seedKey triggers recreation
    return generateMockDataJson(activeTable, rowCount);
  }, [activeTable, rowCount, seedKey]);

  // Filter rows by search query
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rawRows;
    return rawRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(q)
      )
    );
  }, [rawRows, searchQuery]);

  const handleCopy = (text: string, cellId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCell(cellId);
    setTimeout(() => setCopiedCell(null), 1500);
  };

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!activeTable) return;
    const csv = generateMockDataCsv(activeTable, rowCount);
    downloadFile(`${activeTable.name}_fixtures.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const handleExportAllJson = () => {
    const allData = generateAllTablesMockJson(schema, rowCount);
    const jsonStr = JSON.stringify(allData, null, 2);
    downloadFile(`schemaforge_seed_data.json`, jsonStr, 'application/json');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex flex-wrap sm:flex-nowrap items-center justify-between bg-slate-950/60 gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-2 flex-wrap">
                <span>Interactive Mock Data Grid</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Synthetic Seeder
                </span>
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate max-w-[480px]">
                Preview realistic test fixtures and export directly to CSV or JSON seed files.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              onClick={handleExportCsv}
              disabled={!activeTable}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all hover:border-emerald-500/40"
              title="Export Current Table as CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={handleExportAllJson}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-lg shadow-indigo-600/20"
              title="Export All Tables as JSON Seeder"
            >
              <FileJson className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export All (JSON)</span>
              <span className="inline sm:hidden">JSON</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Table Selector Tabs & Controls Bar */}
        <div className="px-4 sm:px-6 py-2.5 border-b border-slate-800 bg-slate-950/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-1 min-w-0">
            {schema.tables.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTableId(t.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex-shrink-0 ${
                  activeTable?.id === t.id
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500 font-semibold shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{t.name}</span>
                <span className="text-[10px] px-1.5 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                  {t.columns.length}
                </span>
              </button>
            ))}
          </div>

          {/* Controls: Search, Row Count, Regenerate */}
          <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter rows..."
                className="bg-slate-950 border border-slate-700 text-xs text-white pl-8 pr-2.5 py-1.5 rounded-xl w-32 sm:w-36 focus:w-44 transition-all focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <select
              value={rowCount}
              onChange={(e) => setRowCount(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-slate-300 text-xs font-mono rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value={5}>5 rows</option>
              <option value={10}>10 rows</option>
              <option value={20}>20 rows</option>
              <option value={50}>50 rows</option>
            </select>

            <button
              onClick={() => setSeedKey((prev) => prev + 1)}
              title="Regenerate random values"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Data Grid Content */}
        <div className="flex-1 overflow-auto bg-slate-950/20 p-4">
          {!activeTable ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
              No tables in schema.
            </div>
          ) : activeTable.columns.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm italic">
              Table &quot;{activeTable.name}&quot; has no columns defined.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900 shadow-xl">
              <table className="w-full text-left border-collapse font-mono text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400">
                    <th className="px-3 py-2.5 w-12 text-center text-slate-500 border-r border-slate-800 font-normal">
                      #
                    </th>
                    {activeTable.columns.map((col) => (
                      <th
                        key={col.id}
                        className="px-3 py-2.5 font-medium border-r border-slate-800/80 last:border-0"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={
                              col.isPrimary
                                ? 'text-amber-300 font-bold'
                                : 'text-slate-200'
                            }
                          >
                            {col.name}
                          </span>
                          <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                            {col.type}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={activeTable.columns.length + 1}
                        className="py-12 text-center text-slate-500 italic"
                      >
                        No matching rows found for &quot;{searchQuery}&quot;.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-slate-800/50 transition-colors group"
                      >
                        <td className="px-3 py-2 text-center text-slate-500 border-r border-slate-800 text-[11px]">
                          {rIdx + 1}
                        </td>
                        {activeTable.columns.map((col) => {
                          const val = row[col.name];
                          const strVal =
                            val === null || val === undefined
                              ? 'NULL'
                              : typeof val === 'object'
                              ? JSON.stringify(val)
                              : String(val);
                          const cellId = `${rIdx}_${col.id}`;
                          const isCopied = copiedCell === cellId;

                          return (
                            <td
                              key={col.id}
                              onClick={() => handleCopy(strVal, cellId)}
                              title="Click to copy value"
                              className="px-3 py-2 text-slate-300 border-r border-slate-800/60 last:border-0 cursor-pointer relative hover:bg-indigo-950/30 transition-colors"
                            >
                              <div className="flex items-center justify-between gap-1 max-w-[220px]">
                                <span className="truncate">{strVal}</span>
                                <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isCopied ? (
                                    <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-500 flex-shrink-0" />
                                  )}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="text-white font-bold">{filteredRows.length}</span> synthetic rows for{' '}
            <span className="font-mono text-indigo-300">{activeTable?.name || 'none'}</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Click any cell to copy value to clipboard.
          </div>
        </div>
      </div>
    </div>
  );
};
