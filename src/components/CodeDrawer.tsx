import React, { useState, useMemo } from 'react';
import { SchemaState, CodeExportTarget } from '../engine/types';
import { generatePostgreSql } from '../engine/generators/postgresGen';
import { generateSqliteDdl } from '../engine/generators/sqliteGen';
import { generateMySql } from '../engine/generators/mysqlGen';
import { generatePrismaSchema } from '../engine/generators/prismaGen';
import { generateDrizzleSchema } from '../engine/generators/drizzleGen';
import { generateMermaidErDiagram } from '../engine/generators/mermaidGen';
import { generateAllTablesMockSql } from '../engine/mockDataGen';
import { Copy, Check, Download, X, Code, Sparkles } from 'lucide-react';

interface CodeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  schema: SchemaState;
}

interface TargetTab {
  id: CodeExportTarget;
  label: string;
  ext: string;
  mime: string;
}

const TABS: TargetTab[] = [
  { id: 'postgres', label: 'PostgreSQL', ext: 'sql', mime: 'text/sql' },
  { id: 'sqlite', label: 'SQLite', ext: 'sql', mime: 'text/sql' },
  { id: 'mysql', label: 'MySQL', ext: 'sql', mime: 'text/sql' },
  { id: 'prisma', label: 'Prisma', ext: 'prisma', mime: 'text/plain' },
  { id: 'drizzle', label: 'Drizzle ORM', ext: 'ts', mime: 'text/typescript' },
  { id: 'mermaid', label: 'Mermaid ERD', ext: 'md', mime: 'text/markdown' },
  { id: 'mockData', label: 'Mock Data SQL', ext: 'sql', mime: 'text/sql' },
];

export const CodeDrawer: React.FC<CodeDrawerProps> = ({ isOpen, onClose, schema }) => {
  const [activeTab, setActiveTab] = useState<CodeExportTarget>('postgres');
  const [copied, setCopied] = useState(false);

  // Generate code based on active tab
  const codeContent = useMemo(() => {
    switch (activeTab) {
      case 'postgres':
        return generatePostgreSql(schema);
      case 'sqlite':
        return generateSqliteDdl(schema);
      case 'mysql':
        return generateMySql(schema);
      case 'prisma':
        return generatePrismaSchema(schema);
      case 'drizzle':
        return generateDrizzleSchema(schema);
      case 'mermaid':
        return generateMermaidErDiagram(schema);
      case 'mockData':
        return generateAllTablesMockSql(schema, 5);
      default:
        return '';
    }
  }, [activeTab, schema]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  const handleDownload = () => {
    const tabConfig = TABS.find((t) => t.id === activeTab);
    const filename = `schema.${tabConfig?.ext || 'txt'}`;
    const blob = new Blob([codeContent], { type: tabConfig?.mime || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <aside className="fixed top-14 right-0 bottom-0 w-full sm:w-[540px] md:w-[600px] lg:w-[640px] bg-slate-950/95 border-l border-slate-800 shadow-2xl z-40 flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-semibold text-white">Live Code Generation</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Target Tabs Bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-800/80 bg-slate-900/50 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-200 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Code Viewer */}
      <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-slate-300 leading-relaxed selection:bg-indigo-500/30">
        <pre className="whitespace-pre">{codeContent}</pre>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
        <span>Target: {TABS.find((t) => t.id === activeTab)?.label}</span>
        <span>{schema.tables.length} tables · {schema.relationships.length} relationships</span>
      </div>
    </aside>
  );
};
