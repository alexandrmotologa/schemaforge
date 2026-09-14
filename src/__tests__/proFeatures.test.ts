import { describe, it, expect } from 'vitest';
import { SchemaState, Table } from '../engine/types';
import { generatePostgreSql } from '../engine/generators/postgresGen';
import { generateSqliteDdl } from '../engine/generators/sqliteGen';
import { generateMySql } from '../engine/generators/mysqlGen';
import { generatePrismaSchema } from '../engine/generators/prismaGen';
import { generateDrizzleSchema } from '../engine/generators/drizzleGen';
import { generateDataDictionaryMarkdown } from '../engine/generators/dataDictionaryGen';
import { generateMockDataCsv, generateAllTablesMockJson } from '../engine/mockDataGen';

const indexedSchema: SchemaState = {
  tables: [
    {
      id: 'table_users',
      name: 'users',
      position: { x: 0, y: 0 },
      columns: [
        { id: 'u_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
        { id: 'u_email', name: 'email', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: true },
        { id: 'u_tenant', name: 'tenant_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
      ],
      indexes: [
        { id: 'idx_users_email', name: 'idx_users_email', columns: ['email'], isUnique: true },
        { id: 'idx_users_tenant_email', name: 'idx_users_tenant_email', columns: ['tenant_id', 'email'], isUnique: false },
      ],
    },
  ],
  relationships: [],
};

describe('Pro Features & Enhancements', () => {
  describe('Indexes Generation across Dialects', () => {
    it('generates PostgreSQL single and composite indexes', () => {
      const sql = generatePostgreSql(indexedSchema);
      expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS "idx_users_tenant_email" ON "users" ("tenant_id", "email");');
    });

    it('generates SQLite single and composite indexes', () => {
      const sql = generateSqliteDdl(indexedSchema);
      expect(sql).toContain('CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");');
      expect(sql).toContain('CREATE INDEX IF NOT EXISTS "idx_users_tenant_email" ON "users" ("tenant_id", "email");');
    });

    it('generates MySQL inline keys', () => {
      const sql = generateMySql(indexedSchema);
      expect(sql).toContain('UNIQUE KEY `idx_users_email` (`email`)');
      expect(sql).toContain('KEY `idx_users_tenant_email` (`tenant_id`, `email`)');
    });

    it('generates Prisma @@index and @@unique attributes', () => {
      const prisma = generatePrismaSchema(indexedSchema);
      expect(prisma).toContain('@@unique([email], map: "idx_users_email")');
      expect(prisma).toContain('@@index([tenant_id, email], map: "idx_users_tenant_email")');
    });

    it('generates Drizzle ORM index definitions', () => {
      const drizzle = generateDrizzleSchema(indexedSchema);
      expect(drizzle).toContain("uniqueIndex('idx_users_email').on(table.email)");
      expect(drizzle).toContain("index('idx_users_tenant_email').on(table.tenantId, table.email)");
    });
  });

  describe('Data Dictionary Generator', () => {
    it('generates complete markdown documentation with statistics, tables, and Mermaid ERD', () => {
      const md = generateDataDictionaryMarkdown(indexedSchema);
      expect(md).toContain('# Database Schema Data Dictionary');
      expect(md).toContain('| **Total Tables** | 1 |');
      expect(md).toContain('| **Total Columns** | 3 |');
      expect(md).toContain('| **Total Indexes** | 2 |');
      expect(md).toContain('```mermaid');
      expect(md).toContain('Table: `users`');
      expect(md).toContain('`idx_users_email`');
      expect(md).toContain('`tenant_id, email`');
    });
  });

  describe('Mock Data CSV & JSON Seeder', () => {
    it('generates well-formatted CSV with headers and row values', () => {
      const csv = generateMockDataCsv(indexedSchema.tables[0], 5);
      const lines = csv.split('\n');
      expect(lines.length).toBe(6); // 1 header + 5 rows
      expect(lines[0]).toBe('"id","email","tenant_id"');
      expect(lines[1]).toContain('@example.com');
    });

    it('generates JSON seeder for all tables', () => {
      const json = generateAllTablesMockJson(indexedSchema, 3);
      expect(json).toHaveProperty('users');
      expect(json.users.length).toBe(3);
      expect(json.users[0]).toHaveProperty('id');
      expect(json.users[0]).toHaveProperty('email');
    });
  });
});
