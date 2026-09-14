import { SchemaState, Table, Column, Relationship } from '../types';

export function generateMermaidErDiagram(schema: SchemaState): string {
  const lines: string[] = ['erDiagram'];

  if (schema.tables.length === 0) {
    return 'erDiagram\n  %% No tables in schema';
  }

  // Generate relationships
  schema.relationships.forEach((rel) => {
    const edgeStr = formatMermaidRelationship(rel, schema.tables);
    if (edgeStr) lines.push(`  ${edgeStr}`);
  });

  // Generate tables with columns
  schema.tables.forEach((table) => {
    lines.push(`  ${formatIdentifier(table.name)} {`);
    table.columns.forEach((col) => {
      const typeStr = mapMermaidType(col.type);
      const colName = col.name.replace(/[^a-zA-Z0-9_]/g, '_');
      let keyMarker = '';
      if (col.isPrimary) {
        keyMarker = ' PK';
      } else if (isColumnForeignKey(col, table, schema)) {
        keyMarker = ' FK';
      } else if (col.isUnique) {
        keyMarker = ' UK';
      }
      lines.push(`    ${typeStr} ${colName}${keyMarker}`);
    });
    lines.push('  }');
  });

  return lines.join('\n');
}

function formatIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase();
}

function mapMermaidType(type: string): string {
  switch (type) {
    case 'UUID':
      return 'uuid';
    case 'INTEGER':
    case 'SERIAL':
    case 'BIGINT':
    case 'BIGSERIAL':
    case 'SMALLINT':
      return 'int';
    case 'BOOLEAN':
      return 'boolean';
    case 'TIMESTAMP':
    case 'TIMESTAMPTZ':
    case 'DATE':
    case 'TIME':
      return 'datetime';
    case 'DECIMAL':
    case 'NUMERIC':
    case 'REAL':
    case 'DOUBLE':
      return 'float';
    case 'JSON':
    case 'JSONB':
      return 'json';
    default:
      return 'string';
  }
}

function isColumnForeignKey(col: Column, table: Table, schema: SchemaState): boolean {
  return schema.relationships.some(
    (r) => r.sourceTableId === table.id && r.sourceColumnId === col.id
  );
}

function formatMermaidRelationship(rel: Relationship, tables: Table[]): string | null {
  const sourceTable = tables.find((t) => t.id === rel.sourceTableId);
  const targetTable = tables.find((t) => t.id === rel.targetTableId);
  if (!sourceTable || !targetTable) return null;

  const src = formatIdentifier(sourceTable.name);
  const tgt = formatIdentifier(targetTable.name);

  // In Mermaid: TARGET ||--o{ SOURCE : references
  let symbol = '||--o{';
  if (rel.cardinality === 'ONE_TO_ONE') symbol = '||--||';
  if (rel.cardinality === 'MANY_TO_MANY') symbol = '}|--|{';

  return `${tgt} ${symbol} ${src} : "references"`;
}
