import { SchemaState, Table } from '../types';
import { generateMermaidErDiagram } from './mermaidGen';

export function generateDataDictionaryMarkdown(schema: SchemaState): string {
  const parts: string[] = [];

  const totalTables = schema.tables.length;
  const totalColumns = schema.tables.reduce((acc, t) => acc + t.columns.length, 0);
  const totalRelationships = schema.relationships.length;
  const totalIndexes = schema.tables.reduce(
    (acc, t) => acc + (t.indexes ? t.indexes.length : 0),
    0
  );

  // Header & Metadata
  parts.push('# Database Schema Data Dictionary');
  parts.push('');
  parts.push(`> Generated automatically by **SchemaForge Studio** on ${new Date().toUTCString()}`);
  parts.push('');
  parts.push('## Executive Summary');
  parts.push('');
  parts.push('| Metric | Value |');
  parts.push('| :--- | :--- |');
  parts.push(`| **Total Tables** | ${totalTables} |`);
  parts.push(`| **Total Columns** | ${totalColumns} |`);
  parts.push(`| **Total Foreign Keys** | ${totalRelationships} |`);
  parts.push(`| **Total Indexes** | ${totalIndexes} |`);
  parts.push('');

  // Table of Contents
  parts.push('## Table of Contents');
  parts.push('');
  schema.tables.forEach((table) => {
    parts.push(`- [${table.name}](#table-${table.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}) — *${table.columns.length} columns*`);
  });
  parts.push('');

  // Embedded Mermaid ERD Diagram
  parts.push('## Entity-Relationship Diagram (ERD)');
  parts.push('');
  parts.push('```mermaid');
  parts.push(generateMermaidErDiagram(schema));
  parts.push('```');
  parts.push('');

  // Table Details
  parts.push('## Data Dictionary Catalog');
  parts.push('');

  schema.tables.forEach((table) => {
    parts.push(generateTableDocumentation(table, schema));
    parts.push('');
    parts.push('---');
    parts.push('');
  });

  return parts.join('\n');
}

function generateTableDocumentation(table: Table, schema: SchemaState): string {
  const lines: string[] = [];

  lines.push(`### <a id="table-${table.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}"></a>Table: \`${table.name}\``);
  lines.push('');

  if (table.comment) {
    lines.push(`**Description:** ${table.comment}`);
    lines.push('');
  }

  // Columns Markdown Table
  lines.push('#### Columns');
  lines.push('');
  lines.push('| Column | Type | Nullable | Primary Key | Unique | Default | Comment |');
  lines.push('| :--- | :--- | :---: | :---: | :---: | :--- | :--- |');

  table.columns.forEach((col) => {
    const isPk = col.isPrimary ? '🔑 Yes' : 'No';
    const isNullable = col.isNullable ? 'Yes' : 'No';
    const isUnique = col.isUnique ? 'Yes' : 'No';
    const def = col.defaultValue ? `\`${col.defaultValue}\`` : '-';
    const comment = col.comment || '-';

    lines.push(
      `| **\`${col.name}\`** | \`${col.type}\` | ${isNullable} | ${isPk} | ${isUnique} | ${def} | ${comment} |`
    );
  });
  lines.push('');

  // Indexes Section
  if (table.indexes && table.indexes.length > 0) {
    lines.push('#### Indexes');
    lines.push('');
    lines.push('| Index Name | Columns | Method | Unique |');
    lines.push('| :--- | :--- | :---: | :---: |');
    table.indexes.forEach((idx) => {
      const uq = idx.isUnique ? '⚡ Yes' : 'No';
      lines.push(`| \`${idx.name}\` | \`${idx.columns.join(', ')}\` | ${idx.type || 'BTREE'} | ${uq} |`);
    });
    lines.push('');
  }

  // Foreign Key Relationships
  const outgoing = schema.relationships.filter((r) => r.sourceTableId === table.id);
  const incoming = schema.relationships.filter((r) => r.targetTableId === table.id);

  if (outgoing.length > 0 || incoming.length > 0) {
    lines.push('#### Referential Integrity');
    lines.push('');

    if (outgoing.length > 0) {
      lines.push('**Outgoing Foreign Keys (References):**');
      outgoing.forEach((rel) => {
        const targetTable = schema.tables.find((t) => t.id === rel.targetTableId);
        const sourceCol = table.columns.find((c) => c.id === rel.sourceColumnId);
        const targetCol = targetTable?.columns.find((c) => c.id === rel.targetColumnId);
        lines.push(
          `- \`${table.name}.${sourceCol?.name}\` ➔ \`${targetTable?.name}.${targetCol?.name}\` (Cardinality: \`${rel.cardinality}\`, ON DELETE: \`${rel.onDelete || 'CASCADE'}\`, ON UPDATE: \`${rel.onUpdate || 'NO ACTION'}\`)`
        );
      });
      lines.push('');
    }

    if (incoming.length > 0) {
      lines.push('**Referenced By (Incoming Foreign Keys):**');
      incoming.forEach((rel) => {
        const sourceTable = schema.tables.find((t) => t.id === rel.sourceTableId);
        const sourceCol = sourceTable?.columns.find((c) => c.id === rel.sourceColumnId);
        const targetCol = table.columns.find((c) => c.id === rel.targetColumnId);
        lines.push(
          `- Referenced by \`${sourceTable?.name}.${sourceCol?.name}\` targeting \`${table.name}.${targetCol?.name}\``
        );
      });
      lines.push('');
    }
  }

  return lines.join('\n');
}
