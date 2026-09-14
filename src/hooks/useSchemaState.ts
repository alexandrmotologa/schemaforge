import { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Column, Relationship, SchemaState, Diagnostic } from '../engine/types';
import { ecommerceSample } from '../samples/ecommerce';
import { SAMPLES } from '../samples';
import { calculateAutoLayout } from '../engine/autoLayout';
import { lintSchema } from '../engine/linter';

const STORAGE_KEY = 'schemaforge_workspace_v1';

export function useSchemaState() {
  // Initialize state from LocalStorage or fallback to eCommerce sample
  const [present, setPresent] = useState<SchemaState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.tables && parsed.relationships) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved schema', e);
    }
    return ecommerceSample;
  });

  const [past, setPast] = useState<SchemaState[]>([]);
  const [future, setFuture] = useState<SchemaState[]>([]);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(present));
    } catch (e) {
      console.error('Failed to persist schema', e);
    }
  }, [present]);

  // Push new state with undo tracking
  const pushState = useCallback(
    (updater: (curr: SchemaState) => SchemaState) => {
      setPresent((current) => {
        const next = updater(current);
        if (JSON.stringify(current) === JSON.stringify(next)) {
          return current;
        }
        setPast((prevPast) => [...prevPast.slice(-30), current]);
        setFuture([]);
        return next;
      });
    },
    []
  );

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);

    setFuture((prevFuture) => [present, ...prevFuture]);
    setPast(newPast);
    setPresent(previous);
  }, [past, present]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prevPast) => [...prevPast, present]);
    setFuture(newFuture);
    setPresent(next);
  }, [future, present]);

  // Table operations
  const addTable = useCallback(
    (name: string, color = 'indigo') => {
      pushState((curr) => {
        const newTable: Table = {
          id: `table_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          name: name.trim().toLowerCase().replace(/\s+/g, '_') || 'new_table',
          color,
          position: {
            x: 100 + (curr.tables.length % 5) * 60,
            y: 100 + (curr.tables.length % 5) * 60,
          },
          columns: [
            {
              id: `col_${Date.now()}_id`,
              name: 'id',
              type: 'UUID',
              isPrimary: true,
              isNullable: false,
              isUnique: true,
              defaultValue: 'gen_random_uuid()',
            },
          ],
        };
        return {
          ...curr,
          tables: [...curr.tables, newTable],
        };
      });
    },
    [pushState]
  );

  const updateTable = useCallback(
    (id: string, updates: Partial<Table>) => {
      pushState((curr) => ({
        ...curr,
        tables: curr.tables.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      }));
    },
    [pushState]
  );

  const deleteTable = useCallback(
    (id: string) => {
      pushState((curr) => ({
        ...curr,
        tables: curr.tables.filter((t) => t.id !== id),
        relationships: curr.relationships.filter(
          (r) => r.sourceTableId !== id && r.targetTableId !== id
        ),
      }));
    },
    [pushState]
  );

  const setTablePosition = useCallback(
    (id: string, position: { x: number; y: number }) => {
      setPresent((curr) => ({
        ...curr,
        tables: curr.tables.map((t) => (t.id === id ? { ...t, position } : t)),
      }));
    },
    []
  );

  // Column operations
  const addColumn = useCallback(
    (tableId: string, colData?: Partial<Column>) => {
      pushState((curr) => ({
        ...curr,
        tables: curr.tables.map((t) => {
          if (t.id !== tableId) return t;
          const colNum = t.columns.length + 1;
          const newCol: Column = {
            id: `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: colData?.name || `column_${colNum}`,
            type: colData?.type || 'VARCHAR',
            isPrimary: colData?.isPrimary ?? false,
            isNullable: colData?.isNullable ?? true,
            isUnique: colData?.isUnique ?? false,
            defaultValue: colData?.defaultValue,
          };
          return {
            ...t,
            columns: [...t.columns, newCol],
          };
        }),
      }));
    },
    [pushState]
  );

  const updateColumn = useCallback(
    (tableId: string, columnId: string, updates: Partial<Column>) => {
      pushState((curr) => ({
        ...curr,
        tables: curr.tables.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            columns: t.columns.map((c) => (c.id === columnId ? { ...c, ...updates } : c)),
          };
        }),
      }));
    },
    [pushState]
  );

  const deleteColumn = useCallback(
    (tableId: string, columnId: string) => {
      pushState((curr) => ({
        ...curr,
        tables: curr.tables.map((t) => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            columns: t.columns.filter((c) => c.id !== columnId),
          };
        }),
        relationships: curr.relationships.filter(
          (r) =>
            !(r.sourceTableId === tableId && r.sourceColumnId === columnId) &&
            !(r.targetTableId === tableId && r.targetColumnId === columnId)
        ),
      }));
    },
    [pushState]
  );

  // Relationship operations
  const addRelationship = useCallback(
    (rel: Omit<Relationship, 'id'>) => {
      // Prevent self referencing exact same column or duplicates
      if (
        rel.sourceTableId === rel.targetTableId &&
        rel.sourceColumnId === rel.targetColumnId
      ) {
        return;
      }

      pushState((curr) => {
        const exists = curr.relationships.some(
          (r) =>
            r.sourceTableId === rel.sourceTableId &&
            r.sourceColumnId === rel.sourceColumnId &&
            r.targetTableId === rel.targetTableId &&
            r.targetColumnId === rel.targetColumnId
        );
        if (exists) return curr;

        const newRel: Relationship = {
          ...rel,
          id: `rel_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        };

        return {
          ...curr,
          relationships: [...curr.relationships, newRel],
        };
      });
    },
    [pushState]
  );

  const deleteRelationship = useCallback(
    (id: string) => {
      pushState((curr) => ({
        ...curr,
        relationships: curr.relationships.filter((r) => r.id !== id),
      }));
    },
    [pushState]
  );

  // Auto layout
  const triggerAutoLayout = useCallback(
    (direction: 'LR' | 'TB' = 'LR') => {
      pushState((curr) => ({
        ...curr,
        tables: calculateAutoLayout(curr.tables, curr.relationships, direction),
      }));
    },
    [pushState]
  );

  // Sample and import loading
  const loadSample = useCallback(
    (sampleId: string) => {
      const sample = SAMPLES.find((s) => s.id === sampleId);
      if (sample) {
        pushState(() => sample.data);
      }
    },
    [pushState]
  );

  const importSchema = useCallback(
    (schema: SchemaState) => {
      pushState(() => schema);
    },
    [pushState]
  );

  const clearSchema = useCallback(() => {
    pushState(() => ({ tables: [], relationships: [] }));
  }, [pushState]);

  // Diagnostics
  const diagnostics: Diagnostic[] = useMemo(() => {
    return lintSchema(present);
  }, [present]);

  return {
    tables: present.tables,
    relationships: present.relationships,
    diagnostics,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    addTable,
    updateTable,
    deleteTable,
    setTablePosition,
    addColumn,
    updateColumn,
    deleteColumn,
    addRelationship,
    deleteRelationship,
    triggerAutoLayout,
    loadSample,
    importSchema,
    clearSchema,
  };
}
