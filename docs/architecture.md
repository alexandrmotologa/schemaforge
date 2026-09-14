# Architecture Overview

SchemaForge operates entirely on client devices. It does not require a backend API, database server, or authentication service. This document describes the internal data structures, state management patterns, and layout engine.

## Schema Abstract Syntax Tree (AST)

The visual state and code generators synchronize through a centralized AST data model defined in `src/engine/types.ts`.

### Table Model

Every entity on the canvas maps to a `Table` object:

```typescript
interface Table {
  id: string;
  name: string;
  color?: string;
  comment?: string;
  columns: Column[];
  position: { x: number; y: number };
}
```

### Column Model

Columns define table attributes and constraints:

```typescript
interface Column {
  id: string;
  name: string;
  type: DataType;
  isPrimary: boolean;
  isNullable: boolean;
  isUnique: boolean;
  defaultValue?: string;
  comment?: string;
}
```

### Relationship Model

Relationships connect a source column in one table to a target column in another:

```typescript
interface Relationship {
  id: string;
  sourceTableId: string;
  sourceColumnId: string;
  targetTableId: string;
  targetColumnId: string;
  cardinality: 'ONE_TO_ONE' | 'ONE_TO_MANY' | 'MANY_TO_MANY';
  onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
}
```

## State Management and Undo History

The store (`src/hooks/useSchemaState.ts`) maintains the current schema snapshot along with an immutable undo/redo history stack:

1. User actions (adding a table, renaming a column, changing a relation) push the previous state into the `past` stack.
2. Invoking `undo` pops from `past` and pushes the current state into `future`.
3. Invoking `redo` moves the state forward.
4. Changes automatically persist to `localStorage` under the `schemaforge_workspace_v1` key, preventing accidental work loss across page refreshes.

## Graph Layout Pipeline

SchemaForge integrates `@dagrejs/dagre` in `src/engine/autoLayout.ts` to arrange table nodes hierarchically:

1. Each table is registered as a graph node with calculated dimensions based on its column count.
2. Relationships are registered as directed edges pointing from the referencing table (foreign key holder) to the referenced table (primary key target).
3. Dagre calculates optimal rank separations and coordinates.
4. The canvas updates node positions with animated transitions.
