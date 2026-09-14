import React, { useState } from 'react';
import {
  Database,
  Plus,
  LayoutGrid,
  Undo2,
  Redo2,
  Code2,
  Upload,
  Download,
  AlertTriangle,
  FolderKanban,
  ChevronDown,
  Sparkles,
  Search,
  FileSpreadsheet,
  Sun,
  Moon,
  EyeOff,
} from 'lucide-react';
import { SAMPLES } from '../samples';
import { Diagnostic, Table } from '../engine/types';

interface StudioNavbarProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onNewTable: () => void;
  onAutoLayout: (direction: 'LR' | 'TB') => void;
  onLoadSample: (sampleId: string) => void;
  onOpenImport: () => void;
  onOpenExport: () => void;
  onToggleCodeDrawer: () => void;
  isCodeDrawerOpen: boolean;
  onToggleLinter: () => void;
  isLinterOpen: boolean;
  diagnostics: Diagnostic[];
  onOpenSpotlight: () => void;
  onOpenDataGrid: () => void;
  onOpenAiAssistant: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  focusedTableId?: string | null;
  focusedTableName?: string | null;
  onClearFocus?: () => void;
}

export const StudioNavbar: React.FC<StudioNavbarProps> = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onNewTable,
  onAutoLayout,
  onLoadSample,
  onOpenImport,
  onOpenExport,
  onToggleCodeDrawer,
  isCodeDrawerOpen,
  onToggleLinter,
  isLinterOpen,
  diagnostics,
  onOpenSpotlight,
  onOpenDataGrid,
  onOpenAiAssistant,
  theme,
  onToggleTheme,
  focusedTableId,
  focusedTableName,
  onClearFocus,
}) => {
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);

  const errorsCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <header className="h-14 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Database className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-wide">SchemaForge</span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Pro Studio
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
            Visual Database Schema & ERD Studio
          </p>
        </div>
      </div>

      {/* Main Action Bar */}
      <div className="flex items-center gap-1.5">
        {/* Spotlight Quick Search Button */}
        <button
          onClick={onOpenSpotlight}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors"
          title="Search tables, columns, and types (Cmd+K / Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Search</span>
          <kbd className="hidden md:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* AI Schema Architect Button */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-medium transition-all shadow-sm shadow-purple-500/10"
          title="Synthesize schema from natural language prompts"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden lg:inline">AI Architect</span>
        </button>

        {/* Interactive Mock Data Grid Button */}
        <button
          onClick={onOpenDataGrid}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors"
          title="Open interactive mock data grid & seed exporter"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Data Grid</span>
        </button>

        {/* New Table */}
        <button
          onClick={onNewTable}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Table</span>
        </button>

        {/* Templates Gallery Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSamplesMenu(!showSamplesMenu);
              setShowLayoutMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors"
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">Templates</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSamplesMenu && (
            <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
              <div className="px-2.5 py-1.5 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                Reference Architectures
              </div>
              {SAMPLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    onLoadSample(s.id);
                    setShowSamplesMenu(false);
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-800 text-xs transition-colors group"
                >
                  <div className="font-semibold text-slate-200 group-hover:text-indigo-300">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">{s.description}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{s.tableCount} tables</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Auto Layout Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowSamplesMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">Auto Layout</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLayoutMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50">
              <button
                onClick={() => {
                  onAutoLayout('LR');
                  setShowLayoutMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200"
              >
                Left to Right (Horizontal)
              </button>
              <button
                onClick={() => {
                  onAutoLayout('TB');
                  setShowLayoutMenu(false);
                }}
                className="w-full text-left px-3 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200"
              >
                Top to Bottom (Vertical)
              </button>
            </div>
          )}
        </div>

        {/* Undo & Redo */}
        <div className="flex items-center border-l border-slate-800 pl-1.5 ml-1">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/80 transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/80 transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Focus Mode Indicator */}
        {focusedTableId && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono">
            <span>Focus: {focusedTableName}</span>
            <button
              onClick={onClearFocus}
              className="p-0.5 rounded hover:bg-amber-900/60 text-amber-200"
              title="Clear Focus"
            >
              <EyeOff className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Diagnostics & Linter Button */}
        <button
          onClick={onToggleLinter}
          title="Schema Diagnostics"
          className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs transition-colors ${
            errorsCount > 0
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : warningsCount > 0
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Diagnostics</span>
          {(errorsCount > 0 || warningsCount > 0) && (
            <span
              className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                errorsCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}
            >
              {errorsCount + warningsCount}
            </span>
          )}
        </button>
      </div>

      {/* Right Side Tools */}
      <div className="flex items-center gap-2">
        {/* Import SQL */}
        <button
          onClick={onOpenImport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden lg:inline">Import SQL</span>
        </button>

        {/* Export Modal Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-violet-400" />
          <span className="hidden lg:inline">Export</span>
        </button>

        {/* Live Code Drawer Toggle */}
        <button
          onClick={onToggleCodeDrawer}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
            isCodeDrawerOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:bg-indigo-950/50'
          }`}
        >
          <Code2 className="w-3.5 h-3.5" />
          <span>Code View</span>
        </button>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/alexandrmotologa/schemaforge"
          target="_blank"
          rel="noreferrer"
          title="View on GitHub"
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
            />
          </svg>
        </a>
      </div>
    </header>
  );
};
