import { SchemaState, Diagnostic } from './types';

export function lintSchema(schema: SchemaState): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const tableNames = new Map<string, string[]>(); // lowercase name -> table IDs

  schema.tables.forEach((table) => {
    const lowerName = table.name.trim().toLowerCase();
    if (!tableNames.has(lowerName)) {
      tableNames.set(lowerName, []);
    }
    tableNames.get(lowerName)!.push(table.id);

    // Rule: Empty table
    if (table.columns.length === 0) {
      diagnostics.push({
        id: `empty-table-${table.id}`,
        severity: 'warning',
        tableId: table.id,
        tableName: table.name,
        message: `Table "${table.name}" has no columns defined.`,
        rule: 'empty-table',
      });
    }

    // Rule: Missing primary key
    const primaryKeys = table.columns.filter((c) => c.isPrimary);
    if (table.columns.length > 0 && primaryKeys.length === 0) {
      diagnostics.push({
        id: `missing-pk-${table.id}`,
        severity: 'warning',
        tableId: table.id,
        tableName: table.name,
        message: `Table "${table.name}" has no primary key. Most relational databases require a primary key for indexing and replication.`,
        rule: 'missing-primary-key',
      });
    }

    // Rule: Duplicate column names within same table
    const colNames = new Set<string>();
    table.columns.forEach((col) => {
      const lowerCol = col.name.trim().toLowerCase();
      if (colNames.has(lowerCol)) {
        diagnostics.push({
          id: `duplicate-col-${table.id}-${col.id}`,
          severity: 'error',
          tableId: table.id,
          columnId: col.id,
          tableName: table.name,
          columnName: col.name,
          message: `Column "${col.name}" is defined multiple times in table "${table.name}".`,
          rule: 'duplicate-column-name',
        });
      }
      colNames.add(lowerCol);
    });
  });

  // Rule: Duplicate table names
  tableNames.forEach((ids, name) => {
    if (ids.length > 1) {
      ids.forEach((id) => {
        const table = schema.tables.find((t) => t.id === id);
        diagnostics.push({
          id: `duplicate-table-${id}`,
          severity: 'error',
          tableId: id,
          tableName: table?.name,
          message: `Table name "${table?.name || name}" is used multiple times. Table names must be unique.`,
          rule: 'duplicate-table-name',
        });
      });
    }
  });

  // Rule: Relationships integrity
  schema.relationships.forEach((rel) => {
    const sourceTable = schema.tables.find((t) => t.id === rel.sourceTableId);
    const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);

    if (!sourceTable) {
      diagnostics.push({
        id: `broken-rel-src-table-${rel.id}`,
        severity: 'error',
        message: `Relationship references missing source table (ID: ${rel.sourceTableId}).`,
        rule: 'dangling-foreign-key',
      });
      return;
    }

    if (!targetTable) {
      diagnostics.push({
        id: `broken-rel-tgt-table-${rel.id}`,
        severity: 'error',
        tableId: sourceTable.id,
        tableName: sourceTable.name,
        message: `Relationship in "${sourceTable.name}" references missing target table (ID: ${rel.targetTableId}).`,
        rule: 'dangling-foreign-key',
      });
      return;
    }

    const sourceCol = sourceTable.columns.find((c) => c.id === rel.sourceColumnId);
    const targetCol = targetTable.columns.find((c) => c.id === rel.targetColumnId);

    if (!sourceCol) {
      diagnostics.push({
        id: `broken-rel-src-col-${rel.id}`,
        severity: 'error',
        tableId: sourceTable.id,
        tableName: sourceTable.name,
        message: `Foreign key relationship refers to a missing column in table "${sourceTable.name}".`,
        rule: 'dangling-foreign-key',
      });
      return;
    }

    if (!targetCol) {
      diagnostics.push({
        id: `broken-rel-tgt-col-${rel.id}`,
        severity: 'error',
        tableId: sourceTable.id,
        columnId: sourceCol.id,
        tableName: sourceTable.name,
        columnName: sourceCol.name,
        message: `Foreign key "${sourceTable.name}.${sourceCol.name}" points to a non-existent column in "${targetTable.name}".`,
        rule: 'dangling-foreign-key',
      });
      return;
    }

    // Rule: Type compatibility between FK and PK
    const isCompatible = areTypesCompatible(sourceCol.type, targetCol.type);
    if (!isCompatible) {
      diagnostics.push({
        id: `type-mismatch-${rel.id}`,
        severity: 'warning',
        tableId: sourceTable.id,
        columnId: sourceCol.id,
        tableName: sourceTable.name,
        columnName: sourceCol.name,
        message: `Type mismatch on foreign key: "${sourceTable.name}.${sourceCol.name}" (${sourceCol.type}) references "${targetTable.name}.${targetCol.name}" (${targetCol.type}).`,
        rule: 'type-mismatch',
      });
    }
  });

  return diagnostics;
}

function areTypesCompatible(typeA: string, typeB: string): boolean {
  if (typeA === typeB) return true;

  const intTypes = new Set(['INTEGER', 'BIGINT', 'SMALLINT', 'SERIAL', 'BIGSERIAL']);
  if (intTypes.has(typeA) && intTypes.has(typeB)) return true;

  const stringTypes = new Set(['VARCHAR', 'TEXT', 'CHAR']);
  if (stringTypes.has(typeA) && stringTypes.has(typeB)) return true;

  const numericTypes = new Set(['DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE']);
  if (numericTypes.has(typeA) && numericTypes.has(typeB)) return true;

  const timeTypes = new Set(['TIMESTAMP', 'TIMESTAMPTZ', 'DATE']);
  if (timeTypes.has(typeA) && timeTypes.has(typeB)) return true;

  const jsonTypes = new Set(['JSON', 'JSONB']);
  if (jsonTypes.has(typeA) && jsonTypes.has(typeB)) return true;

  return false;
}
