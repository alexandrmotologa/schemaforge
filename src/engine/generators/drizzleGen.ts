import { SchemaState, Table, Column } from '../types';

export function generateDrizzleSchema(schema: SchemaState): string {
  const parts: string[] = [
    '// SchemaForge Drizzle ORM Schema Export (PostgreSQL)',
    '// Docs: https://orm.drizzle.team/docs/sql-schema-declaration',
    '',
    "import { pgTable, text, varchar, integer, bigint, boolean, timestamp, uuid, jsonb, decimal } from 'drizzle-orm/pg-core';",
    "import { relations } from 'drizzle-orm';",
    ''
  ];

  if (schema.tables.length === 0) {
    return parts.join('\n') + '\n// No tables defined in schema.';
  }

  // Generate pgTable declarations
  schema.tables.forEach((table) => {
    parts.push(generateDrizzleTable(table, schema));
    parts.push('');
  });

  // Generate relations() blocks
  schema.tables.forEach((table) => {
    const relBlock = generateDrizzleRelations(table, schema);
    if (relBlock) {
      parts.push(relBlock);
      parts.push('');
    }
  });

  return parts.join('\n');
}

function toCamelCase(str: string): string {
  return str
    .replace(/[^a-zA-Z0-9_]/g, '')
    .split('_')
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

function mapDrizzleColumn(col: Column, table: Table, schema: SchemaState): string {
  const tsProp = toCamelCase(col.name);
  let chain = '';

  // Check if column is a foreign key
  const rel = schema.relationships.find(
    (r) => r.sourceTableId === table.id && r.sourceColumnId === col.id
  );
  let fkRef = '';
  if (rel) {
    const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
    const targetCol = targetTable?.columns.find((c) => c.id === rel.targetColumnId);
    if (targetTable && targetCol) {
      const targetTableVar = toCamelCase(targetTable.name);
      const targetColProp = toCamelCase(targetCol.name);
      const onDelete = rel.onDelete ? `, { onDelete: '${rel.onDelete.toLowerCase()}' }` : '';
      fkRef = `.references(() => ${targetTableVar}.${targetColProp}${onDelete})`;
    }
  }

  switch (col.type) {
    case 'UUID':
      chain = `uuid('${col.name}')`;
      if (col.isPrimary) chain += '.defaultRandom().primaryKey()';
      break;
    case 'SERIAL':
    case 'INTEGER':
      chain = `integer('${col.name}')`;
      if (col.isPrimary) chain += '.primaryKey()';
      break;
    case 'BIGSERIAL':
    case 'BIGINT':
      chain = `bigint('${col.name}', { mode: 'number' })`;
      if (col.isPrimary) chain += '.primaryKey()';
      break;
    case 'VARCHAR':
      chain = `varchar('${col.name}', { length: 255 })`;
      if (col.isPrimary) chain += '.primaryKey()';
      break;
    case 'TEXT':
      chain = `text('${col.name}')`;
      if (col.isPrimary) chain += '.primaryKey()';
      break;
    case 'BOOLEAN':
      chain = `boolean('${col.name}')`;
      break;
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
      chain = `timestamp('${col.name}')`;
      if (col.name.includes('created')) chain += '.defaultNow()';
      break;
    case 'JSON':
    case 'JSONB':
      chain = `jsonb('${col.name}')`;
      break;
    case 'DECIMAL':
    case 'NUMERIC':
      chain = `decimal('${col.name}', { precision: 12, scale: 2 })`;
      break;
    default:
      chain = `varchar('${col.name}', { length: 255 })`;
  }

  if (fkRef) {
    chain += fkRef;
  }

  if (!col.isNullable && !col.isPrimary) {
    chain += '.notNull()';
  }

  if (col.isUnique && !col.isPrimary) {
    chain += '.unique()';
  }

  return `  ${tsProp}: ${chain},`;
}

function generateDrizzleTable(table: Table, schema: SchemaState): string {
  const tableVar = toCamelCase(table.name);
  const colLines = table.columns.map((col) => mapDrizzleColumn(col, table, schema));

  return `export const ${tableVar} = pgTable('${table.name}', {\n${colLines.join('\n')}\n});`;
}

function generateDrizzleRelations(table: Table, schema: SchemaState): string | null {
  const outgoing = schema.relationships.filter((r) => r.sourceTableId === table.id);
  const incoming = schema.relationships.filter((r) => r.targetTableId === table.id);

  if (outgoing.length === 0 && incoming.length === 0) return null;

  const tableVar = toCamelCase(table.name);
  const relationDefs: string[] = [];

  outgoing.forEach((rel) => {
    const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
    const sourceCol = table.columns.find((c) => c.id === rel.sourceColumnId);
    const targetCol = targetTable?.columns.find((c) => c.id === rel.targetColumnId);
    if (targetTable && sourceCol && targetCol) {
      const relProp = toCamelCase(targetTable.name);
      const targetVar = toCamelCase(targetTable.name);
      relationDefs.push(
        `  ${relProp}: one(${targetVar}, {\n    fields: [${tableVar}.${toCamelCase(sourceCol.name)}],\n    references: [${targetVar}.${toCamelCase(targetCol.name)}],\n  }),`
      );
    }
  });

  incoming.forEach((rel) => {
    const sourceTable = schema.tables.find((t) => t.id === rel.sourceTableId);
    if (sourceTable) {
      const relProp = toCamelCase(sourceTable.name) + 'List';
      const sourceVar = toCamelCase(sourceTable.name);
      relationDefs.push(`  ${relProp}: many(${sourceVar}),`);
    }
  });

  const helpers = [];
  if (outgoing.length > 0) helpers.push('one');
  if (incoming.length > 0) helpers.push('many');

  return `export const ${tableVar}Relations = relations(${tableVar}, ({ ${helpers.join(', ')} }) => ({\n${relationDefs.join('\n')}\n}));`;
}
