import { Table, SchemaState } from './types';

export function generateMockDataSql(table: Table, rowCount = 5): string {
  if (table.columns.length === 0) return `-- Table "${table.name}" has no columns.`;

  const columnNames = table.columns.map((c) => `"${c.name}"`).join(', ');
  const rows: string[] = [];

  for (let i = 1; i <= rowCount; i++) {
    const values = table.columns.map((col) => generateColumnValueSql(col.name, col.type, i));
    rows.push(`  (${values.join(', ')})`);
  }

  return `-- Sample mock data for "${table.name}"\nINSERT INTO "${table.name}" (${columnNames}) VALUES\n${rows.join(',\n')};`;
}

export function generateMockDataJson(table: Table, rowCount = 5): Record<string, unknown>[] {
  const records: Record<string, unknown>[] = [];

  for (let i = 1; i <= rowCount; i++) {
    const record: Record<string, unknown> = {};
    table.columns.forEach((col) => {
      record[col.name] = generateColumnValueRaw(col.name, col.type, i);
    });
    records.push(record);
  }

  return records;
}

export function generateMockDataCsv(table: Table, rowCount = 10): string {
  if (table.columns.length === 0) return '';
  const headers = table.columns.map((c) => `"${c.name.replace(/"/g, '""')}"`).join(',');
  const rows = generateMockDataJson(table, rowCount).map((record) => {
    return table.columns
      .map((col) => {
        const val = record[col.name];
        if (val === null || val === undefined) return '';
        const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return `"${str.replace(/"/g, '""')}"`;
      })
      .join(',');
  });
  return [headers, ...rows].join('\n');
}

export function generateAllTablesMockJson(schema: SchemaState, rowsPerTable = 5): Record<string, unknown[]> {
  const result: Record<string, unknown[]> = {};
  schema.tables.forEach((t) => {
    result[t.name] = generateMockDataJson(t, rowsPerTable);
  });
  return result;
}

export function generateAllTablesMockSql(schema: SchemaState, rowsPerTable = 3): string {
  const parts: string[] = [
    '--',
    `-- SchemaForge Synthetic Test Fixtures`,
    `-- Generated on ${new Date().toISOString()}`,
    '--',
    ''
  ];

  schema.tables.forEach((table) => {
    parts.push(generateMockDataSql(table, rowsPerTable));
    parts.push('');
  });

  return parts.join('\n');
}

function generateColumnValueRaw(colName: string, type: string, index: number): unknown {
  const name = colName.toLowerCase();

  if (name === 'id' || name.endsWith('_id') || type === 'UUID') {
    return `a0eebc99-9c0b-4ef8-bb6d-${String(100000000000 + index).slice(1)}`;
  }
  if (name.includes('email')) return `user${index}@example.com`;
  if (name.includes('name') || name.includes('title')) {
    const sampleNames = ['Alice Carter', 'Bob Sterling', 'Charlie Vance', 'Diana Prince', 'Evan Wright'];
    return sampleNames[(index - 1) % sampleNames.length];
  }
  if (name.includes('phone')) return `+1-555-010${index}`;
  if (name.includes('role')) return index === 1 ? 'admin' : 'member';
  if (name.includes('status')) return index % 2 === 0 ? 'active' : 'pending';
  if (name.includes('price') || name.includes('amount') || name.includes('total') || type === 'DECIMAL' || type === 'NUMERIC') {
    return Number((19.99 * index).toFixed(2));
  }
  if (type === 'BOOLEAN') return index % 2 === 1;
  if (type === 'INTEGER' || type === 'BIGINT' || type === 'SERIAL' || type === 'BIGSERIAL' || type === 'SMALLINT') {
    return index;
  }
  if (type === 'TIMESTAMP' || type === 'TIMESTAMPTZ' || type === 'DATE') {
    return new Date(Date.now() - index * 86400000).toISOString();
  }
  if (type === 'JSON' || type === 'JSONB') {
    return { sampleKey: `value_${index}`, active: true };
  }
  if (name.includes('desc') || name.includes('bio')) {
    return `Sample descriptive text entry number ${index} for testing.`;
  }
  return `${colName}_val_${index}`;
}

function generateColumnValueSql(colName: string, type: string, index: number): string {
  const val = generateColumnValueRaw(colName, type, index);

  if (typeof val === 'string') {
    return `'${val.replace(/'/g, "''")}'`;
  }
  if (typeof val === 'number') {
    return String(val);
  }
  if (typeof val === 'boolean') {
    return val ? 'TRUE' : 'FALSE';
  }
  if (typeof val === 'object' && val !== null) {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${val}'`;
}
