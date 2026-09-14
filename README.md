# SchemaForge

SchemaForge is an interactive visual database schema designer and Entity-Relationship Diagram (ERD) studio. It runs entirely in the browser without server dependencies, letting engineers design relational tables, connect foreign keys on a canvas, and export schemas directly to SQL, Prisma, and Drizzle ORM.

![SchemaForge Studio](public/favicon.svg)

## Capabilities

- **Interactive visual canvas:** Drag, zoom, pan, and arrange tables. Connect columns directly via handles to define foreign key relationships and cardinalities (1:1, 1:N, N:M).
- **Bi-directional SQL parser:** Paste existing `CREATE TABLE` DDL to generate visual tables and relation edges automatically.
- **Multi-target code generators:** Export synchronized schema definitions to PostgreSQL, SQLite, MySQL, Prisma ORM (`schema.prisma`), Drizzle ORM (TypeScript), and Mermaid.js ERD.
- **Hierarchical auto-layout:** One-click Dagre graph layout organizes complex schemas without overlapping edges.
- **Live schema diagnostics:** Real-time linter flags missing primary keys, dangling foreign keys, naming collisions, and type mismatches.
- **Synthetic mock data generation:** Generate test fixtures in SQL `INSERT` statements or JSON records based on table structures and column types.
- **High-resolution image export:** Save diagrams as PNG or vector SVG files.
- **Built-in template gallery:** Explore reference architectures for E-Commerce, Multi-Tenant B2B Auth (RBAC), and FinTech Ledgers.

## Supported Data Types

| Category | Types |
| :--- | :--- |
| Identifiers & Integers | `UUID`, `SERIAL`, `BIGSERIAL`, `INTEGER`, `BIGINT`, `SMALLINT` |
| Strings & Text | `VARCHAR`, `TEXT`, `CHAR` |
| Floating-Point & Numeric | `DECIMAL`, `NUMERIC`, `REAL`, `DOUBLE PRECISION` |
| Dates & Times | `TIMESTAMP`, `TIMESTAMPTZ`, `DATE`, `TIME` |
| Structured & Logic | `BOOLEAN`, `JSON`, `JSONB`, `BYTEA` |

## Quick Start

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Installation

```bash
git clone https://github.com/alexandrmotologa/schemaforge.git
cd schemaforge
npm install
```

### Development Server

Start the local development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### Production Build

Compile the application for production:

```bash
npm run build
```

The output files are generated in the `dist/` directory.

### Run Tests

Execute the unit test suite with Vitest:

```bash
npm test
```

## Documentation

Detailed documentation is available in the `docs/` folder:

- [Architecture Overview](docs/architecture.md): AST data structures, layout engine, and state management.
- [Code Generators](docs/generators.md): Specifications for PostgreSQL, SQLite, MySQL, Prisma, Drizzle, and Mermaid targets.
- [SQL Parser Guide](docs/sql-parser.md): Supported SQL DDL syntax, constraints, and limitations.
- [Contributing](docs/contributing.md): Setup instructions and coding conventions.

## License

MIT License. Copyright (c) 2026 alexandrmotologa.
