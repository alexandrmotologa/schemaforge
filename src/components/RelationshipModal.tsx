import React, { useState } from 'react';
import { Relationship, Table, Cardinality, ReferentialAction } from '../engine/types';
import { Network, X, Trash2, ArrowRight, Layers, Check } from 'lucide-react';

interface RelationshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  relationship: Relationship | null;
  tables: Table[];
  onUpdateRelationship: (id: string, updates: Partial<Relationship>) => void;
  onDeleteRelationship: (id: string) => void;
  onCreateJunctionTable: (sourceTableId: string, targetTableId: string) => void;
}

const CARDINALITIES: { id: Cardinality; label: string; desc: string }[] = [
  { id: 'ONE_TO_MANY', label: '1 : N (One-to-Many)', desc: 'Standard parent to child relationship' },
  { id: 'ONE_TO_ONE', label: '1 : 1 (One-to-One)', desc: 'Unique extension table or profile' },
  { id: 'MANY_TO_MANY', label: 'N : M (Many-to-Many)', desc: 'Direct or junction-mapped associations' },
];

const ACTIONS: ReferentialAction[] = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];

export const RelationshipModal: React.FC<RelationshipModalProps> = ({
  isOpen,
  onClose,
  relationship,
  tables,
  onUpdateRelationship,
  onDeleteRelationship,
  onCreateJunctionTable,
}) => {
  if (!isOpen || !relationship) return null;

  const sourceTable = tables.find((t) => t.id === relationship.sourceTableId);
  const targetTable = tables.find((t) => t.id === relationship.targetTableId);
  const sourceCol = sourceTable?.columns.find((c) => c.id === relationship.sourceColumnId);
  const targetCol = targetTable?.columns.find((c) => c.id === relationship.targetColumnId);

  const [cardinality, setCardinality] = useState<Cardinality>(relationship.cardinality);
  const [onDelete, setOnDelete] = useState<ReferentialAction>(relationship.onDelete || 'CASCADE');
  const [onUpdate, setOnUpdate] = useState<ReferentialAction>(relationship.onUpdate || 'NO ACTION');

  const handleSave = () => {
    onUpdateRelationship(relationship.id, {
      cardinality,
      onDelete,
      onUpdate,
    });
    onClose();
  };

  const handleCreateJunction = () => {
    onCreateJunctionTable(relationship.sourceTableId, relationship.targetTableId);
    onDeleteRelationship(relationship.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Relationship Inspector</h3>
              <p className="text-xs text-slate-400">Configure foreign key constraints and cardinality.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-5">
          {/* Connection Preview Card */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Foreign Key Source</span>
              <span className="font-mono font-bold text-xs text-indigo-300">
                {sourceTable?.name || 'source'}.{sourceCol?.name || 'id'}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500" />
            <div className="flex flex-col text-right">
              <span className="text-[10px] text-slate-500 uppercase font-mono">Primary Key Target</span>
              <span className="font-mono font-bold text-xs text-emerald-300">
                {targetTable?.name || 'target'}.{targetCol?.name || 'id'}
              </span>
            </div>
          </div>

          {/* Cardinality Selector */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">Cardinality</label>
            <div className="grid grid-cols-1 gap-1.5">
              {CARDINALITIES.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCardinality(c.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                    cardinality === c.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs text-slate-200">{c.label}</div>
                    <div className="text-[11px] text-slate-500">{c.desc}</div>
                  </div>
                  {cardinality === c.id && <Check className="w-4 h-4 text-indigo-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Referential Actions (ON DELETE & ON UPDATE) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">ON DELETE</label>
              <select
                value={onDelete}
                onChange={(e) => setOnDelete(e.target.value as ReferentialAction)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {ACTIONS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1.5">ON UPDATE</label>
              <select
                value={onUpdate}
                onChange={(e) => setOnUpdate(e.target.value as ReferentialAction)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {ACTIONS.map((a) => (
                  <option key={a} value={a} className="bg-slate-900">
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 1-Click Junction Table Helper */}
          {sourceTable && targetTable && (
            <div className="p-3 bg-indigo-950/30 border border-indigo-500/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-xs text-white">Need a Many-to-Many Bridge?</div>
                  <div className="text-[11px] text-indigo-300/80">
                    Auto-create junction table: <span className="font-mono font-bold">{sourceTable.name}_{targetTable.name}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCreateJunction}
                className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold whitespace-nowrap transition-colors"
              >
                Generate Junction
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => {
              onDeleteRelationship(relationship.id);
              onClose();
            }}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 py-1.5 px-2 rounded-lg hover:bg-red-950/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Relation</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
