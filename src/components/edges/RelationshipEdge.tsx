import React from 'react';
import {
  EdgeProps,
  getSmoothStepPath,
  EdgeLabelRenderer,
  BaseEdge,
} from '@xyflow/react';
import { Cardinality, ReferentialAction, Relationship } from '../../engine/types';
import { X, SlidersHorizontal } from 'lucide-react';

interface RelationshipEdgeData {
  relationship?: Relationship;
  cardinality: Cardinality;
  onDeleteAction?: ReferentialAction;
  onDeleteEdge: (id: string) => void;
  onCycleCardinality?: (id: string) => void;
  onInspect?: (rel: Relationship) => void;
  isHighlighted?: boolean;
  isDimmed?: boolean;
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

  const isHighlighted = edgeData?.isHighlighted;
  const isDimmed = edgeData?.isDimmed;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: isHighlighted ? '#a855f7' : '#6366f1',
          strokeWidth: isHighlighted ? 3 : 2,
          strokeDasharray: isHighlighted ? '6 3' : '4 2',
          animation: 'dashdraw 1s linear infinite',
          opacity: isDimmed ? 0.15 : 1,
          filter: isHighlighted ? 'drop-shadow(0 0 6px rgba(168, 85, 247, 0.6))' : undefined,
          transition: 'all 0.3s ease',
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
          className={`nodrag nopan group flex items-center gap-1 bg-slate-900/95 border px-2 py-0.5 rounded-full shadow-xl text-[10px] font-mono transition-all duration-200 ${
            isDimmed ? 'opacity-20' : 'opacity-100 hover:scale-110'
          } ${
            isHighlighted
              ? 'border-purple-400 text-purple-200 ring-2 ring-purple-500/40'
              : 'border-indigo-500/50 hover:border-indigo-400 text-indigo-200'
          }`}
        >
          <span
            title="Cardinality (Click to cycle, or click settings icon to inspect)"
            className="cursor-pointer font-bold px-0.5 select-none"
            onClick={() => edgeData?.onCycleCardinality?.(id)}
          >
            {getCardinalityLabel(edgeData?.cardinality)}
          </span>

          {edgeData?.relationship && edgeData.onInspect && (
            <button
              onClick={() => edgeData.onInspect!(edgeData.relationship!)}
              title="Inspect relationship & referential constraints"
              className="text-slate-400 hover:text-indigo-300 p-0.5 rounded hover:bg-slate-800 transition-colors"
            >
              <SlidersHorizontal className="w-2.5 h-2.5" />
            </button>
          )}

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
