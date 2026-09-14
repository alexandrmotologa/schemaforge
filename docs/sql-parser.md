# SQL Parser Guide

The SchemaForge SQL importer converts raw DDL into visual canvas nodes and foreign key relationships.

## Supported SQL Constructs

The parser recognizes standard ANSI SQL and dialect-specific statements:

### 1. Table Definitions

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(120),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Table-level Constraints

```sql
CREATE TABLE orders (
  id UUID NOT NULL,
  user_id UUID NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 3. Inline References

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT
);
```

## How the Parser Works

1. **Tokenization and Statement Splitting:** Splits multi-statement DDL by semicolons while preserving quoted literals.
2. **Table Extraction:** Reads the table identifier, checking for optional quotes or prefixes like `public.`.
3. **Column Extraction:** Parses each comma-separated line within parentheses, extracting the column name, data type, and modifiers (`NOT NULL`, `PRIMARY KEY`, `UNIQUE`, `DEFAULT`).
4. **Foreign Key Extraction:** Detects both inline `REFERENCES` and table-level `FOREIGN KEY (...) REFERENCES ...` clauses.
5. **Graph Generation:** Maps tables to canvas nodes, assigns layout coordinates, and establishes visual relationship edges.
