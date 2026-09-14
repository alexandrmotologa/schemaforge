import React, { useMemo, useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Node,
  Edge,
  NodeChange,
  applyNodeChanges,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, Column, Relationship, Cardinality } from '../engine/types';
import { TableNode } from './nodes/TableNode';
import { RelationshipEdge } from './edges/RelationshipEdge';

interface CanvasViewProps {
  tables: Table[];
  relationships: Relationship[];
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onSetTablePosition: (id: string, pos: { x: number; y: number }) => void;
  onAddColumn: (tableId: string, colData?: Partial<Column>) => void;
  onUpdateColumn: (tableId: string, colId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (tableId: string, colId: string) => void;
  onAddRelationship: (rel: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
}

const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  relationship: RelationshipEdge,
};

export const CanvasView: React.FC<CanvasViewProps> = ({
  tables,
  relationships,
  onUpdateTable,
  onDeleteTable,
  onSetTablePosition,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onAddRelationship,
  onDeleteRelationship,
}) => {
  // Cycle cardinality helper
  const handleCycleCardinality = useCallback(
    (relId: string) => {
      const rel = relationships.find((r) => r.id === relId);
      if (!rel) return;

      const nextCard: Record<Cardinality, Cardinality> = {
        ONE_TO_MANY: 'ONE_TO_ONE',
        ONE_TO_ONE: 'MANY_TO_MANY',
        MANY_TO_MANY: 'ONE_TO_MANY',
      };

      onDeleteRelationship(relId);
      onAddRelationship({
        sourceTableId: rel.sourceTableId,
        sourceColumnId: rel.sourceColumnId,
        targetTableId: rel.targetTableId,
        targetColumnId: rel.targetColumnId,
        cardinality: nextCard[rel.cardinality || 'ONE_TO_MANY'],
        onDelete: rel.onDelete,
        onUpdate: rel.onUpdate,
      });
    },
    [relationships, onDeleteRelationship, onAddRelationship]
  );

  // Map tables to React Flow Nodes
  const nodes: Node[] = useMemo(() => {
    return tables.map((t) => ({
      id: t.id,
      type: 'table',
      position: t.position || { x: 50, y: 50 },
      data: {
        table: t,
        onUpdateTable,
        onDeleteTable,
        onAddColumn,
        onUpdateColumn,
        onDeleteColumn,
      },
    }));
  }, [tables, onUpdateTable, onDeleteTable, onAddColumn, onUpdateColumn, onDeleteColumn]);

  // Map relationships to React Flow Edges
  const edges: Edge[] = useMemo(() => {
    return relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceTableId,
      target: rel.targetTableId,
      sourceHandle: `${rel.sourceColumnId}-source`,
      targetHandle: `${rel.targetColumnId}-target`,
      type: 'relationship',
      data: {
        cardinality: rel.cardinality,
        onDeleteAction: rel.onDelete,
        onDeleteEdge: onDeleteRelationship,
        onCycleCardinality: handleCycleCardinality,
      },
    }));
  }, [relationships, onDeleteRelationship, handleCycleCardinality]);

  // Handle Drag Stop to save table position
  const handleNodeDragStop = useCallback(
    (_event: unknown, node: Node) => {
      onSetTablePosition(node.id, {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
      });
    },
    [onSetTablePosition]
  );

  // Handle new connection between columns
  const handleConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target || !params.sourceHandle || !params.targetHandle) {
        return;
      }

      const sourceColId = params.sourceHandle.replace('-source', '');
      const targetColId = params.targetHandle.replace('-target', '');

      onAddRelationship({
        sourceTableId: params.source,
        sourceColumnId: sourceColId,
        targetTableId: params.target,
        targetColumnId: targetColId,
        cardinality: 'ONE_TO_MANY',
        onDelete: 'CASCADE',
      });
    },
    [onAddRelationship]
  );

  return (
    <div className="w-full h-full relative select-none">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeDragStop={handleNodeDragStop}
        onConnect={handleConnect}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        defaultEdgeOptions={{ type: 'relationship' }}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color="#334155"
          className="bg-surface-950"
        />
        <Controls
          className="!bg-slate-900 !border !border-slate-800 !rounded-xl !overflow-hidden !shadow-2xl [&>button]:!bg-slate-900 [&>button]:!border-b [&>button]:!border-slate-800 [&>button]:!text-slate-300 hover:[&>button]:!bg-slate-800 hover:[&>button]:!text-white"
        />
        <MiniMap
          nodeColor={(node) => {
            const table = (node.data as any)?.table as Table;
            switch (table?.color) {
              case 'emerald':
                return '#10b981';
              case 'sky':
                return '#0284c7';
              case 'amber':
                return '#f59e0b';
              case 'rose':
                return '#f43f5e';
              case 'purple':
                return '#a855f7';
              case 'teal':
                return '#14b8a6';
              default:
                return '#6366f1';
            }
          }}
          className="!bg-slate-950/80 !border !border-slate-800 !rounded-xl !shadow-2xl overflow-hidden !m-4"
          maskColor="rgba(2, 6, 23, 0.7)"
        />
      </ReactFlow>
    </div>
  );
};
