import { SchemaState, Table, Column } from '../types';

export function generateSqliteDdl(schema: SchemaState): string {
  const parts: string[] = [
    '--',
    '-- SchemaForge SQLite DDL Export',
    `-- Generated: ${new Date().toISOString()}`,
    '--',
    'PRAGMA foreign_keys = ON;',
    ''
  ];

  if (schema.tables.length === 0) {
    return parts.join('\n') + '\n-- No tables defined in schema.';
  }

  schema.tables.forEach((table) => {
    parts.push(generateSqliteTableDdl(table, schema));
    parts.push('');
  });

  return parts.join('\n');
}

function mapSqliteType(col: Column): string {
  switch (col.type) {
    case 'INTEGER':
    case 'BIGINT':
    case 'SMALLINT':
    case 'SERIAL':
    case 'BIGSERIAL':
    case 'BOOLEAN':
      return 'INTEGER';
    case 'REAL':
    case 'DOUBLE':
    case 'DECIMAL':
    case 'NUMERIC':
      return 'REAL';
    case 'BYTEA':
      return 'BLOB';
    case 'UUID':
    case 'VARCHAR':
    case 'TEXT':
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
    case 'DATE':
    case 'TIME':
    case 'JSON':
    case 'JSONB':
    default:
      return 'TEXT';
  }
}

function generateSqliteTableDdl(table: Table, schema: SchemaState): string {
  const lines: string[] = [];
  const primaryKeys = table.columns.filter((c) => c.isPrimary);

  table.columns.forEach((col) => {
    let def = `  "${col.name}" ${mapSqliteType(col)}`;

    if (primaryKeys.length === 1 && col.isPrimary) {
      if (col.type === 'SERIAL' || col.type === 'INTEGER') {
        def += ' PRIMARY KEY AUTOINCREMENT';
      } else {
        def += ' PRIMARY KEY';
      }
    } else if (!col.isNullable) {
      def += ' NOT NULL';
    }

    if (col.isUnique && !col.isPrimary) {
      def += ' UNIQUE';
    }

    if (col.defaultValue && col.defaultValue.trim() !== '') {
      def += ` DEFAULT ${col.defaultValue}`;
    }

    lines.push(def);
  });

  if (primaryKeys.length > 1) {
    const pkCols = primaryKeys.map((c) => `"${c.name}"`).join(', ');
    lines.push(`  PRIMARY KEY (${pkCols})`);
  }

  // Find relationships where this table is the source (holds the foreign key)
  const outgoingRels = schema.relationships.filter((r) => r.sourceTableId === table.id);
  outgoingRels.forEach((rel) => {
    const sourceCol = table.columns.find((c) => c.id === rel.sourceColumnId);
    const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
    const targetCol = targetTable?.columns.find((c) => c.id === rel.targetColumnId);

    if (sourceCol && targetTable && targetCol) {
      const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : ' ON DELETE CASCADE';
      lines.push(
        `  FOREIGN KEY ("${sourceCol.name}") REFERENCES "${targetTable.name}" ("${targetCol.name}")${onDelete}`
      );
    }
  });

  return `CREATE TABLE IF NOT EXISTS "${table.name}" (\n${lines.join(',\n')}\n);`;
}
