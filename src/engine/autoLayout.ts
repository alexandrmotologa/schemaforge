import dagre from '@dagrejs/dagre';
import { Table, Relationship, SchemaState } from './types';

export type LayoutDirection = 'TB' | 'LR';

export function getEstimatedTableHeight(table: Table): number {
  const HEADER_HEIGHT = 52;
  const ROW_HEIGHT = 38;
  const FOOTER_HEIGHT = 38;
  const INDEX_HEADER = table.indexes && table.indexes.length > 0 ? 34 : 0;
  const INDEX_ROWS =
    table.indexes && table.indexes.length > 0
      ? Math.ceil(table.indexes.length / 2) * 26
      : 0;
  return (
    HEADER_HEIGHT +
    Math.max(1, table.columns.length) * ROW_HEIGHT +
    FOOTER_HEIGHT +
    INDEX_HEADER +
    INDEX_ROWS
  );
}

/**
 * Resolves vertical collisions by automatically shifting downstream tables in the same column lane downwards.
 * Cascades shifts to subsequent lower tables so no elements ever overlap.
 */
export function adjustDownwardPositions(
  tables: Table[],
  expandingTableId?: string,
  minVerticalGap: number = 60
): Table[] {
  if (tables.length <= 1) return tables;

  const result = tables.map((t) => ({ ...t, position: { ...t.position } }));
  const TABLE_WIDTH = 300;
  const HORIZONTAL_OVERLAP_THRESHOLD = TABLE_WIDTH - 40; // 260px

  let hasCollision = true;
  let passes = 0;
  const MAX_PASSES = 15;

  while (hasCollision && passes < MAX_PASSES) {
    hasCollision = false;
    passes++;

    for (let i = 0; i < result.length; i++) {
      const topTable = result[i];
      const topHeight = getEstimatedTableHeight(topTable);
      const topBottom = topTable.position.y + topHeight;

      for (let j = 0; j < result.length; j++) {
        if (i === j) continue;
        const bottomTable = result[j];

        const xDist = Math.abs(topTable.position.x - bottomTable.position.x);
        if (xDist < HORIZONTAL_OVERLAP_THRESHOLD) {
          // Table i is positioned above Table j
          if (topTable.position.y <= bottomTable.position.y) {
            const requiredMinY = topBottom + minVerticalGap;
            if (bottomTable.position.y < requiredMinY) {
              bottomTable.position.y = Math.round(requiredMinY);
              hasCollision = true;
            }
          }
        }
      }
    }
  }

  return result;
}

export function applyAutoLayout(
  schema: SchemaState,
  direction: LayoutDirection = 'LR'
): SchemaState {
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
    ranksep: 140,
    marginx: 50,
    marginy: 50,
  });
  g.setDefaultEdgeLabel(() => ({}));

  const TABLE_WIDTH = 300;

  tables.forEach((table) => {
    const height = getEstimatedTableHeight(table);
    g.setNode(table.id, { width: TABLE_WIDTH, height });
  });

  relationships.forEach((rel) => {
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

    const height = getEstimatedTableHeight(table);
    return {
      ...table,
      position: {
        x: Math.round(nodePos.x - TABLE_WIDTH / 2),
        y: Math.round(nodePos.y - height / 2),
      },
    };
  });
}
