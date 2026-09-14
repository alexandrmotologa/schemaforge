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
import type { MiniMapNodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, Column, Relationship, Cardinality } from '../engine/types';
import { TableNode } from './nodes/TableNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { MapPin, X } from 'lucide-react';

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

// Custom MiniMap Node representing miniature schema cards
const CustomMiniMapNode: React.FC<MiniMapNodeProps> = ({
  x,
  y,
  width,
  height,
  color,
  selected,
}) => {
  const headerHeight = Math.max(6, Math.min(12, height * 0.16));
  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Table Card Body */}
      <rect
        width={width}
        height={height}
        rx={5}
        fill="#0f172a"
        stroke={selected ? '#818cf8' : '#334155'}
        strokeWidth={selected ? 2 : 1}
      />
      {/* Table Header Accent Stripe */}
      <rect
        width={width}
        height={headerHeight}
        rx={5}
        fill={color || '#6366f1'}
      />
      {/* Header bottom corners clip */}
      <rect
        y={headerHeight - 2}
        width={width}
        height={2}
        fill={color || '#6366f1'}
      />
      {/* Subtle Skeleton Column Lines */}
      {height > 30 && (
        <>
          <line
            x1={8}
            y1={headerHeight + 6}
            x2={width * 0.65}
            y2={headerHeight + 6}
            stroke="#475569"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <line
            x1={8}
            y1={headerHeight + 14}
            x2={width * 0.8}
            y2={headerHeight + 14}
            stroke="#334155"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {height > 60 && (
            <line
              x1={8}
              y1={headerHeight + 22}
              x2={width * 0.5}
              y2={headerHeight + 22}
              stroke="#334155"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )}
        </>
      )}
    </g>
  );
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

        {/* Polished Glassmorphic MiniMap */}
        {showMiniMap ? (
          <div className="absolute right-4 bottom-4 z-20 flex flex-col bg-slate-950/85 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-2 pointer-events-auto transition-all w-[240px]">
            {/* Header bar */}
            <div className="flex items-center justify-between pb-1.5 mb-1 border-b border-slate-800/80 px-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] font-semibold tracking-wider text-slate-300 font-mono">
                  MINIMAP
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400 font-mono">
                  {tables.length} tables
                </span>
              </div>
              <button
                onClick={() => setShowMiniMap(false)}
                title="Minimize Map"
                className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>

            {/* Strictly bounded & positioned MiniMap Canvas Wrapper */}
            <div className="relative w-full h-[135px] rounded-xl overflow-hidden border border-slate-800/60 bg-slate-950">
              <MiniMap
                nodeComponent={CustomMiniMapNode}
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
                maskColor="rgba(2, 6, 23, 0.7)"
                maskStrokeColor="#6366f1"
                maskStrokeWidth={1.5}
                style={{ width: '100%', height: '100%', position: 'relative', margin: 0 }}
                className="!bg-transparent !m-0 !w-full !h-full !border-0 !rounded-none !static overflow-hidden"
                pannable
                zoomable
              />
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowMiniMap(true)}
            title="Open MiniMap Navigator"
            className="absolute right-4 bottom-4 z-20 flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-800 rounded-xl shadow-xl text-xs font-mono text-slate-300 hover:text-white transition-all pointer-events-auto group"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            <span>MiniMap</span>
          </button>
        )}
      </ReactFlow>
    </div>
  );
};
