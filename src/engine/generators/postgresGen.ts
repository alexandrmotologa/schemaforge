import { SchemaState, Table, Column, Relationship } from '../types';

export function generatePostgreSql(schema: SchemaState): string {
  const parts: string[] = [
    '--',
    '-- SchemaForge PostgreSQL DDL Export',
    `-- Generated: ${new Date().toISOString()}`,
    '--',
    ''
  ];

  if (schema.tables.length === 0) {
    return parts.join('\n') + '\n-- No tables defined in schema.';
  }

  // Generate CREATE TABLE statements
  schema.tables.forEach((table) => {
    parts.push(generateTableDdl(table));
    parts.push('');
  });

  // Generate Foreign Key Constraints
  if (schema.relationships.length > 0) {
    parts.push('--');
    parts.push('-- Foreign Key Relationships');
    parts.push('--');
    schema.relationships.forEach((rel) => {
      const fkSql = generateForeignKeyConstraint(rel, schema.tables);
      if (fkSql) parts.push(fkSql);
    });
    parts.push('');
  }

  return parts.join('\n');
}

function mapPostgresType(col: Column): string {
  if (col.isPrimary && (col.type === 'SERIAL' || col.type === 'INTEGER')) {
    return 'SERIAL';
  }
  if (col.isPrimary && (col.type === 'BIGSERIAL' || col.type === 'BIGINT')) {
    return 'BIGSERIAL';
  }

  switch (col.type) {
    case 'UUID':
      return 'UUID';
    case 'VARCHAR':
      return 'VARCHAR(255)';
    case 'TEXT':
      return 'TEXT';
    case 'INTEGER':
      return 'INTEGER';
    case 'BIGINT':
      return 'BIGINT';
    case 'SMALLINT':
      return 'SMALLINT';
    case 'BOOLEAN':
      return 'BOOLEAN';
    case 'TIMESTAMP':
      return 'TIMESTAMP';
    case 'TIMESTAMPTZ':
      return 'TIMESTAMPTZ';
    case 'DATE':
      return 'DATE';
    case 'TIME':
      return 'TIME';
    case 'JSON':
      return 'JSON';
    case 'JSONB':
      return 'JSONB';
    case 'DECIMAL':
    case 'NUMERIC':
      return 'DECIMAL(12, 2)';
    case 'REAL':
      return 'REAL';
    case 'DOUBLE':
      return 'DOUBLE PRECISION';
    case 'BYTEA':
      return 'BYTEA';
    default:
      return 'VARCHAR(255)';
  }
}

function generateTableDdl(table: Table): string {
  const lines: string[] = [];
  const primaryKeys = table.columns.filter((c) => c.isPrimary).map((c) => `"${c.name}"`);

  table.columns.forEach((col) => {
    let colDef = `  "${col.name}" ${mapPostgresType(col)}`;

    if (primaryKeys.length === 1 && col.isPrimary) {
      colDef += ' PRIMARY KEY';
    } else if (!col.isNullable) {
      colDef += ' NOT NULL';
    }

    if (col.isUnique && !col.isPrimary) {
      colDef += ' UNIQUE';
    }

    if (col.defaultValue && col.defaultValue.trim() !== '') {
      colDef += ` DEFAULT ${col.defaultValue}`;
    } else if (col.isPrimary && col.type === 'UUID') {
      colDef += ' DEFAULT gen_random_uuid()';
    } else if (col.type === 'TIMESTAMP' && col.name.includes('created')) {
      colDef += ' DEFAULT CURRENT_TIMESTAMP';
    }

    lines.push(colDef);
  });

  if (primaryKeys.length > 1) {
    lines.push(`  PRIMARY KEY (${primaryKeys.join(', ')})`);
  }

  let sql = `CREATE TABLE IF NOT EXISTS "${table.name}" (\n${lines.join(',\n')}\n);`;

  if (table.comment) {
    sql += `\nCOMMENT ON TABLE "${table.name}" IS '${table.comment.replace(/'/g, "''")}';`;
  }

  return sql;
}

function generateForeignKeyConstraint(rel: Relationship, tables: Table[]): string | null {
  const sourceTable = tables.find((t) => t.id === rel.sourceTableId);
  const targetTable = tables.find((t) => t.id === rel.targetTableId);
  if (!sourceTable || !targetTable) return null;

  const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId);
  const targetCol = targetTable.columns.find((c) => c.id === rel.targetColumnId);
  if (!sourceCol || !targetCol) return null;

  const constraintName = `fk_${sourceTable.name}_${sourceCol.name}`.toLowerCase();
  const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : ' ON DELETE CASCADE';
  const onUpdate = rel.onUpdate ? ` ON UPDATE ${rel.onUpdate}` : '';

  return `ALTER TABLE "${sourceTable.name}" ADD CONSTRAINT "${constraintName}" FOREIGN KEY ("${sourceCol.name}") REFERENCES "${targetTable.name}" ("${targetCol.name}")${onDelete}${onUpdate};`;
}
