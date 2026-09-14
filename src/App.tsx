import React, { useState, useEffect } from 'react';
import { useSchemaState } from './hooks/useSchemaState';
import { StudioNavbar } from './components/StudioNavbar';
import { CanvasView } from './components/CanvasView';
import { CodeDrawer } from './components/CodeDrawer';
import { LinterDrawer } from './components/LinterDrawer';
import { NewTableModal } from './components/NewTableModal';
import { ImportModal } from './components/ImportModal';
import { ExportModal } from './components/ExportModal';
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

  const [isNewTableOpen, setIsNewTableOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isLinterOpen, setIsLinterOpen] = useState(false);

  // Global Keyboard Shortcuts (Undo / Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing inside an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
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

  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-surface-950 font-sans">
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
      />

      {/* Main Canvas Area */}
      <main className="flex-1 relative overflow-hidden">
        {tables.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-4 shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">No Tables in Schema</h2>
            <p className="text-sm text-slate-400 max-w-md mb-6">
              Start building your relational database model by creating a table or loading a pre-bundled template architecture.
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
                onClick={() => loadSample('ecommerce')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-all"
              >
                <FolderKanban className="w-4 h-4 text-amber-400" />
                <span>Load E-Commerce Sample</span>
              </button>
            </div>
          </div>
        ) : (
          <CanvasView
            tables={tables}
            relationships={relationships}
            onUpdateTable={updateTable}
            onDeleteTable={deleteTable}
            onSetTablePosition={setTablePosition}
            onAddColumn={addColumn}
            onUpdateColumn={updateColumn}
            onDeleteColumn={deleteColumn}
            onAddRelationship={addRelationship}
            onDeleteRelationship={deleteRelationship}
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
    </div>
  );
};
