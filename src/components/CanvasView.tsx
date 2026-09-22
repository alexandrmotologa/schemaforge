import React, { useMemo, useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Connection,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import type { MiniMapNodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Table, Column, Relationship, Cardinality, IndexDefinition } from '../engine/types';
import { TableNode } from './nodes/TableNode';
import { RelationshipEdge } from './edges/RelationshipEdge';
import { MapPin, X } from 'lucide-react';

interface CanvasViewProps {
  tables: Table[];
  relationships: Relationship[];
  focusedTableId?: string | null;
  onToggleFocusTable?: (id: string | null) => void;
  onInspectRelationship?: (rel: Relationship) => void;
  onUpdateTable: (id: string, updates: Partial<Table>) => void;
  onDeleteTable: (id: string) => void;
  onSetTablePosition: (id: string, pos: { x: number; y: number }) => void;
  onAddColumn: (tableId: string, colData?: Partial<Column>) => void;
  onUpdateColumn: (tableId: string, colId: string, updates: Partial<Column>) => void;
  onDeleteColumn: (tableId: string, colId: string) => void;
  onAddRelationship: (rel: Omit<Relationship, 'id'>) => void;
  onDeleteRelationship: (id: string) => void;
  onAddIndex?: (tableId: string, index: IndexDefinition) => void;
  onDeleteIndex?: (tableId: string, indexId: string) => void;
  panToTableId?: string | null;
  onPanComplete?: () => void;
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
        </>
      )}
    </g>
  );
};

// Inner flow component with access to ReactFlow instance hooks
const InnerFlowCanvas: React.FC<CanvasViewProps> = ({
  tables,
  relationships,
  focusedTableId,
  onToggleFocusTable,
  onInspectRelationship,
  onUpdateTable,
  onDeleteTable,
  onSetTablePosition,
  onAddColumn,
  onUpdateColumn,
  onDeleteColumn,
  onAddRelationship,
  onDeleteRelationship,
  onAddIndex,
  onDeleteIndex,
  panToTableId,
  onPanComplete,
}) => {
  const [showMiniMap, setShowMiniMap] = useState(true);
  const { setCenter } = useReactFlow();

  // Smooth pan to table when requested
  useEffect(() => {
    if (panToTableId) {
      const target = tables.find((t) => t.id === panToTableId);
      if (target) {
        setCenter(target.position.x + 150, target.position.y + 100, {
          duration: 700,
          zoom: 1.1,
        });
        onPanComplete?.();
      }
    }
  }, [panToTableId, tables, setCenter, onPanComplete]);

  // Compute connected table IDs for focus mode
  const connectedTableIds = useMemo(() => {
    if (!focusedTableId) return new Set<string>();
    const ids = new Set<string>([focusedTableId]);
    relationships.forEach((rel) => {
      if (rel.sourceTableId === focusedTableId) ids.add(rel.targetTableId);
      if (rel.targetTableId === focusedTableId) ids.add(rel.sourceTableId);
    });
    return ids;
  }, [focusedTableId, relationships]);

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
  const initialNodes: Node[] = useMemo(() => {
    return tables.map((t) => {
      const estimatedHeight = 56 + Math.max(1, t.columns.length) * 38 + 16;
      const isFocused = focusedTableId === t.id;
      const isDimmed = Boolean(focusedTableId && !connectedTableIds.has(t.id));

      return {
        id: t.id,
        type: 'table',
        position: t.position || { x: 50, y: 50 },
        initialWidth: 300,
        initialHeight: estimatedHeight,
        style: { width: 300 },
        data: {
          table: t,
          isFocused,
          isDimmed,
          onUpdateTable,
          onDeleteTable,
          onAddColumn,
          onUpdateColumn,
          onDeleteColumn,
          onToggleFocus: onToggleFocusTable,
          onAddIndex,
          onDeleteIndex,
        },
      };
    });
  }, [
    tables,
    focusedTableId,
    connectedTableIds,
    onUpdateTable,
    onDeleteTable,
    onAddColumn,
    onUpdateColumn,
    onDeleteColumn,
    onToggleFocusTable,
    onAddIndex,
    onDeleteIndex,
  ]);

  // Map relationships to React Flow Edges
  const initialEdges: Edge[] = useMemo(() => {
    return relationships.map((rel) => {
      const isRelConnectedToFocus =
        focusedTableId &&
        (rel.sourceTableId === focusedTableId || rel.targetTableId === focusedTableId);
      const isDimmed = Boolean(focusedTableId && !isRelConnectedToFocus);

      return {
        id: rel.id,
        source: rel.sourceTableId,
        target: rel.targetTableId,
        sourceHandle: `${rel.sourceColumnId}-source`,
        targetHandle: `${rel.targetColumnId}-target`,
        type: 'relationship',
        data: {
          relationship: rel,
          cardinality: rel.cardinality,
          onDeleteAction: rel.onDelete,
          onDeleteEdge: onDeleteRelationship,
          onCycleCardinality: handleCycleCardinality,
          onInspect: onInspectRelationship,
          isHighlighted: Boolean(isRelConnectedToFocus),
          isDimmed,
        },
      };
    });
  }, [
    relationships,
    focusedTableId,
    onDeleteRelationship,
    handleCycleCardinality,
    onInspectRelationship,
  ]);

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
          className="bg-slate-950"
        />
        <Controls
          showInteractive={false}
          className="!bg-slate-900/90 !border-slate-800 !rounded-xl !shadow-xl overflow-hidden [&>button]:!border-slate-800 [&>button]:!bg-transparent [&>button]:!text-slate-300 hover:[&>button]:!text-white hover:[&>button]:!bg-slate-800"
        />
      </ReactFlow>

      {/* Floating MiniMap Toggle Button if hidden */}
      {!showMiniMap && (
        <button
          onClick={() => setShowMiniMap(true)}
          className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-slate-300 hover:text-white hover:border-indigo-500/50 text-xs font-medium transition-all"
        >
          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Show MiniMap</span>
          <span className="inline sm:hidden">Map</span>
        </button>
      )}

      {/* Custom MiniMap Panel */}
      {showMiniMap && (
        <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5 z-20 w-[180px] h-[110px] sm:w-[220px] sm:h-[125px] md:w-[240px] md:h-[135px] relative overflow-hidden rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all">
          <div className="absolute top-2 left-2.5 z-30 flex items-center justify-between w-[calc(100%-20px)] pointer-events-none">
            <span className="text-[9px] sm:text-[10px] font-mono font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/70 px-1.5 py-0.5 rounded border border-slate-800">
              Overview
            </span>
            <button
              onClick={() => setShowMiniMap(false)}
              className="pointer-events-auto text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors"
              title="Hide MiniMap"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <MiniMap
            nodeComponent={CustomMiniMapNode}
            zoomable
            pannable
            className="!m-0 !w-full !h-full"
            maskColor="rgba(15, 23, 42, 0.75)"
          />
        </div>
      )}
    </div>
  );
};

export const CanvasView: React.FC<CanvasViewProps> = (props) => {
  return (
    <ReactFlowProvider>
      <InnerFlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
