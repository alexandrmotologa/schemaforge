import { Table, Column, Relationship, DataType, SchemaState } from './types';
import { calculateAutoLayout } from './autoLayout';

interface ParseResult extends SchemaState {
  errors: string[];
}

export function parseSqlDdl(sql: string): ParseResult {
  const errors: string[] = [];
  const tables: Table[] = [];
  const relationships: Relationship[] = [];

  // Remove SQL comments (-- single line and /* multiline */)
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '');

  // Split statements by semicolon while respecting basic strings
  const statements = splitSqlStatements(cleanSql);

  const pendingForeignKeys: {
    sourceTableName: string;
    sourceColName: string;
    targetTableName: string;
    targetColName: string;
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  }[] = [];

  statements.forEach((stmt) => {
    const trimmed = stmt.trim();
    if (!trimmed) return;

    // Match CREATE TABLE [IF NOT EXISTS] [schema.]name ( body )
    const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:[`"']?\w+[`"']?\.)?([`"']?[\w_]+[`"']?)\s*\(([\s\S]+)\)/i;
    const match = trimmed.match(createTableRegex);

    if (match) {
      const rawTableName = stripQuotes(match[1]);
      const body = match[2];

      const tableId = `table_${rawTableName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const columns: Column[] = [];

      // Split body clauses by comma (handling nested parentheses in DECIMAL(10,2))
      const clauses = splitClauses(body);

      clauses.forEach((clause) => {
        const cTrim = clause.trim();
        if (!cTrim) return;

        // Check for Table-level PRIMARY KEY constraint
        const tablePkMatch = cTrim.match(/^(?:CONSTRAINT\s+[`"']?\w+[`"']?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i);
        if (tablePkMatch) {
          const pkCols = tablePkMatch[1].split(',').map((c) => stripQuotes(c.trim().toLowerCase()));
          columns.forEach((col) => {
            if (pkCols.includes(col.name.toLowerCase())) {
              col.isPrimary = true;
            }
          });
          return;
        }

        // Check for Table-level FOREIGN KEY constraint
        const tableFkMatch = cTrim.match(
          /^(?:CONSTRAINT\s+[`"']?(\w+)[`"']?\s+)?FOREIGN\s+KEY\s*\(([`"']?\w+[`"']?)\)\s*REFERENCES\s+(?:[`"']?\w+[`"']?\.)?([`"']?\w+[`"']?)\s*\(([`"']?\w+[`"']?)\)(?:\s+ON\s+DELETE\s+(CASCADE|SET\s+NULL|RESTRICT|NO\s+ACTION))?/i
        );
        if (tableFkMatch) {
          const srcCol = stripQuotes(tableFkMatch[2]);
          const tgtTable = stripQuotes(tableFkMatch[3]);
          const tgtCol = stripQuotes(tableFkMatch[4]);
          const action = normalizeAction(tableFkMatch[5]);

          pendingForeignKeys.push({
            sourceTableName: rawTableName,
            sourceColName: srcCol,
            targetTableName: tgtTable,
            targetColName: tgtCol,
            onDelete: action,
          });
          return;
        }

        // Parse Column Definition: name TYPE [modifiers]
        const colTokenMatch = cTrim.match(/^([`"']?[\w_]+[`"']?)\s+([\s\S]+)$/);
        if (colTokenMatch) {
          const colName = stripQuotes(colTokenMatch[1]);
          const rest = colTokenMatch[2].trim();

          let rawType = '';
          let modifiers = '';

          const multiWordMatch = rest.match(/^(DOUBLE\s+PRECISION|CHARACTER\s+VARYING)/i);
          if (multiWordMatch) {
            rawType = multiWordMatch[1];
            modifiers = rest.slice(rawType.length).trim();
          } else {
            const typeMatch = rest.match(/^([A-Za-z0-9_]+(?:\([^)]*\))?)([\s\S]*)$/);
            if (typeMatch) {
              rawType = typeMatch[1];
              modifiers = typeMatch[2].trim();
            } else {
              rawType = rest;
              modifiers = '';
            }
          }

          const type = normalizeDataType(rawType);
          const isPrimary = /PRIMARY\s+KEY/i.test(modifiers) || /SERIAL/i.test(rawType);
          const isNullable = !/NOT\s+NULL/i.test(modifiers) && !isPrimary;
          const isUnique = /UNIQUE/i.test(modifiers) && !isPrimary;

          // Default value match
          const defaultMatch = modifiers.match(/DEFAULT\s+([^,\s]+(?:\([^)]*\))?)/i);
          const defaultValue = defaultMatch ? defaultMatch[1] : undefined;

          // Check for inline REFERENCES target(col)
          const inlineRefMatch = modifiers.match(
            /REFERENCES\s+(?:[`"']?\w+[`"']?\.)?([`"']?\w+[`"']?)\s*\(([`"']?\w+[`"']?)\)(?:\s+ON\s+DELETE\s+([A-Za-z\s]+))?/i
          );
          if (inlineRefMatch) {
            const tgtTable = stripQuotes(inlineRefMatch[1]);
            const tgtCol = stripQuotes(inlineRefMatch[2]);
            const action = normalizeAction(inlineRefMatch[3]);

            pendingForeignKeys.push({
              sourceTableName: rawTableName,
              sourceColName: colName,
              targetTableName: tgtTable,
              targetColName: tgtCol,
              onDelete: action,
            });
          }

          columns.push({
            id: `col_${tableId}_${colName.toLowerCase()}`,
            name: colName,
            type,
            isPrimary,
            isNullable,
            isUnique,
            defaultValue,
          });
        }
      });

      tables.push({
        id: tableId,
        name: rawTableName,
        color: pickTableColor(tables.length),
        columns,
        position: { x: 50 + tables.length * 40, y: 50 + tables.length * 40 },
      });
    }
  });

  if (tables.length === 0 && statements.length > 0) {
    errors.push('No CREATE TABLE statements could be parsed from the provided input.');
  }

  // Resolve pending foreign keys to Relationships
  pendingForeignKeys.forEach((fk) => {
    const srcTable = tables.find((t) => t.name.toLowerCase() === fk.sourceTableName.toLowerCase());
    const tgtTable = tables.find((t) => t.name.toLowerCase() === fk.targetTableName.toLowerCase());

    if (!srcTable || !tgtTable) {
      errors.push(
        `Foreign key target "${fk.targetTableName}" referenced by "${fk.sourceTableName}.${fk.sourceColName}" was not found.`
      );
      return;
    }

    const srcCol = srcTable.columns.find((c) => c.name.toLowerCase() === fk.sourceColName.toLowerCase());
    const tgtCol = tgtTable.columns.find((c) => c.name.toLowerCase() === fk.targetColName.toLowerCase());

    if (!srcCol || !tgtCol) {
      errors.push(
        `Column "${fk.sourceColName}" or "${fk.targetColName}" was not found during foreign key linking.`
      );
      return;
    }

    relationships.push({
      id: `rel_${srcTable.id}_${srcCol.id}_${tgtTable.id}_${tgtCol.id}`,
      sourceTableId: srcTable.id,
      sourceColumnId: srcCol.id,
      targetTableId: tgtTable.id,
      targetColumnId: tgtCol.id,
      cardinality: srcCol.isUnique ? 'ONE_TO_ONE' : 'ONE_TO_MANY',
      onDelete: fk.onDelete || 'CASCADE',
    });
  });

  // Apply auto-layout to give clean positions
  const positionedTables = calculateAutoLayout(tables, relationships, 'LR');

  return {
    tables: positionedTables,
    relationships,
    errors,
  };
}

function stripQuotes(str: string): string {
  return str.replace(/^[`"']|[`"']$/g, '').trim();
}

function normalizeAction(actionStr?: string): 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION' {
  if (!actionStr) return 'CASCADE';
  const clean = actionStr.toUpperCase().replace(/\s+/g, ' ').trim();
  if (clean.includes('SET NULL')) return 'SET NULL';
  if (clean.includes('RESTRICT')) return 'RESTRICT';
  if (clean.includes('NO ACTION')) return 'NO ACTION';
  return 'CASCADE';
}

function normalizeDataType(raw: string): DataType {
  const t = raw.toUpperCase().replace(/\(.*\)/, '').trim();

  if (t === 'UUID') return 'UUID';
  if (t === 'SERIAL' || t === 'SERIAL4') return 'SERIAL';
  if (t === 'BIGSERIAL' || t === 'SERIAL8') return 'BIGSERIAL';
  if (t.includes('INT') && !t.includes('BIG') && !t.includes('SMALL') && !t.includes('TINY')) return 'INTEGER';
  if (t.includes('BIGINT')) return 'BIGINT';
  if (t.includes('SMALLINT')) return 'SMALLINT';
  if (t.includes('VARCHAR') || t.includes('CHAR') && !t.includes('VAR')) return 'VARCHAR';
  if (t.includes('TEXT') || t.includes('CLOB')) return 'TEXT';
  if (t.includes('BOOL') || t === 'TINYINT') return 'BOOLEAN';
  if (t.includes('TIMESTAMP') || t.includes('DATETIME')) return 'TIMESTAMP';
  if (t === 'DATE') return 'DATE';
  if (t === 'TIME') return 'TIME';
  if (t === 'JSON') return 'JSON';
  if (t === 'JSONB') return 'JSONB';
  if (t.includes('DECIMAL') || t.includes('NUMERIC')) return 'DECIMAL';
  if (t === 'REAL' || t === 'FLOAT') return 'REAL';
  if (t.includes('DOUBLE')) return 'DOUBLE';
  if (t.includes('BLOB') || t.includes('BYTEA') || t.includes('BINARY')) return 'BYTEA';

  return 'VARCHAR';
}

function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let insideSingle = false;
  let insideDouble = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'" && !insideDouble) insideSingle = !insideSingle;
    else if (char === '"' && !insideSingle) insideDouble = !insideDouble;

    if (char === ';' && !insideSingle && !insideDouble) {
      if (current.trim()) statements.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

function splitClauses(body: string): string[] {
  const clauses: string[] = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;

    if (char === ',' && parenDepth === 0) {
      if (current.trim()) clauses.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    clauses.push(current.trim());
  }

  return clauses;
}

const PALETTE = ['indigo', 'emerald', 'sky', 'amber', 'rose', 'purple', 'teal'];
function pickTableColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
