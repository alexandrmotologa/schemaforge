import React, { useState } from 'react';
import { SchemaState } from '../engine/types';
import { generatePostgreSql } from '../engine/generators/postgresGen';
import { generateDataDictionaryMarkdown } from '../engine/generators/dataDictionaryGen';
import { toPng, toSvg } from 'html-to-image';
import { Download, Image as ImageIcon, FileCode, FileJson, X, Check, Loader2, BookOpen } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SchemaState;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, schema }) => {
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const exportImage = async (format: 'png' | 'svg') => {
    const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewport) {
      setStatusMessage('Could not find canvas viewport element.');
      return;
    }

    setIsExportingImage(true);
    setStatusMessage(`Rendering ${format.toUpperCase()} image...`);

    try {
      const options = {
        backgroundColor: '#020617',
        pixelRatio: 2,
      };

      const dataUrl = format === 'png' ? await toPng(viewport, options) : await toSvg(viewport, options);

      const link = document.createElement('a');
      link.download = `schemaforge-diagram.${format}`;
      link.href = dataUrl;
      link.click();
      setStatusMessage(`Saved schemaforge-diagram.${format}`);
    } catch (e: any) {
      console.error('Export failed', e);
      setStatusMessage('Export failed. Check browser console for details.');
    } finally {
      setIsExportingImage(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const exportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(schema, null, 2));
    const link = document.createElement('a');
    link.download = 'schemaforge-backup.json';
    link.href = dataStr;
    link.click();
  };

  const exportSql = () => {
    const sql = generatePostgreSql(schema);
    const blob = new Blob([sql], { type: 'text/sql;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'schemaforge-postgres.sql';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportDataDictionary = () => {
    const md = generateDataDictionaryMarkdown(schema);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'DATA_DICTIONARY.md';
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Export Schema & Diagram</h3>
              <p className="text-xs text-slate-400">Choose diagram image format or schema code bundle.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* PNG Export */}
          <button
            onClick={() => exportImage('png')}
            disabled={isExportingImage}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/40 text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white">PNG Image</div>
            <p className="text-[11px] text-slate-400 mt-1">High resolution raster diagram for documentation.</p>
          </button>

          {/* SVG Export */}
          <button
            onClick={() => exportImage('svg')}
            disabled={isExportingImage}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2 group-hover:scale-105 transition-transform">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white">Vector SVG</div>
            <p className="text-[11px] text-slate-400 mt-1">Scalable vector graphic for presentations.</p>
          </button>

          {/* SQL Script Export */}
          <button
            onClick={exportSql}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/40 text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2 group-hover:scale-105 transition-transform">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white">PostgreSQL DDL (.sql)</div>
            <p className="text-[11px] text-slate-400 mt-1">Complete executable SQL table and relation scripts.</p>
          </button>

          {/* JSON Backup */}
          <button
            onClick={exportJson}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 text-left transition-all group"
          >
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-2 group-hover:scale-105 transition-transform">
              <FileJson className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white">SchemaForge Backup (.json)</div>
            <p className="text-[11px] text-slate-400 mt-1">Full state backup for importing anytime.</p>
          </button>

          {/* Data Dictionary Markdown */}
          <button
            onClick={exportDataDictionary}
            className="flex flex-col items-start p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-violet-500/50 hover:bg-slate-800/40 text-left transition-all group sm:col-span-2"
          >
            <div className="p-2 rounded-lg bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-2 group-hover:scale-105 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="font-semibold text-xs text-white">Data Dictionary (.md)</div>
            <p className="text-[11px] text-slate-400 mt-1">Full comprehensive Markdown documentation with column specs, indexes, and Mermaid ERD diagram.</p>
          </button>
        </div>

        {/* Status indicator */}
        {statusMessage && (
          <div className="px-5 py-2.5 bg-indigo-950/40 border-t border-indigo-900/40 text-xs text-indigo-300 flex items-center gap-2">
            {isExportingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 text-emerald-400" />}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/50 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
