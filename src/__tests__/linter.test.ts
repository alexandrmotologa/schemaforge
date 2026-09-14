import { describe, it, expect } from 'vitest';
import { lintSchema } from '../engine/linter';
import { SchemaState } from '../engine/types';

describe('Schema Linter & Diagnostics', () => {
  it('flags tables without primary keys', () => {
    const schema: SchemaState = {
      tables: [
        {
          id: 'table_1',
          name: 'logs',
          position: { x: 0, y: 0 },
          columns: [
            { id: 'col_1', name: 'message', type: 'TEXT', isPrimary: false, isNullable: true, isUnique: false },
          ],
        },
      ],
      relationships: [],
    };

    const diagnostics = lintSchema(schema);
    const missingPk = diagnostics.find((d) => d.rule === 'missing-primary-key');
    expect(missingPk).toBeDefined();
    expect(missingPk?.severity).toBe('warning');
  });

  it('detects type mismatches across foreign keys', () => {
    const schema: SchemaState = {
      tables: [
        {
          id: 'table_users',
          name: 'users',
          position: { x: 0, y: 0 },
          columns: [
            { id: 'col_u_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
          ],
        },
        {
          id: 'table_orders',
          name: 'orders',
          position: { x: 200, y: 0 },
          columns: [
            { id: 'col_o_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'col_o_user_id', name: 'user_id', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false },
          ],
        },
      ],
      relationships: [
        {
          id: 'rel_1',
          sourceTableId: 'table_orders',
          sourceColumnId: 'col_o_user_id',
          targetTableId: 'table_users',
          targetColumnId: 'col_u_id',
          cardinality: 'ONE_TO_MANY',
        },
      ],
    };

    const diagnostics = lintSchema(schema);
    const typeMismatch = diagnostics.find((d) => d.rule === 'type-mismatch');
    expect(typeMismatch).toBeDefined();
    expect(typeMismatch?.severity).toBe('warning');
  });

  it('detects duplicate column names in the same table', () => {
    const schema: SchemaState = {
      tables: [
        {
          id: 'table_1',
          name: 'items',
          position: { x: 0, y: 0 },
          columns: [
            { id: 'col_1', name: 'title', type: 'VARCHAR', isPrimary: true, isNullable: false, isUnique: false },
            { id: 'col_2', name: 'title', type: 'TEXT', isPrimary: false, isNullable: true, isUnique: false },
          ],
        },
      ],
      relationships: [],
    };

    const diagnostics = lintSchema(schema);
    const dupCol = diagnostics.find((d) => d.rule === 'duplicate-column-name');
    expect(dupCol).toBeDefined();
    expect(dupCol?.severity).toBe('error');
  });
});
