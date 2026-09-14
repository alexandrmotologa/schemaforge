import React, { useState } from 'react';
import { Database, X } from 'lucide-react';

interface NewTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, color: string) => void;
}

const COLORS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
  { id: 'sky', label: 'Sky', bg: 'bg-sky-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
  { id: 'teal', label: 'Teal', bg: 'bg-teal-500' },
  { id: 'slate', label: 'Slate', bg: 'bg-slate-400' },
];

export const NewTableModal: React.FC<NewTableModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [tableName, setTableName] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = tableName.trim().toLowerCase().replace(/\s+/g, '_') || 'untitled_table';
    onCreate(cleanName, selectedColor);
    setTableName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Create New Table</h3>
              <p className="text-xs text-slate-400">Add an entity to the relational canvas.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Table Name
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="e.g. customer_invoices"
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1.5">
              Accent Color
            </label>
            <div className="flex items-center gap-2">
              {COLORS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  title={c.label}
                  className={`w-7 h-7 rounded-lg ${c.bg} transition-transform ${
                    selectedColor === c.id
                      ? 'ring-2 ring-white scale-110'
                      : 'opacity-70 hover:opacity-100 hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
            >
              Create Table
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
