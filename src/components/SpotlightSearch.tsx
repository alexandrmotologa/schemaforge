import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Table } from '../engine/types';
import { Search, Table as TableIcon, Hash, Key, ArrowRight, CornerDownLeft, X } from 'lucide-react';

interface SpotlightSearchProps {
  isOpen: boolean;
  onClose: () => void;
  tables: Table[];
  onSelectTable: (tableId: string) => void;
}

interface SearchResultItem {
  id: string;
  tableId: string;
  tableName: string;
  tableColor?: string;
  type: 'table' | 'column';
  columnName?: string;
  columnType?: string;
  isPrimary?: boolean;
}

export const SpotlightSearch: React.FC<SpotlightSearchProps> = ({
  isOpen,
  onClose,
  tables,
  onSelectTable,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Filter items matching query
  const results: SearchResultItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show all tables initially
      return tables.map((t) => ({
        id: `table_${t.id}`,
        tableId: t.id,
        tableName: t.name,
        tableColor: t.color,
        type: 'table',
      }));
    }

    const items: SearchResultItem[] = [];

    tables.forEach((t) => {
      const matchTable = t.name.toLowerCase().includes(q) || (t.comment && t.comment.toLowerCase().includes(q));
      if (matchTable) {
        items.push({
          id: `table_${t.id}`,
          tableId: t.id,
          tableName: t.name,
          tableColor: t.color,
          type: 'table',
        });
      }

      t.columns.forEach((col) => {
        if (col.name.toLowerCase().includes(q) || col.type.toLowerCase().includes(q)) {
          items.push({
            id: `col_${t.id}_${col.id}`,
            tableId: t.id,
            tableName: t.name,
            tableColor: t.color,
            type: 'column',
            columnName: col.name,
            columnType: col.type,
            isPrimary: col.isPrimary,
          });
        }
      });
    });

    return items.slice(0, 15);
  }, [tables, query]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, results.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % Math.max(1, results.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          onSelectTable(results[selectedIndex].tableId);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onSelectTable, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-start justify-center pt-24 p-4 select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-indigo-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search tables, columns, data types..."
            className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none font-sans"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-slate-500 hover:text-slate-300 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-sans">
              No matching tables or columns found for "{query}".
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectTable(item.tableId);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-indigo-600/30 text-white border border-indigo-500/40'
                      : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.type === 'table' ? (
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 flex-shrink-0">
                        <TableIcon className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 flex-shrink-0">
                        {item.isPrimary ? <Key className="w-3.5 h-3.5 text-amber-400" /> : <Hash className="w-3.5 h-3.5" />}
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 truncate">
                      {item.type === 'table' ? (
                        <span className="font-mono font-semibold text-slate-100 truncate">
                          {item.tableName}
                        </span>
                      ) : (
                        <>
                          <span className="font-mono text-slate-400">{item.tableName}</span>
                          <span className="text-slate-600 font-mono">.</span>
                          <span className="font-mono font-semibold text-slate-100 truncate">
                            {item.columnName}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.columnType && (
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        {item.columnType}
                      </span>
                    )}
                    {isSelected && (
                      <span className="flex items-center text-indigo-300 text-[10px] font-mono">
                        <CornerDownLeft className="w-3 h-3 ml-1" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
