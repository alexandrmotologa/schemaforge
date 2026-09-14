import { describe, it, expect } from 'vitest';
import { calculateAutoLayout, adjustDownwardPositions } from '../engine/autoLayout';
import { Table, Relationship } from '../engine/types';

describe('Auto Layout Engine', () => {
  it('calculates positions for tables', () => {
    const tables: Table[] = [
      {
        id: 't1',
        name: 'users',
        position: { x: 0, y: 0 },
        columns: [{ id: 'c1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true }],
      },
      {
        id: 't2',
        name: 'posts',
        position: { x: 0, y: 0 },
        columns: [
          { id: 'c2', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
          { id: 'c3', name: 'user_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
        ],
      },
    ];

    const relationships: Relationship[] = [
      {
        id: 'r1',
        sourceTableId: 't2',
        sourceColumnId: 'c3',
        targetTableId: 't1',
        targetColumnId: 'c1',
        cardinality: 'ONE_TO_MANY',
      },
    ];

    const laidOut = calculateAutoLayout(tables, relationships, 'LR');
    expect(laidOut).toHaveLength(2);
    // Nodes should have been shifted from (0,0)
    expect(laidOut[0].position.x !== 0 || laidOut[0].position.y !== 0).toBe(true);
    expect(laidOut[1].position.x !== 0 || laidOut[1].position.y !== 0).toBe(true);
  });

  it('automatically shifts downstream tables downwards when a table expands in height', () => {
    // Top table initially at (100, 50) with 10 columns (height ~ 470px)
    const topTable: Table = {
      id: 'categories',
      name: 'categories',
      position: { x: 100, y: 50 },
      columns: Array.from({ length: 10 }, (_, i) => ({
        id: `c_${i}`,
        name: `col_${i}`,
        type: 'VARCHAR',
        isPrimary: i === 0,
        isNullable: true,
        isUnique: false,
      })),
    };

    // Middle table initially at (100, 200) - vertically colliding with top table!
    const middleTable: Table = {
      id: 'products',
      name: 'products',
      position: { x: 100, y: 200 },
      columns: [
        { id: 'p_1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
        { id: 'p_2', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
      ],
    };

    // Bottom table initially at (100, 450) - will collide if middle table shifts down!
    const bottomTable: Table = {
      id: 'reviews',
      name: 'reviews',
      position: { x: 100, y: 450 },
      columns: [
        { id: 'r_1', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
      ],
    };

    const adjusted = adjustDownwardPositions([topTable, middleTable, bottomTable], 'categories', 50);

    const adjTop = adjusted.find((t) => t.id === 'categories')!;
    const adjMiddle = adjusted.find((t) => t.id === 'products')!;
    const adjBottom = adjusted.find((t) => t.id === 'reviews')!;

    // Top table stays at y = 50
    expect(adjTop.position.y).toBe(50);

    // Middle table must be pushed down so it is at least 50px below top table's bottom
    // Top table height is at least 52 + 10 * 38 + 38 = 470px. Bottom = 520px.
    // Middle table Y must be >= 570px!
    expect(adjMiddle.position.y).toBeGreaterThanOrEqual(570);

    // Bottom table must cascade down and be at least 50px below middle table's bottom
    expect(adjBottom.position.y).toBeGreaterThan(adjMiddle.position.y);
  });
});
