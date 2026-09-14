import { SchemaState, Table, Column, Relationship } from '../types';

export function generateMySql(schema: SchemaState): string {
  const parts: string[] = [
    '--',
    '-- SchemaForge MySQL DDL Export',
    `-- Generated: ${new Date().toISOString()}`,
    '--',
    'SET FOREIGN_KEY_CHECKS = 0;',
    ''
  ];

  if (schema.tables.length === 0) {
    return parts.join('\n') + '\n-- No tables defined in schema.';
  }

  schema.tables.forEach((table) => {
    parts.push(generateMySqlTable(table));
    parts.push('');
  });

  if (schema.relationships.length > 0) {
    parts.push('-- Foreign Keys');
    schema.relationships.forEach((rel) => {
      const fkSql = generateMySqlForeignKey(rel, schema.tables);
      if (fkSql) parts.push(fkSql);
    });
    parts.push('');
  }

  parts.push('SET FOREIGN_KEY_CHECKS = 1;');
  return parts.join('\n');
}

function mapMySqlType(col: Column): string {
  switch (col.type) {
    case 'UUID':
      return 'CHAR(36)';
    case 'SERIAL':
    case 'INTEGER':
      return 'INT';
    case 'BIGSERIAL':
    case 'BIGINT':
      return 'BIGINT';
    case 'SMALLINT':
      return 'SMALLINT';
    case 'BOOLEAN':
      return 'TINYINT(1)';
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
      return 'TIMESTAMP';
    case 'DATE':
      return 'DATE';
    case 'TIME':
      return 'TIME';
    case 'JSON':
    case 'JSONB':
      return 'JSON';
    case 'DECIMAL':
    case 'NUMERIC':
      return 'DECIMAL(12, 2)';
    case 'REAL':
    case 'DOUBLE':
      return 'DOUBLE';
    case 'BYTEA':
      return 'LONGBLOB';
    case 'TEXT':
      return 'TEXT';
    case 'VARCHAR':
    default:
      return 'VARCHAR(255)';
  }
}

function generateMySqlTable(table: Table): string {
  const lines: string[] = [];
  const primaryKeys = table.columns.filter((c) => c.isPrimary);

  table.columns.forEach((col) => {
    let def = `  \`${col.name}\` ${mapMySqlType(col)}`;

    if (col.isPrimary && (col.type === 'SERIAL' || col.type === 'BIGSERIAL' || col.type === 'INTEGER')) {
      def += ' AUTO_INCREMENT';
    }

    if (!col.isNullable || col.isPrimary) {
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

  if (primaryKeys.length > 0) {
    const pkList = primaryKeys.map((c) => `\`${c.name}\``).join(', ');
    lines.push(`  PRIMARY KEY (${pkList})`);
  }

  return `CREATE TABLE IF NOT EXISTS \`${table.name}\` (\n${lines.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`;
}

function generateMySqlForeignKey(rel: Relationship, tables: Table[]): string | null {
  const sourceTable = tables.find((t) => t.id === rel.sourceTableId);
  const targetTable = tables.find((t) => t.id === rel.targetTableId);
  if (!sourceTable || !targetTable) return null;

  const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId);
  const targetCol = targetTable.columns.find((c) => c.id === rel.targetColumnId);
  if (!sourceCol || !targetCol) return null;

  const constraintName = `fk_${sourceTable.name}_${sourceCol.name}`.toLowerCase();
  const onDelete = rel.onDelete ? ` ON DELETE ${rel.onDelete}` : ' ON DELETE CASCADE';

  return `ALTER TABLE \`${sourceTable.name}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${sourceCol.name}\`) REFERENCES \`${targetTable.name}\` (\`${targetCol.name}\`)${onDelete};`;
}
