import dagre from '@dagrejs/dagre';
import { Table, Relationship, SchemaState } from './types';

export type LayoutDirection = 'TB' | 'LR';

export function applyAutoLayout(schema: SchemaState, direction: LayoutDirection = 'LR'): SchemaState {
  const positioned = calculateAutoLayout(schema.tables, schema.relationships, direction);
  return {
    tables: positioned,
    relationships: schema.relationships,
  };
}

export function calculateAutoLayout(
  tables: Table[],
  relationships: Relationship[],
  direction: LayoutDirection = 'LR'
): Table[] {
  if (tables.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setGraph({
    rankdir: direction,
    nodesep: 80,
    ranksep: 120,
    marginx: 40,
    marginy: 40,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const TABLE_WIDTH = 300;
  const HEADER_HEIGHT = 56;
  const ROW_HEIGHT = 38;
  const FOOTER_PADDING = 16;

  tables.forEach((table) => {
    const height = HEADER_HEIGHT + Math.max(1, table.columns.length) * ROW_HEIGHT + FOOTER_PADDING;
    g.setNode(table.id, { width: TABLE_WIDTH, height });
  });

  relationships.forEach((rel) => {
    // Only connect if both source and target tables exist
    const hasSource = tables.some((t) => t.id === rel.sourceTableId);
    const hasTarget = tables.some((t) => t.id === rel.targetTableId);
    if (hasSource && hasTarget) {
      g.setEdge(rel.sourceTableId, rel.targetTableId);
    }
  });

  dagre.layout(g);

  return tables.map((table) => {
    const nodePos = g.node(table.id);
    if (!nodePos) return table;

    const height = HEADER_HEIGHT + Math.max(1, table.columns.length) * ROW_HEIGHT + FOOTER_PADDING;
    return {
      ...table,
      position: {
        x: Math.round(nodePos.x - TABLE_WIDTH / 2),
        y: Math.round(nodePos.y - height / 2),
      },
    };
  });
}
