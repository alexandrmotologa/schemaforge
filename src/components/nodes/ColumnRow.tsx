import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Column, DataType } from '../../engine/types';
import { Key, Trash2, Check, X, ShieldAlert, Hash } from 'lucide-react';

interface ColumnRowProps {
  column: Column;
  tableId: string;
  onUpdate: (tableId: string, colId: string, updates: Partial<Column>) => void;
  onDelete: (tableId: string, colId: string) => void;
}

const DATA_TYPES: DataType[] = [
  'UUID',
  'VARCHAR',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'BOOLEAN',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'DATE',
  'TIME',
  'JSON',
  'JSONB',
  'DECIMAL',
  'NUMERIC',
  'REAL',
  'DOUBLE',
  'BYTEA',
];

export const ColumnRow: React.FC<ColumnRowProps> = ({
  column,
  tableId,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(column.name);

  const saveName = () => {
    const trimmed = tempName.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed) {
      onUpdate(tableId, column.id, { name: trimmed });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') {
      setTempName(column.name);
      setIsEditing(false);
    }
  };

  const getTypeBadgeColor = (type: DataType) => {
    switch (type) {
      case 'UUID':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'SERIAL':
      case 'INTEGER':
      case 'BIGINT':
      case 'SMALLINT':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'VARCHAR':
      case 'TEXT':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'BOOLEAN':
        return 'bg-pink-500/20 text-pink-300 border-pink-500/30';
      case 'TIMESTAMP':
      case 'TIMESTAMPTZ':
      case 'DATE':
      case 'TIME':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'JSON':
      case 'JSONB':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      case 'DECIMAL':
      case 'NUMERIC':
      case 'REAL':
      case 'DOUBLE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="group relative flex items-center justify-between px-3 py-1.5 text-xs hover:bg-slate-800/60 transition-colors border-b border-slate-800/40 last:border-0">
      {/* React Flow Left Handle (Target) */}
      <Handle
        type="target"
        position={Position.Left}
        id={`${column.id}-target`}
        className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:!scale-150 !-left-1.5"
      />

      {/* Column Name & Key Badges */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2">
        {column.isPrimary ? (
          <span title="Primary Key" className="text-amber-400 flex-shrink-0">
            <Key className="w-3.5 h-3.5" />
          </span>
        ) : (
          <span className="text-slate-600 flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center font-mono text-[10px]">
            <Hash className="w-3 h-3 text-slate-600" />
          </span>
        )}

        {isEditing ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveName}
              onKeyDown={handleKeyDown}
              autoFocus
              className="bg-slate-900 border border-indigo-500 text-slate-100 px-1.5 py-0.5 rounded text-xs w-full focus:outline-none"
            />
            <button
              onClick={saveName}
              className="text-emerald-400 hover:text-emerald-300 p-0.5"
              title="Save"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                setTempName(column.name);
                setIsEditing(false);
              }}
              className="text-slate-400 hover:text-slate-300 p-0.5"
              title="Cancel"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <span
            onDoubleClick={() => setIsEditing(true)}
            title="Double click to rename"
            className={`font-mono truncate cursor-pointer transition-colors ${
              column.isPrimary ? 'text-indigo-200 font-medium' : 'text-slate-300 hover:text-white'
            }`}
          >
            {column.name}
          </span>
        )}

        {column.isUnique && !column.isPrimary && (
          <span
            title="Unique Constraint"
            className="text-[9px] px-1 py-0.2 bg-violet-950/60 text-violet-300 border border-violet-800/40 rounded font-semibold"
          >
            UQ
          </span>
        )}
      </div>

      {/* Data Type Dropdown & Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <select
          value={column.type}
          onChange={(e) => onUpdate(tableId, column.id, { type: e.target.value as DataType })}
          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border cursor-pointer focus:outline-none ${getTypeBadgeColor(
            column.type
          )}`}
        >
          {DATA_TYPES.map((dt) => (
            <option key={dt} value={dt} className="bg-slate-900 text-slate-200 font-mono">
              {dt}
            </option>
          ))}
        </select>

        {/* Quick Constraint Toggles on Hover */}
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
          <button
            onClick={() => onUpdate(tableId, column.id, { isPrimary: !column.isPrimary })}
            title={column.isPrimary ? 'Remove Primary Key' : 'Set as Primary Key'}
            className={`p-1 rounded hover:bg-slate-700 ${
              column.isPrimary ? 'text-amber-400' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <Key className="w-3 h-3" />
          </button>
          <button
            onClick={() => onUpdate(tableId, column.id, { isNullable: !column.isNullable })}
            title={column.isNullable ? 'Set NOT NULL' : 'Allow NULL'}
            className={`p-1 rounded hover:bg-slate-700 text-[10px] font-mono ${
              column.isNullable ? 'text-slate-500' : 'text-emerald-400 font-bold'
            }`}
          >
            {column.isNullable ? 'NULL' : 'NN'}
          </button>
          <button
            onClick={() => onDelete(tableId, column.id)}
            title="Delete column"
            className="p-1 rounded hover:bg-red-950/60 text-slate-500 hover:text-red-400"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* React Flow Right Handle (Source) */}
      <Handle
        type="source"
        position={Position.Right}
        id={`${column.id}-source`}
        className="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900 transition-transform hover:!scale-150 !-right-1.5"
      />
    </div>
  );
};
