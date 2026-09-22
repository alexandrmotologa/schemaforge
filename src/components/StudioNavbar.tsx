import React, { useState, useEffect, useRef } from 'react';
import {
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
  MoreHorizontal,
  ExternalLink,
} from 'lucide-react';
import { SAMPLES } from '../samples';
import { Diagnostic } from '../engine/types';

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
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowSamplesMenu(false);
        setShowLayoutMenu(false);
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const errorsCount = diagnostics.filter((d) => d.severity === 'error').length;
  const warningsCount = diagnostics.filter((d) => d.severity === 'warning').length;

  return (
    <header
      ref={headerRef}
      className="h-14 bg-slate-950/95 border-b border-slate-800/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between z-30 select-none gap-2"
    >
      {/* 1. Brand & Title */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <img
          src="./logo.svg"
          alt="SchemaForge Logo"
          className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shadow-lg shadow-indigo-500/25 object-contain border border-slate-700/50 bg-slate-900/60 flex-shrink-0"
        />
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-bold text-sm text-white tracking-wide whitespace-nowrap">
              SchemaForge
            </span>
            <span className="hidden xl:inline-flex text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 whitespace-nowrap">
              Pro Studio
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-sans hidden 2xl:block truncate max-w-[200px]">
            Visual Database Schema & ERD Studio
          </p>
        </div>
      </div>

      {/* 2. Main Studio Tools (Adaptive / Icon-first on compact screens) */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Spotlight Quick Search Button */}
        <button
          onClick={onOpenSpotlight}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs transition-colors flex-shrink-0"
          title="Search tables, columns, and types (Cmd+K / Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
          <span className="hidden xl:inline">Search</span>
          <kbd className="hidden lg:inline text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* AI Schema Architect Button */}
        <button
          onClick={onOpenAiAssistant}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-purple-950/50 hover:bg-purple-900/50 border border-purple-500/40 hover:border-purple-400 text-purple-200 text-xs font-medium transition-all shadow-sm shadow-purple-500/10 flex-shrink-0"
          title="Synthesize schema from natural language prompts"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="hidden xl:inline">AI Architect</span>
        </button>

        {/* Interactive Mock Data Grid Button */}
        <button
          onClick={onOpenDataGrid}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors flex-shrink-0"
          title="Open interactive mock data grid & seed exporter"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="hidden xl:inline">Data Grid</span>
        </button>

        {/* New Table Primary Button */}
        <button
          onClick={onNewTable}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors flex-shrink-0"
          title="Create New Table"
        >
          <Plus className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden md:inline">New Table</span>
          <span className="inline md:hidden text-[11px]">Table</span>
        </button>

        {/* Templates Gallery Dropdown (Visible on >= 1050px) */}
        <div className="relative hidden min-[1050px]:block">
          <button
            onClick={() => {
              setShowSamplesMenu(!showSamplesMenu);
              setShowLayoutMenu(false);
              setShowMoreMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors flex-shrink-0"
            title="Reference Architecture Templates"
          >
            <FolderKanban className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="hidden xl:inline">Templates</span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
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

        {/* Auto Layout Dropdown (Visible on >= 1050px) */}
        <div className="relative hidden min-[1050px]:block">
          <button
            onClick={() => {
              setShowLayoutMenu(!showLayoutMenu);
              setShowSamplesMenu(false);
              setShowMoreMenu(false);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors flex-shrink-0"
            title="Auto Layout Canvas"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
            <span className="hidden xl:inline">Auto Layout</span>
            <ChevronDown className="w-3 h-3 text-slate-400 flex-shrink-0" />
          </button>

          {showLayoutMenu && (
            <div className="absolute left-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-50 animate-in fade-in slide-in-from-top-1">
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

        {/* Undo & Redo (Always compact) */}
        <div className="flex items-center border-l border-slate-800 pl-1 sm:pl-1.5 ml-0.5 flex-shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/80 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800/80 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>

        {/* Focus Mode Indicator */}
        {focusedTableId && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs font-mono max-w-[140px] truncate flex-shrink-0">
            <span className="truncate">Focus: {focusedTableName}</span>
            <button
              onClick={onClearFocus}
              className="p-0.5 rounded hover:bg-amber-900/60 text-amber-200 flex-shrink-0"
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
          className={`relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs transition-colors flex-shrink-0 ${
            errorsCount > 0
              ? 'bg-red-950/40 border-red-500/40 text-red-300'
              : warningsCount > 0
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden xl:inline">Diagnostics</span>
          {(errorsCount > 0 || warningsCount > 0) && (
            <span
              className={`ml-0.5 sm:ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                errorsCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-slate-950'
              }`}
            >
              {errorsCount + warningsCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Right Side Tools */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        {/* Import SQL (Visible on >= 1050px) */}
        <button
          onClick={onOpenImport}
          className="hidden min-[1050px]:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors flex-shrink-0"
          title="Import SQL DDL statements"
        >
          <Upload className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="hidden 2xl:inline">Import SQL</span>
          <span className="hidden xl:inline 2xl:hidden">Import</span>
        </button>

        {/* Export Trigger (Visible on >= 1050px) */}
        <button
          onClick={onOpenExport}
          className="hidden min-[1050px]:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs transition-colors flex-shrink-0"
          title="Export Schema Diagram or Code"
        >
          <Download className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
          <span className="hidden xl:inline">Export</span>
        </button>

        {/* Live Code Drawer Toggle */}
        <button
          onClick={onToggleCodeDrawer}
          className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex-shrink-0 ${
            isCodeDrawerOpen
              ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
              : 'bg-slate-900 text-indigo-300 border-indigo-500/40 hover:bg-indigo-950/50'
          }`}
          title="Toggle Multi-Target Code View Drawer"
        >
          <Code2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="hidden sm:inline">Code View</span>
        </button>

        {/* Overflow "More Tools" Menu (Visible on < 1050px) */}
        <div className="relative min-[1050px]:hidden">
          <button
            onClick={() => {
              setShowMoreMenu(!showMoreMenu);
              setShowSamplesMenu(false);
              setShowLayoutMenu(false);
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              showMoreMenu
                ? 'bg-indigo-600/30 border-indigo-500 text-white'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
            title="More Studio Tools"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 divide-y divide-slate-800 animate-in fade-in slide-in-from-top-1">
              {/* Import & Export */}
              <div className="pb-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 font-mono">
                  Schema Actions
                </div>
                <button
                  onClick={() => {
                    onOpenImport();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Import SQL DDL</span>
                </button>
                <button
                  onClick={() => {
                    onOpenExport();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-violet-400" />
                  <span>Export Diagram & Code</span>
                </button>
              </div>

              {/* Layout Options */}
              <div className="py-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 font-mono">
                  Auto Layout
                </div>
                <button
                  onClick={() => {
                    onAutoLayout('LR');
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Left to Right (Horizontal)</span>
                </button>
                <button
                  onClick={() => {
                    onAutoLayout('TB');
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-200 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Top to Bottom (Vertical)</span>
                </button>
              </div>

              {/* Architecture Templates */}
              <div className="py-1.5 space-y-1">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 font-mono">
                  Architecture Templates
                </div>
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      onLoadSample(s.id);
                      setShowMoreMenu(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs transition-colors group"
                  >
                    <div className="font-medium text-slate-200 group-hover:text-indigo-300">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">{s.description}</div>
                  </button>
                ))}
              </div>

              {/* GitHub Link */}
              <div className="pt-1.5">
                <a
                  href="https://github.com/alexandrmotologa/schemaforge"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-800 text-xs text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      />
                    </svg>
                    <span>View GitHub Repository</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle (Dark / Light) */}
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-400" />
          )}
        </button>

        {/* GitHub Link (Visible on >= 1050px) */}
        <a
          href="https://github.com/alexandrmotologa/schemaforge"
          target="_blank"
          rel="noreferrer"
          title="View on GitHub"
          className="hidden min-[1050px]:block p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors flex-shrink-0"
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

