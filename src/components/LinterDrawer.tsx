import React from 'react';
import { Diagnostic } from '../engine/types';
import { AlertCircle, AlertTriangle, Info, X, CheckCircle2 } from 'lucide-react';

interface LinterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  diagnostics: Diagnostic[];
}

export const LinterDrawer: React.FC<LinterDrawerProps> = ({
  isOpen,
  onClose,
  diagnostics,
}) => {
  if (!isOpen) return null;

  const errors = diagnostics.filter((d) => d.severity === 'error');
  const warnings = diagnostics.filter((d) => d.severity === 'warning');

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-full sm:w-[420px] bg-slate-950/95 border-l border-slate-800 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Schema Diagnostics</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/80 flex items-center gap-4 text-xs font-mono">
        <span className="flex items-center gap-1.5 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{errors.length} Errors</span>
        </span>
        <span className="flex items-center gap-1.5 text-amber-400">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{warnings.length} Warnings</span>
        </span>
      </div>

      {/* Diagnostics List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {diagnostics.length === 0 ? (
          <div className="py-12 flex flex-col items-center text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
            <h4 className="text-sm font-semibold text-white">Schema is Healthy</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-[260px]">
              All tables have primary keys, relations are verified, and data types match.
            </p>
          </div>
        ) : (
          diagnostics.map((diag) => {
            const isError = diag.severity === 'error';
            return (
              <div
                key={diag.id}
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  isError
                    ? 'bg-red-950/30 border-red-500/30 text-red-200'
                    : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    {isError ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    )}
                    <span>{diag.tableName ? `Table "${diag.tableName}"` : 'Schema Level'}</span>
                  </div>
                  <span className="text-[10px] font-mono opacity-60 uppercase">{diag.rule}</span>
                </div>
                <p className="text-[11px] text-slate-300 pl-5">{diag.message}</p>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
