import { describe, it, expect } from 'vitest';
import { parseSqlDdl } from '../engine/sqlParser';

describe('SQL DDL Parser', () => {
  it('parses basic CREATE TABLE statement', () => {
    const sql = `
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        age INTEGER,
        created_at TIMESTAMP
      );
    `;

    const result = parseSqlDdl(sql);
    expect(result.tables).toHaveLength(1);
    expect(result.tables[0].name).toBe('users');
    expect(result.tables[0].columns).toHaveLength(4);

    const idCol = result.tables[0].columns.find((c) => c.name === 'id');
    expect(idCol?.isPrimary).toBe(true);
    expect(idCol?.type).toBe('UUID');

    const emailCol = result.tables[0].columns.find((c) => c.name === 'email');
    expect(emailCol?.isNullable).toBe(false);
    expect(emailCol?.isUnique).toBe(true);
  });

  it('parses table-level primary key and foreign key references', () => {
    const sql = `
      CREATE TABLE departments (
        id UUID PRIMARY KEY,
        name VARCHAR(100) NOT NULL
      );

      CREATE TABLE employees (
        id UUID NOT NULL,
        dept_id UUID NOT NULL,
        name VARCHAR(100) NOT NULL,
        PRIMARY KEY (id),
        CONSTRAINT fk_emp_dept FOREIGN KEY (dept_id) REFERENCES departments(id) ON DELETE CASCADE
      );
    `;

    const result = parseSqlDdl(sql);
    expect(result.tables).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);

    const rel = result.relationships[0];
    const empTable = result.tables.find((t) => t.name === 'employees');
    const deptTable = result.tables.find((t) => t.name === 'departments');

    expect(rel.sourceTableId).toBe(empTable?.id);
    expect(rel.targetTableId).toBe(deptTable?.id);
    expect(rel.onDelete).toBe('CASCADE');
  });

  it('handles inline REFERENCES clause', () => {
    const sql = `
      CREATE TABLE authors (
        id UUID PRIMARY KEY,
        name TEXT
      );

      CREATE TABLE books (
        id UUID PRIMARY KEY,
        author_id UUID REFERENCES authors(id) ON DELETE SET NULL,
        title TEXT
      );
    `;

    const result = parseSqlDdl(sql);
    expect(result.tables).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].onDelete).toBe('SET NULL');
  });
});
