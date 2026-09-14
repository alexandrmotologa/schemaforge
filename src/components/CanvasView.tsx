import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Connection,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, Column, Relationship, Cardinality } from '../engine/types';
import { TableNode } from './nodes/TableNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { MapPin, Eye, EyeOff } from 'lucide-react';

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
  const [showMiniMap, setShowMiniMap] = useState(true);

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

  // Map tables to React Flow Nodes with initial dimensions so MiniMap and layout measure immediately
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((t) => {
      const estimatedHeight = 56 + Math.max(1, t.columns.length) * 38 + 16;
      return {
        id: t.id,
        type: 'table',
        position: t.position || { x: 50, y: 50 },
        initialWidth: 300,
        initialHeight: estimatedHeight,
        style: { width: 300 },
        data: {
          table: t,
          onUpdateTable,
          onDeleteTable,
          onAddColumn,
          onUpdateColumn,
          onDeleteColumn,
        },
      };
    });
  }, [tables, onUpdateTable, onDeleteTable, onAddColumn, onUpdateColumn, onDeleteColumn]);

  // Map relationships to React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
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

  // Use React Flow node/edge states so dimensions & positions are properly tracked
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

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
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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

        {/* MiniMap with Toggle & Labels */}
        {showMiniMap && (
          <div className="absolute right-4 bottom-4 z-20 flex flex-col items-end gap-1 pointer-events-auto">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900/90 border border-slate-800 rounded-lg shadow-lg text-[10px] font-mono text-slate-400">
              <MapPin className="w-3 h-3 text-indigo-400" />
              <span>NAVIGATOR</span>
              <button
                onClick={() => setShowMiniMap(false)}
                title="Hide Navigator"
                className="ml-1 text-slate-500 hover:text-slate-300"
              >
                <EyeOff className="w-3 h-3" />
              </button>
            </div>
            <MiniMap
              nodeColor={(node: any) => {
                const table = node.data?.table as Table | undefined;
                const color = table?.color || 'indigo';
                switch (color) {
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
                  case 'slate':
                    return '#64748b';
                  default:
                    return '#6366f1';
                }
              }}
              nodeStrokeColor="#0f172a"
              nodeStrokeWidth={2}
              nodeBorderRadius={4}
              maskColor="rgba(99, 102, 241, 0.2)"
              maskStrokeColor="#818cf8"
              maskStrokeWidth={2}
              className="!bg-slate-950 !border !border-slate-800 !rounded-xl !shadow-2xl overflow-hidden !m-0 !relative"
              pannable
              zoomable
            />
          </div>
        )}

        {/* Hidden MiniMap Restore Toggle Button */}
        {!showMiniMap && (
          <button
            onClick={() => setShowMiniMap(true)}
            title="Show Navigator MiniMap"
            className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl shadow-xl text-xs font-mono text-slate-300 transition-all pointer-events-auto"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Show Map</span>
          </button>
        )}
      </ReactFlow>
    </div>
  );
};
