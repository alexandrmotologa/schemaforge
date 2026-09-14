import React, { useState } from 'react';
import { parseSqlDdl } from '../engine/sqlParser';
import { SchemaState } from '../engine/types';
import { Upload, X, AlertCircle, FileCode } from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (schema: SchemaState) => void;
}

const SAMPLE_SQL = `-- Paste your CREATE TABLE SQL here
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMP
);

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`;

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [sqlText, setSqlText] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleImport = () => {
    setErrors([]);
    if (!sqlText.trim()) {
      setErrors(['Please paste some SQL DDL statements.']);
      return;
    }

    try {
      const result = parseSqlDdl(sqlText);
      if (result.tables.length === 0) {
        setErrors(
          result.errors.length > 0
            ? result.errors
            : ['Could not find any valid CREATE TABLE statements.']
        );
        return;
      }

      onImport({
        tables: result.tables,
        relationships: result.relationships,
      });
      onClose();
    } catch (e: any) {
      setErrors([e?.message || 'Unexpected parsing error occurred.']);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Import SQL DDL</h3>
              <p className="text-xs text-slate-400">
                Parse existing CREATE TABLE statements into interactive canvas tables.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">SQL DDL Input</label>
            <button
              onClick={() => setSqlText(SAMPLE_SQL)}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-mono"
            >
              <FileCode className="w-3 h-3" />
              <span>Load sample snippet</span>
            </button>
          </div>

          <textarea
            value={sqlText}
            onChange={(e) => setSqlText(e.target.value)}
            placeholder={`CREATE TABLE example (\n  id UUID PRIMARY KEY,\n  title VARCHAR(100) NOT NULL\n);`}
            rows={14}
            className="w-full flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
          />

          {errors.length > 0 && (
            <div className="p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>Import Errors</span>
              </div>
              <ul className="list-disc list-inside pl-1 text-[11px] text-red-400">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-colors"
          >
            Build Canvas Nodes
          </button>
        </div>
      </div>
    </div>
  );
};
