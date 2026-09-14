import { describe, it, expect } from 'vitest';
import { SchemaState } from '../engine/types';
import { generatePostgreSql } from '../engine/generators/postgresGen';
import { generateSqliteDdl } from '../engine/generators/sqliteGen';
import { generateMySql } from '../engine/generators/mysqlGen';
import { generatePrismaSchema } from '../engine/generators/prismaGen';
import { generateDrizzleSchema } from '../engine/generators/drizzleGen';
import { generateMermaidErDiagram } from '../engine/generators/mermaidGen';
import { generateMockDataSql } from '../engine/mockDataGen';

const mockSchema: SchemaState = {
  tables: [
    {
      id: 'table_users',
      name: 'users',
      position: { x: 0, y: 0 },
      columns: [
        { id: 'col_u_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
        { id: 'col_u_email', name: 'email', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: true },
      ],
    },
    {
      id: 'table_posts',
      name: 'posts',
      position: { x: 300, y: 0 },
      columns: [
        { id: 'col_p_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
        { id: 'col_p_author_id', name: 'author_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
        { id: 'col_p_title', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
      ],
    },
  ],
  relationships: [
    {
      id: 'rel_posts_users',
      sourceTableId: 'table_posts',
      sourceColumnId: 'col_p_author_id',
      targetTableId: 'table_users',
      targetColumnId: 'col_u_id',
      cardinality: 'ONE_TO_MANY',
      onDelete: 'CASCADE',
    },
  ],
};

describe('Code Generators', () => {
  it('generates PostgreSQL DDL with foreign keys', () => {
    const sql = generatePostgreSql(mockSchema);
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "posts"');
    expect(sql).toContain('ALTER TABLE "posts" ADD CONSTRAINT');
    expect(sql).toContain('REFERENCES "users" ("id") ON DELETE CASCADE');
  });

  it('generates SQLite DDL with inline table-level foreign keys', () => {
    const sql = generateSqliteDdl(mockSchema);
    expect(sql).toContain('PRAGMA foreign_keys = ON;');
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS "users"');
    expect(sql).toContain('FOREIGN KEY ("author_id") REFERENCES "users" ("id") ON DELETE CASCADE');
  });

  it('generates MySQL DDL with InnoDB engine', () => {
    const sql = generateMySql(mockSchema);
    expect(sql).toContain('ENGINE=InnoDB');
    expect(sql).toContain('`users`');
    expect(sql).toContain('`posts`');
    expect(sql).toContain('FOREIGN KEY (`author_id`) REFERENCES `users` (`id`)');
  });

  it('generates Prisma schema with relations', () => {
    const prisma = generatePrismaSchema(mockSchema);
    expect(prisma).toContain('model User');
    expect(prisma).toContain('model Post');
    expect(prisma).toContain('@relation(fields: [author_id], references: [id]');
    expect(prisma).toContain('posts            Post[]');
  });

  it('generates Drizzle ORM schemas and relations', () => {
    const drizzle = generateDrizzleSchema(mockSchema);
    expect(drizzle).toContain("export const users = pgTable('users'");
    expect(drizzle).toContain("export const posts = pgTable('posts'");
    expect(drizzle).toContain(".references(() => users.id, { onDelete: 'cascade' })");
  });

  it('generates Mermaid ER diagram', () => {
    const mermaid = generateMermaidErDiagram(mockSchema);
    expect(mermaid).toContain('erDiagram');
    expect(mermaid).toContain('USERS ||--o{ POSTS : "references"');
    expect(mermaid).toContain('uuid id PK');
  });

  it('generates mock data SQL inserts', () => {
    const mockSql = generateMockDataSql(mockSchema.tables[0], 3);
    expect(mockSql).toContain('INSERT INTO "users" ("id", "email") VALUES');
  });
});
