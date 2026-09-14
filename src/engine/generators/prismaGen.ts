import { SchemaState, Table, Column, Relationship } from '../types';

export function generatePrismaSchema(schema: SchemaState): string {
  const parts: string[] = [
    '// This is your Prisma schema file,',
    '// learn more about it in the docs: https://pris.ly/d/prisma-schema',
    '',
    'generator client {',
    '  provider = "prisma-client-js"',
    '}',
    '',
    'datasource db {',
    '  provider = "postgresql"',
    '  url      = env("DATABASE_URL")',
    '}',
    ''
  ];

  schema.tables.forEach((table) => {
    parts.push(generatePrismaModel(table, schema));
    parts.push('');
  });

  return parts.join('\n');
}

function toPascalCase(str: string): string {
  // If ends with s, singularize simply or keep
  let clean = str.replace(/[^a-zA-Z0-9_]/g, '');
  if (clean.endsWith('ies')) {
    clean = clean.slice(0, -3) + 'y';
  } else if (clean.endsWith('s') && !clean.endsWith('ss')) {
    clean = clean.slice(0, -1);
  }

  return clean
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function toCamelCase(str: string): string {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function mapPrismaType(col: Column): string {
  switch (col.type) {
    case 'UUID':
    case 'VARCHAR':
    case 'TEXT':
      return 'String';
    case 'INTEGER':
    case 'SERIAL':
    case 'SMALLINT':
      return 'Int';
    case 'BIGINT':
    case 'BIGSERIAL':
      return 'BigInt';
    case 'BOOLEAN':
      return 'Boolean';
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
    case 'DATE':
    case 'TIME':
      return 'DateTime';
    case 'DECIMAL':
    case 'NUMERIC':
    case 'REAL':
    case 'DOUBLE':
      return 'Decimal';
    case 'JSON':
    case 'JSONB':
      return 'Json';
    case 'BYTEA':
      return 'Bytes';
    default:
      return 'String';
  }
}

function generatePrismaModel(table: Table, schema: SchemaState): string {
  const modelName = toPascalCase(table.name);
  const lines: string[] = [];

  // Table columns
  table.columns.forEach((col) => {
    let typeStr = mapPrismaType(col);
    if (col.isNullable && !col.isPrimary) {
      typeStr += '?';
    }

    const attrs: string[] = [];
    if (col.isPrimary) {
      attrs.push('@id');
      if (col.type === 'UUID') {
        attrs.push('@default(uuid())');
      } else if (col.type === 'SERIAL' || col.type === 'BIGSERIAL' || col.type === 'INTEGER') {
        attrs.push('@default(autoincrement())');
      }
    }

    if (col.isUnique && !col.isPrimary) {
      attrs.push('@unique');
    }

    if (col.type === 'TIMESTAMP' && col.name.includes('created')) {
      attrs.push('@default(now())');
    } else if (col.type === 'TIMESTAMP' && col.name.includes('updated')) {
      attrs.push('@updatedAt');
    } else if (col.defaultValue && col.defaultValue.trim() !== '') {
      attrs.push(`@default(${col.defaultValue})`);
    }

    lines.push(`  ${col.name.padEnd(16)} ${typeStr.padEnd(12)} ${attrs.join(' ')}`.trimEnd());
  });

  // Outgoing foreign key relations (this table references another)
  const outgoing = schema.relationships.filter((r) => r.sourceTableId === table.id);
  outgoing.forEach((rel) => {
    const sourceCol = table.columns.find((c) => c.id === rel.sourceColumnId);
    const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
    const targetCol = targetTable?.columns.find((c) => c.id === rel.targetColumnId);

    if (sourceCol && targetTable && targetCol) {
      const relationName = toCamelCase(targetTable.name);
      const targetModel = toPascalCase(targetTable.name);
      const onDelete = rel.onDelete ? `, onDelete: ${rel.onDelete === 'SET NULL' ? 'SetNull' : 'Cascade'}` : '';

      lines.push(
        `  ${relationName.padEnd(16)} ${targetModel.padEnd(12)} @relation(fields: [${sourceCol.name}], references: [${targetCol.name}]${onDelete})`
      );
    }
  });

  // Incoming relations (other tables reference this table)
  const incoming = schema.relationships.filter((r) => r.targetTableId === table.id);
  incoming.forEach((rel) => {
    const sourceTable = schema.tables.find((t) => t.id === rel.sourceTableId);
    if (sourceTable) {
      const fieldName = `${sourceTable.name}`;
      const sourceModel = toPascalCase(sourceTable.name);
      const isArray = rel.cardinality !== 'ONE_TO_ONE';
      const typeDesc = isArray ? `${sourceModel}[]` : `${sourceModel}?`;

      lines.push(`  ${fieldName.padEnd(16)} ${typeDesc}`);
    }
  });

  // Model level indexes
  if (table.indexes && table.indexes.length > 0) {
    table.indexes.forEach((idx) => {
      const directive = idx.isUnique ? '@@unique' : '@@index';
      const cols = idx.columns.join(', ');
      const mapClause = idx.name ? `, map: "${idx.name}"` : '';
      lines.push(`  ${directive}([${cols}]${mapClause})`);
    });
  }

  return `model ${modelName} {\n${lines.join('\n')}\n\n  @@map("${table.name}")\n}`;
}
