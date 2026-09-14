export type DataType =
  | 'UUID'
  | 'SERIAL'
  | 'BIGSERIAL'
  | 'INTEGER'
  | 'BIGINT'
  | 'SMALLINT'
  | 'VARCHAR'
  | 'TEXT'
  | 'BOOLEAN'
  | 'TIMESTAMP'
  | 'TIMESTAMPTZ'
  | 'DATE'
  | 'TIME'
  | 'JSON'
  | 'JSONB'
  | 'DECIMAL'
  | 'NUMERIC'
  | 'REAL'
  | 'DOUBLE'
  | 'BYTEA';

export interface Column {
  id: string;
  name: string;
  type: DataType;
  isPrimary: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  comment?: string;
}

export interface Table {
  id: string;
  name: string;
  color?: string;
  comment?: string;
  columns: Column[];
  position: { x: number; y: number };
}

export type Cardinality = 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
export type ReferentialAction = 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';

export interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  cardinality: Cardinality;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

export interface SchemaState {
  tables: Table[];
  relationships: Relationship[];
}

export interface Diagnostic {
  id: string;
  severity: 'error' | 'warning' | 'info';
  tableId?: string;
  columnId?: string;
  tableName?: string;
  columnName?: string;
  message: string;
  rule: string;
}

export type CodeExportTarget =
  | 'postgres'
  | 'sqlite'
  | 'mysql'
  | 'prisma'
  | 'drizzle'
  | 'mermaid'
  | 'mockData';
