import { describe, it, expect } from 'vitest';
import { calculateAutoLayout } from '../engine/autoLayout';
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
});
