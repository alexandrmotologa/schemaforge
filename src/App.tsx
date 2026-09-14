import React, { useState, useEffect, useCallback } from 'react';
import { useSchemaState } from './hooks/useSchemaState';
import { StudioNavbar } from './components/StudioNavbar';
import { CanvasView } from './components/CanvasView';
import { CodeDrawer } from './components/CodeDrawer';
import { LinterDrawer } from './components/LinterDrawer';
import { NewTableModal } from './components/NewTableModal';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
import { SpotlightSearch } from './components/SpotlightSearch';
import { RelationshipModal } from './components/RelationshipModal';
import { DataGridModal } from './components/DataGridModal';
import { AiAssistantModal } from './components/AiAssistantModal';
import { Table, Relationship, IndexDefinition, SchemaState } from './engine/types';
import { applyAutoLayout } from './engine/autoLayout';
import { Plus, FolderKanban, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const {
    tables,
    relationships,
    diagnostics,
    canUndo,
    canRedo,
    undo,
    redo,
    addTable,
    updateTable,
    deleteTable,
    setTablePosition,
    addColumn,
    updateColumn,
    deleteColumn,
    addRelationship,
    deleteRelationship,
    triggerAutoLayout,
    loadSample,
    importSchema,
  } = useSchemaState();

  // Studio Drawers & Modals
  const [isNewTableOpen, setIsNewTableOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isLinterOpen, setIsLinterOpen] = useState(false);
  const [isSpotlightOpen, setIsSpotlightOpen] = useState(false);
  const [isDataGridOpen, setIsDataGridOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [inspectingRelationship, setInspectingRelationship] = useState<Relationship | null>(null);

  // Focus Mode & Smooth Pan State
  const [focusedTableId, setFocusedTableId] = useState<string | null>(null);
  const [panToTableId, setPanToTableId] = useState<string | null>(null);

  // Theme Engine (Dark / Light)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('schemaforge_theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('schemaforge_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Global Keyboard Shortcuts (Undo, Redo, Spotlight Search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spotlight shortcut Cmd+K / Ctrl+K works from anywhere
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSpotlightOpen((prev) => !prev);
        return;
      }

      // Ignore text input shortcuts
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Spotlight Table Selection Handler
  const handleSelectTableFromSpotlight = useCallback((tableId: string) => {
    setPanToTableId(tableId);
    setFocusedTableId(tableId);
  }, []);

  // Focus Mode Toggle
  const handleToggleFocus = useCallback((tableId: string | null) => {
    setFocusedTableId((prev) => (prev === tableId ? null : tableId));
  }, []);

  // Relationship Update & Junction Table Generator
  const handleUpdateRelationship = useCallback(
    (relId: string, updates: Partial<Relationship>) => {
      const updated = relationships.map((r) =>
        r.id === relId ? { ...r, ...updates } : r
      );
      importSchema({ tables, relationships: updated });
    },
    [relationships, tables, importSchema]
  );

  const handleCreateJunctionTable = useCallback(
    (sourceTableId: string, targetTableId: string) => {
      const src = tables.find((t) => t.id === sourceTableId);
      const tgt = tables.find((t) => t.id === targetTableId);
      if (!src || !tgt) return;

      const junctionName = `${src.name}_${tgt.name}`;
      const junctionId = `table_${Date.now()}`;
      const srcCol = src.columns.find((c) => c.isPrimary) || src.columns[0];
      const tgtCol = tgt.columns.find((c) => c.isPrimary) || tgt.columns[0];

      const col1Id = `col_j_${src.name}_id`;
      const col2Id = `col_j_${tgt.name}_id`;

      const junctionTable: Table = {
        id: junctionId,
        name: junctionName,
        color: 'teal',
        position: {
          x: Math.round((src.position.x + tgt.position.x) / 2),
          y: Math.round((src.position.y + tgt.position.y) / 2) + 120,
        },
        columns: [
          {
            id: col1Id,
            name: `${src.name.endsWith('s') ? src.name.slice(0, -1) : src.name}_id`,
            type: srcCol ? srcCol.type : 'UUID',
            isPrimary: true,
            isNullable: false,
            isUnique: false,
          },
          {
            id: col2Id,
            name: `${tgt.name.endsWith('s') ? tgt.name.slice(0, -1) : tgt.name}_id`,
            type: tgtCol ? tgtCol.type : 'UUID',
            isPrimary: true,
            isNullable: false,
            isUnique: false,
          },
          {
            id: `col_j_created`,
            name: 'assigned_at',
            type: 'TIMESTAMPTZ',
            isPrimary: false,
            isNullable: false,
            isUnique: false,
          },
        ],
        indexes: [
          {
            id: `idx_pk_${junctionName}`,
            name: `pk_${junctionName}`,
            columns: [
              `${src.name.endsWith('s') ? src.name.slice(0, -1) : src.name}_id`,
              `${tgt.name.endsWith('s') ? tgt.name.slice(0, -1) : tgt.name}_id`,
            ],
            isUnique: true,
          },
        ],
      };

      const newTables = [...tables, junctionTable];
      const newRels = [
        ...relationships,
        {
          id: `rel_${junctionId}_${src.id}`,
          sourceTableId: junctionId,
          sourceColumnId: col1Id,
          targetTableId: src.id,
          targetColumnId: srcCol.id,
          cardinality: 'ONE_TO_MANY' as const,
          onDelete: 'CASCADE' as const,
        },
        {
          id: `rel_${junctionId}_${tgt.id}`,
          sourceTableId: junctionId,
          sourceColumnId: col2Id,
          targetTableId: tgt.id,
          targetColumnId: tgtCol.id,
          cardinality: 'ONE_TO_MANY' as const,
          onDelete: 'CASCADE' as const,
        },
      ];

      importSchema(applyAutoLayout({ tables: newTables, relationships: newRels }));
    },
    [tables, relationships, importSchema]
  );

  // Index Management
  const handleAddIndex = useCallback(
    (tableId: string, index: IndexDefinition) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      const existing = table.indexes || [];
      updateTable(tableId, { indexes: [...existing, index] });
    },
    [tables, updateTable]
  );

  const handleDeleteIndex = useCallback(
    (tableId: string, indexId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) return;
      const filtered = (table.indexes || []).filter((idx) => idx.id !== indexId);
      updateTable(tableId, { indexes: filtered });
    },
    [tables, updateTable]
  );

  // AI Schema Assistant Apply
  const handleApplyAiSchema = useCallback(
    (aiSchema: SchemaState, mode: 'replace' | 'append') => {
      if (mode === 'replace') {
        importSchema(aiSchema);
      } else {
        const mergedTables = [...tables, ...aiSchema.tables];
        const mergedRels = [...relationships, ...aiSchema.relationships];
        importSchema(applyAutoLayout({ tables: mergedTables, relationships: mergedRels }));
      }
    },
    [tables, relationships, importSchema]
  );

  const focusedTableName = tables.find((t) => t.id === focusedTableId)?.name;

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Studio Header */}
      <StudioNavbar
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onNewTable={() => setIsNewTableOpen(true)}
        onAutoLayout={triggerAutoLayout}
        onLoadSample={loadSample}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onToggleCodeDrawer={() => setIsCodeDrawerOpen(!isCodeDrawerOpen)}
        isCodeDrawerOpen={isCodeDrawerOpen}
        onToggleLinter={() => setIsLinterOpen(!isLinterOpen)}
        isLinterOpen={isLinterOpen}
        diagnostics={diagnostics}
        onOpenSpotlight={() => setIsSpotlightOpen(true)}
        onOpenDataGrid={() => setIsDataGridOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        focusedTableId={focusedTableId}
        focusedTableName={focusedTableName}
        onClearFocus={() => setFocusedTableId(null)}
      />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        {tables.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none bg-slate-950">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Tables in Schema</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              Start building your relational database model by creating a table, prompting the AI Architect, or loading a template.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsNewTableOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Table</span>
              </button>
              <button
                onClick={() => setIsAiAssistantOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>AI Architect</span>
              </button>
              <button
                onClick={() => loadSample('ecommerce')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-all"
              >
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <span>Load E-Commerce</span>
              </button>
            </div>
          </div>
        ) : (
          <CanvasView
            tables={tables}
            relationships={relationships}
            focusedTableId={focusedTableId}
            onToggleFocusTable={handleToggleFocus}
            onInspectRelationship={(rel) => setInspectingRelationship(rel)}
            onUpdateTable={updateTable}
            onDeleteTable={deleteTable}
            onSetTablePosition={setTablePosition}
            onAddColumn={addColumn}
            onUpdateColumn={updateColumn}
            onDeleteColumn={deleteColumn}
            onAddRelationship={addRelationship}
            onDeleteRelationship={deleteRelationship}
            onAddIndex={handleAddIndex}
            onDeleteIndex={handleDeleteIndex}
            panToTableId={panToTableId}
            onPanComplete={() => setPanToTableId(null)}
          />
        )}
      </main>

      {/* Side Drawers */}
      <CodeDrawer
        isOpen={isCodeDrawerOpen}
        onClose={() => setIsCodeDrawerOpen(false)}
        schema={{ tables, relationships }}
      />

      <LinterDrawer
        isOpen={isLinterOpen}
        onClose={() => setIsLinterOpen(false)}
        diagnostics={diagnostics}
      />

      {/* Modals */}
      <NewTableModal
        isOpen={isNewTableOpen}
        onClose={() => setIsNewTableOpen(false)}
        onCreate={(name, color) => addTable(name, color)}
      />

      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={importSchema}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        schema={{ tables, relationships }}
      />

      {/* Spotlight Quick Search (Cmd+K) */}
      <SpotlightSearch
        isOpen={isSpotlightOpen}
        onClose={() => setIsSpotlightOpen(false)}
        tables={tables}
        onSelectTable={handleSelectTableFromSpotlight}
      />

      {/* Relationship Inspector Modal */}
      <RelationshipModal
        isOpen={Boolean(inspectingRelationship)}
        onClose={() => setInspectingRelationship(null)}
        relationship={inspectingRelationship}
        tables={tables}
        onUpdateRelationship={handleUpdateRelationship}
        onDeleteRelationship={deleteRelationship}
        onCreateJunctionTable={handleCreateJunctionTable}
      />

      {/* Interactive Mock Data Grid Modal */}
      <DataGridModal
        isOpen={isDataGridOpen}
        onClose={() => setIsDataGridOpen(false)}
        schema={{ tables, relationships }}
      />

      {/* AI Schema Architect Modal */}
      <AiAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        onApplySchema={handleApplyAiSchema}
      />
    </div>
  );
};
