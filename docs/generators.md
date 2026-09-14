# Code Generators

SchemaForge converts the internal schema AST into multiple target dialects and formats.

## Supported Dialects

### 1. PostgreSQL DDL

The PostgreSQL generator produces valid SQL statements including:
- `CREATE TABLE IF NOT EXISTS "table_name"`
- `PRIMARY KEY` and `UNIQUE` constraints
- Column default values, such as `gen_random_uuid()` for UUID primary keys and `CURRENT_TIMESTAMP` for timestamps
- Explicit foreign key constraints with `REFERENCES` and `ON DELETE` actions
- Table and column comments using `COMMENT ON`

### 2. SQLite DDL

The SQLite generator outputs statements compatible with SQLite 3:
- Primary keys defined inline or table-level
- Type affinities mapped to `INTEGER`, `TEXT`, `REAL`, or `BLOB`
- Foreign keys with `REFERENCES` clauses formatted for SQLite foreign key pragma support

### 3. MySQL DDL

The MySQL generator produces DDL optimized for MySQL 8.0+:
- Backtick quoted identifiers
- `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
- `AUTO_INCREMENT` for integer primary keys
- Foreign key constraints with explicit index creation

### 4. Prisma ORM (`schema.prisma`)

The Prisma generator generates standard Prisma model declarations:
- Model names converted to PascalCase singular format
- `@id`, `@default(uuid())`, `@default(autoincrement())`, `@default(now())` attributes
- Typed relation fields: `user User @relation(fields: [user_id], references: [id], onDelete: Cascade)`
- Opposite relation arrays: `posts Post[]`

### 5. Drizzle ORM (TypeScript)

The Drizzle generator produces idiomatic Drizzle schemas using the PostgreSQL module:
- Imports `pgTable`, `uuid`, `text`, `varchar`, `integer`, `timestamp`, `boolean`, `jsonb`
- Foreign key references chained with `.references(() => users.id, { onDelete: 'cascade' })`
- Primary key and default value declarations

### 6. Mermaid.js ERD

Generates Mermaid markdown diagrams for documentation:
- Syntax: `erDiagram`
- Entities and attributes with visibility markers (`PK`, `FK`, `UK`)
- Relation lines reflecting cardinality (`||--o{`, `||--||`, `}|--|{`)
