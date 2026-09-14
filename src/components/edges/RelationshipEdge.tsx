import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { Cardinality, ReferentialAction } from '../../engine/types';
import { X } from 'lucide-react';

interface RelationshipEdgeData {
  cardinality: Cardinality;
  onDeleteAction?: ReferentialAction;
  onDeleteEdge: (id: string) => void;
  onCycleCardinality?: (id: string) => void;
}

export const RelationshipEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) => {
  const edgeData = data as unknown as RelationshipEdgeData | undefined;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  const getCardinalityLabel = (card?: Cardinality) => {
    switch (card) {
      case 'ONE_TO_ONE':
        return '1:1';
      case 'MANY_TO_MANY':
        return 'N:M';
      case 'ONE_TO_MANY':
      default:
        return '1:N';
    }
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: '#6366f1',
          strokeWidth: 2,
          strokeDasharray: '4 2',
          animation: 'dashdraw 1s linear infinite',
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan group flex items-center gap-1 bg-slate-900/90 border border-indigo-500/50 hover:border-indigo-400 px-1.5 py-0.5 rounded-full shadow-lg text-[10px] font-mono text-indigo-200 transition-all hover:scale-110"
        >
          <span
            title="Cardinality (Click to cycle 1:N -> 1:1 -> N:M)"
            className="cursor-pointer font-bold px-1 select-none"
            onClick={() => edgeData?.onCycleCardinality?.(id)}
          >
            {getCardinalityLabel(edgeData?.cardinality)}
          </span>

          <button
            onClick={() => edgeData?.onDeleteEdge(id)}
            title="Delete Relationship"
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-400 transition-opacity p-0.5 rounded hover:bg-slate-800"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
