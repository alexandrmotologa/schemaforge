import React, { useState, memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { Table, Column, IndexDefinition } from '../../engine/types';
import { ColumnRow } from './ColumnRow';
import {
  Plus,
  Trash2,
  Check,
  X,
  Palette,
  Eye,
  Bookmark,
  Layers,
} from 'lucide-react';

interface TableNodeData {
  table: Table;
  isFocused?: boolean;
  isDimmed?: boolean;
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onAddColumn: (tableId: string, colData?: Partial<Column>) => void;
  onUpdateColumn: (tableId: string, colId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (tableId: string, colId: string) => void;
  onToggleFocus?: (tableId: string) => void;
  onAddIndex?: (tableId: string, index: IndexDefinition) => void;
  onDeleteIndex?: (tableId: string, indexId: string) => void;
}

const COLOR_MAP: Record<string, { headerBg: string; border: string; accent: string; glow: string }> = {
  indigo: {
    headerBg: 'bg-indigo-950/80',
    border: 'border-indigo-500/40 hover:border-indigo-400',
    accent: 'bg-indigo-500',
    glow: 'shadow-indigo-500/20 ring-indigo-500',
  },
  emerald: {
    headerBg: 'bg-emerald-950/80',
    border: 'border-emerald-500/40 hover:border-emerald-400',
    accent: 'bg-emerald-500',
    glow: 'shadow-emerald-500/20 ring-emerald-500',
  },
  sky: {
    headerBg: 'bg-sky-950/80',
    border: 'border-sky-500/40 hover:border-sky-400',
    accent: 'bg-sky-500',
    glow: 'shadow-sky-500/20 ring-sky-500',
  },
  amber: {
    headerBg: 'bg-amber-950/80',
    border: 'border-amber-500/40 hover:border-amber-400',
    accent: 'bg-amber-500',
    glow: 'shadow-amber-500/20 ring-amber-500',
  },
  rose: {
    headerBg: 'bg-rose-950/80',
    border: 'border-rose-500/40 hover:border-rose-400',
    accent: 'bg-rose-500',
    glow: 'shadow-rose-500/20 ring-rose-500',
  },
  purple: {
    headerBg: 'bg-purple-950/80',
    border: 'border-purple-500/40 hover:border-purple-400',
    accent: 'bg-purple-500',
    glow: 'shadow-purple-500/20 ring-purple-500',
  },
  teal: {
    headerBg: 'bg-teal-950/80',
    border: 'border-teal-500/40 hover:border-teal-400',
    accent: 'bg-teal-500',
    glow: 'shadow-teal-500/20 ring-teal-500',
  },
  slate: {
    headerBg: 'bg-slate-900/90',
    border: 'border-slate-600/40 hover:border-slate-500',
    accent: 'bg-slate-400',
    glow: 'shadow-slate-500/20 ring-slate-400',
  },
};

const COLOR_KEYS = Object.keys(COLOR_MAP);

export const TableNode = memo(({ data }: NodeProps) => {
  const nodeData = data as unknown as TableNodeData;
  const {
    table,
    isFocused,
    isDimmed,
    onUpdateTable,
    onDeleteTable,
    onAddColumn,
    onUpdateColumn,
    onDeleteColumn,
    onToggleFocus,
    onAddIndex,
    onDeleteIndex,
  } = nodeData;

  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(table.name);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIndexSection, setShowIndexSection] = useState(false);
  const [isAddingIndex, setIsAddingIndex] = useState(false);
  const [indexColName, setIndexColName] = useState('');
  const [indexIsUnique, setIndexIsUnique] = useState(false);

  const colors = COLOR_MAP[table.color || 'indigo'] || COLOR_MAP.indigo;

  const saveName = () => {
    const trimmed = tempName.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed) {
      onUpdateTable(table.id, { name: trimmed });
    }
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') {
      setTempName(table.name);
      setIsEditingName(false);
    }
  };

  const handleCreateIndex = (e: React.FormEvent) => {
    e.preventDefault();
    if (!indexColName) return;

    const newIndex: IndexDefinition = {
      id: `idx_${Date.now()}`,
      name: `idx_${table.name}_${indexColName}`,
      columns: [indexColName],
      isUnique: indexIsUnique,
      type: 'BTREE',
    };

    if (onAddIndex) {
      onAddIndex(table.id, newIndex);
    } else {
      const existing = table.indexes || [];
      onUpdateTable(table.id, { indexes: [...existing, newIndex] });
    }

    setIsAddingIndex(false);
    setIndexColName('');
    setIndexIsUnique(false);
  };

  const handleRemoveIndex = (idxId: string) => {
    if (onDeleteIndex) {
      onDeleteIndex(table.id, idxId);
    } else {
      const filtered = (table.indexes || []).filter((idx) => idx.id !== idxId);
      onUpdateTable(table.id, { indexes: filtered });
    }
  };

  // Check which columns have an index
  const indexedColNames = new Set(
    (table.indexes || []).flatMap((idx) => idx.columns)
  );

  return (
    <div
      className={`min-w-[280px] max-w-[340px] rounded-xl bg-slate-900/95 backdrop-blur-md shadow-2xl border transition-all duration-300 overflow-hidden ${
        isDimmed ? 'opacity-25 grayscale-[40%] scale-[0.98]' : 'opacity-100'
      } ${
        isFocused
          ? `ring-2 ring-indigo-400 shadow-xl ${colors.glow} scale-[1.02]`
          : colors.border
      }`}
    >
      {/* Table Header */}
      <div
        className={`px-3 py-2.5 ${colors.headerBg} border-b border-slate-800 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={`w-2.5 h-2.5 rounded-full ${colors.accent} shadow-sm flex-shrink-0`}
          />

          {isEditingName ? (
            <div className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                onBlur={saveName}
                onKeyDown={handleKeyDown}
                autoFocus
                className="bg-slate-950 border border-indigo-400 text-white font-mono text-xs px-1.5 py-0.5 rounded w-full focus:outline-none"
              />
              <button
                onClick={saveName}
                className="text-emerald-400 hover:text-emerald-300 p-0.5"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setTempName(table.name);
                  setIsEditingName(false);
                }}
                className="text-slate-400 hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 truncate">
              <span
                onDoubleClick={() => setIsEditingName(true)}
                title="Double click to rename table"
                className="font-bold text-xs text-white tracking-wide font-mono cursor-pointer hover:underline truncate"
              >
                {table.name}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({table.columns.length})
              </span>
            </div>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 ml-2">
          {/* Focus Toggle */}
          {onToggleFocus && (
            <button
              onClick={() => onToggleFocus(table.id)}
              title={isFocused ? 'Clear Focus Mode' : 'Focus table & direct connections'}
              className={`p-1 rounded transition-colors ${
                isFocused
                  ? 'text-amber-400 bg-amber-950/60'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Eye className="w-3 h-3" />
            </button>
          )}

          {/* Color Picker Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Change table accent color"
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            >
              <Palette className="w-3 h-3" />
            </button>
            {showColorPicker && (
              <div className="absolute right-0 top-6 z-50 p-1.5 bg-slate-950 border border-slate-700 rounded-lg shadow-xl flex gap-1">
                {COLOR_KEYS.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      onUpdateTable(table.id, { color: c });
                      setShowColorPicker(false);
                    }}
                    className={`w-3.5 h-3.5 rounded-full ${COLOR_MAP[c].accent} hover:scale-125 transition-transform`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onAddColumn(table.id)}
            title="Add Column"
            className="p-1 rounded text-indigo-400 hover:text-indigo-200 hover:bg-indigo-950/60 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onDeleteTable(table.id)}
            title="Delete Table"
            className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-red-950/60 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Columns List */}
      <div className="divide-y divide-slate-800/40 bg-slate-900/60">
        {table.columns.length === 0 ? (
          <div className="px-3 py-3 text-center text-xs text-slate-500 italic">
            No columns yet. Click + to add.
          </div>
        ) : (
          table.columns.map((col) => (
            <ColumnRow
              key={col.id}
              column={col}
              tableId={table.id}
              isIndexed={indexedColNames.has(col.name)}
              onUpdate={onUpdateColumn}
              onDelete={onDeleteColumn}
            />
          ))
        )}
      </div>

      {/* Indexes Section (Collapsible) */}
      {(table.indexes && table.indexes.length > 0) || showIndexSection ? (
        <div className="bg-slate-950/90 border-t border-slate-800/60 p-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400 font-semibold uppercase">
              <Bookmark className="w-3 h-3 text-indigo-400" />
              <span>Indexes ({table.indexes?.length || 0})</span>
            </div>
            <button
              onClick={() => setIsAddingIndex(!isAddingIndex)}
              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-0.5"
            >
              <Plus className="w-2.5 h-2.5" />
              <span>Add</span>
            </button>
          </div>

          {/* Index Creation Form */}
          {isAddingIndex && (
            <form onSubmit={handleCreateIndex} className="mb-2 p-2 bg-slate-900 rounded-lg border border-slate-800 flex flex-col gap-1.5">
              <select
                value={indexColName}
                onChange={(e) => setIndexColName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white text-[11px] font-mono rounded px-2 py-1 focus:outline-none"
              >
                <option value="">Select Column...</option>
                {table.columns.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.type})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1 text-[10px] text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={indexIsUnique}
                    onChange={(e) => setIndexIsUnique(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-500"
                  />
                  <span>Unique</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingIndex(false)}
                    className="text-[10px] text-slate-400 hover:text-slate-200 px-1.5 py-0.5"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!indexColName}
                    className="text-[10px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-medium px-2 py-0.5 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* List of Indexes */}
          <div className="flex flex-wrap gap-1">
            {(table.indexes || []).map((idx) => (
              <div
                key={idx.id}
                className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] font-mono text-slate-300"
              >
                {idx.isUnique && (
                  <span className="text-[9px] text-amber-400 font-bold">UQ</span>
                )}
                <span className="truncate max-w-[120px]" title={idx.name}>
                  {idx.columns.join(', ')}
                </span>
                <button
                  onClick={() => handleRemoveIndex(idx.id)}
                  className="text-slate-500 hover:text-red-400 ml-0.5"
                  title="Remove Index"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Table Footer: Quick Add Column & Index Toggle */}
      <div className="px-3 py-1.5 bg-slate-950/70 border-t border-slate-800/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onAddColumn(table.id)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-indigo-300 transition-colors py-0.5"
          >
            <Plus className="w-3 h-3 text-indigo-400" />
            <span>Add Column</span>
          </button>
          {!showIndexSection && (!table.indexes || table.indexes.length === 0) && (
            <button
              onClick={() => {
                setShowIndexSection(true);
                setIsAddingIndex(true);
              }}
              className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors py-0.5 font-mono"
            >
              <Layers className="w-2.5 h-2.5" />
              <span>+ IDX</span>
            </button>
          )}
        </div>
        {table.comment && (
          <span
            title={table.comment}
            className="text-[10px] text-slate-500 truncate max-w-[120px]"
          >
            {table.comment}
          </span>
        )}
      </div>
    </div>
  );
});

TableNode.displayName = 'TableNode';
