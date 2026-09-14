import React, { useState, useEffect } from 'react';
import { SchemaState, Table, Relationship } from '../engine/types';
import { applyAutoLayout } from '../engine/autoLayout';
import {
  Sparkles,
  X,
  Wand2,
  Layers,
  ArrowRight,
  Flame,
  Check,
  Plus,
} from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplySchema: (newSchema: SchemaState, mode: 'replace' | 'append') => void;
}

interface PromptPreset {
  id: string;
  title: string;
  description: string;
  badge: string;
  prompt: string;
  schema: SchemaState;
}

const PRESET_ARCHITECTURES: PromptPreset[] = [
  {
    id: 'streaming',
    title: 'Media Streaming & Playlists (Spotify/Netflix)',
    description: 'Track media items, user playlists, subscriptions, and playback watch history.',
    badge: 'Entertainment',
    prompt: 'Design a media streaming platform with users, media_items, playlists, playlist_items, and watch_history.',
    schema: {
      tables: [
        {
          id: 'table_users',
          name: 'users',
          color: 'indigo',
          position: { x: 50, y: 50 },
          columns: [
            { id: 'u_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'u_email', name: 'email', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: true },
            { id: 'u_tier', name: 'subscription_tier', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false, defaultValue: "'free'" },
            { id: 'u_created', name: 'created_at', type: 'TIMESTAMPTZ', isPrimary: false, isNullable: false, isUnique: false },
          ],
          indexes: [{ id: 'idx_u_email', name: 'idx_users_email', columns: ['email'], isUnique: true }],
        },
        {
          id: 'table_media',
          name: 'media_items',
          color: 'purple',
          position: { x: 450, y: 50 },
          columns: [
            { id: 'm_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'm_title', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'm_duration', name: 'duration_seconds', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'm_url', name: 'stream_url', type: 'TEXT', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'm_genre', name: 'genre', type: 'VARCHAR', isPrimary: false, isNullable: true, isUnique: false },
          ],
        },
        {
          id: 'table_playlists',
          name: 'playlists',
          color: 'sky',
          position: { x: 50, y: 350 },
          columns: [
            { id: 'p_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'p_user_id', name: 'user_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'p_name', name: 'name', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'p_is_public', name: 'is_public', type: 'BOOLEAN', isPrimary: false, isNullable: false, isUnique: false, defaultValue: 'TRUE' },
          ],
        },
        {
          id: 'table_playlist_items',
          name: 'playlist_items',
          color: 'teal',
          position: { x: 450, y: 350 },
          columns: [
            { id: 'pi_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'pi_playlist_id', name: 'playlist_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'pi_media_id', name: 'media_item_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'pi_pos', name: 'position', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false },
          ],
        },
        {
          id: 'table_history',
          name: 'watch_history',
          color: 'rose',
          position: { x: 250, y: 650 },
          columns: [
            { id: 'wh_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'wh_user_id', name: 'user_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'wh_media_id', name: 'media_item_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'wh_progress', name: 'progress_seconds', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'wh_watched_at', name: 'watched_at', type: 'TIMESTAMPTZ', isPrimary: false, isNullable: false, isUnique: false },
          ],
        },
      ],
      relationships: [
        { id: 'rel_pl_user', sourceTableId: 'table_playlists', sourceColumnId: 'p_user_id', targetTableId: 'table_users', targetColumnId: 'u_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_pi_pl', sourceTableId: 'table_playlist_items', sourceColumnId: 'pi_playlist_id', targetTableId: 'table_playlists', targetColumnId: 'p_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_pi_media', sourceTableId: 'table_playlist_items', sourceColumnId: 'pi_media_id', targetTableId: 'table_media', targetColumnId: 'm_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_wh_user', sourceTableId: 'table_history', sourceColumnId: 'wh_user_id', targetTableId: 'table_users', targetColumnId: 'u_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_wh_media', sourceTableId: 'table_history', sourceColumnId: 'wh_media_id', targetTableId: 'table_media', targetColumnId: 'm_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
      ],
    },
  },
  {
    id: 'lms',
    title: 'E-Learning Academy & LMS',
    description: 'Courses, instructional lessons, student enrollments, and quiz assessments.',
    badge: 'Education',
    prompt: 'Design an e-learning platform with courses, lessons, students, enrollments, and quiz_attempts.',
    schema: {
      tables: [
        {
          id: 't_students',
          name: 'students',
          color: 'emerald',
          position: { x: 50, y: 50 },
          columns: [
            { id: 'st_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'st_name', name: 'full_name', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'st_email', name: 'email', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: true },
          ],
        },
        {
          id: 't_courses',
          name: 'courses',
          color: 'indigo',
          position: { x: 450, y: 50 },
          columns: [
            { id: 'c_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'c_title', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'c_slug', name: 'slug', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: true },
            { id: 'c_price', name: 'price', type: 'DECIMAL', isPrimary: false, isNullable: false, isUnique: false, defaultValue: '0.00' },
          ],
        },
        {
          id: 't_lessons',
          name: 'lessons',
          color: 'sky',
          position: { x: 450, y: 350 },
          columns: [
            { id: 'l_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'l_course_id', name: 'course_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'l_title', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'l_order', name: 'order_index', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false },
          ],
        },
        {
          id: 't_enrollments',
          name: 'enrollments',
          color: 'amber',
          position: { x: 50, y: 350 },
          columns: [
            { id: 'en_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'en_student_id', name: 'student_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'en_course_id', name: 'course_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'en_status', name: 'status', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false, defaultValue: "'active'" },
            { id: 'en_progress', name: 'progress_percent', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false, defaultValue: '0' },
          ],
        },
      ],
      relationships: [
        { id: 'rel_les_course', sourceTableId: 't_lessons', sourceColumnId: 'l_course_id', targetTableId: 't_courses', targetColumnId: 'c_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_enr_student', sourceTableId: 't_enrollments', sourceColumnId: 'en_student_id', targetTableId: 't_students', targetColumnId: 'st_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_enr_course', sourceTableId: 't_enrollments', sourceColumnId: 'en_course_id', targetTableId: 't_courses', targetColumnId: 'c_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
      ],
    },
  },
  {
    id: 'food_delivery',
    title: 'Food Delivery & On-Demand Dispatch',
    description: 'Restaurants, menu dishes, customer orders, couriers, and delivery tracking.',
    badge: 'Logistics',
    prompt: 'Create a delivery app with restaurants, menu_items, customers, orders, order_items, and deliveries.',
    schema: {
      tables: [
        {
          id: 't_rest',
          name: 'restaurants',
          color: 'amber',
          position: { x: 50, y: 50 },
          columns: [
            { id: 'r_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'r_name', name: 'name', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'r_city', name: 'city', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'r_rating', name: 'rating', type: 'DECIMAL', isPrimary: false, isNullable: true, isUnique: false },
          ],
        },
        {
          id: 't_menu',
          name: 'menu_items',
          color: 'rose',
          position: { x: 450, y: 50 },
          columns: [
            { id: 'mi_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'mi_rest_id', name: 'restaurant_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'mi_title', name: 'title', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'mi_price', name: 'price', type: 'DECIMAL', isPrimary: false, isNullable: false, isUnique: false },
          ],
        },
        {
          id: 't_orders',
          name: 'orders',
          color: 'indigo',
          position: { x: 50, y: 350 },
          columns: [
            { id: 'o_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'o_rest_id', name: 'restaurant_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'o_total', name: 'total_amount', type: 'DECIMAL', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'o_status', name: 'status', type: 'VARCHAR', isPrimary: false, isNullable: false, isUnique: false, defaultValue: "'pending'" },
          ],
        },
        {
          id: 't_order_items',
          name: 'order_items',
          color: 'teal',
          position: { x: 450, y: 350 },
          columns: [
            { id: 'oi_id', name: 'id', type: 'UUID', isPrimary: true, isNullable: false, isUnique: true },
            { id: 'oi_order_id', name: 'order_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'oi_menu_id', name: 'menu_item_id', type: 'UUID', isPrimary: false, isNullable: false, isUnique: false },
            { id: 'oi_qty', name: 'quantity', type: 'INTEGER', isPrimary: false, isNullable: false, isUnique: false, defaultValue: '1' },
          ],
        },
      ],
      relationships: [
        { id: 'rel_mi_rest', sourceTableId: 't_menu', sourceColumnId: 'mi_rest_id', targetTableId: 't_rest', targetColumnId: 'r_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_o_rest', sourceTableId: 't_orders', sourceColumnId: 'o_rest_id', targetTableId: 't_rest', targetColumnId: 'r_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_oi_order', sourceTableId: 't_order_items', sourceColumnId: 'oi_order_id', targetTableId: 't_orders', targetColumnId: 'o_id', cardinality: 'ONE_TO_MANY', onDelete: 'CASCADE' },
        { id: 'rel_oi_menu', sourceTableId: 't_order_items', sourceColumnId: 'oi_menu_id', targetTableId: 't_menu', targetColumnId: 'mi_id', cardinality: 'ONE_TO_MANY', onDelete: 'RESTRICT' },
      ],
    },
  },
];

// Natural language synthesis helper
function synthesizeSchemaFromPrompt(prompt: string): SchemaState {
  const cleaned = prompt.toLowerCase();

  // Extract table names mentioned
  const words = cleaned
    .replace(/[^\w\s,]/g, ' ')
    .split(/[\s,]+/)
    .filter(
      (w) =>
        w.length > 2 &&
        ![
          'create',
          'make',
          'design',
          'build',
          'with',
          'and',
          'for',
          'the',
          'app',
          'system',
          'platform',
          'schema',
          'database',
          'table',
          'tables',
        ].includes(w)
    );

  const uniqueNames = Array.from(new Set(words)).slice(0, 6);

  if (uniqueNames.length === 0) {
    uniqueNames.push('items', 'categories', 'logs');
  }

  const colors = ['indigo', 'emerald', 'sky', 'purple', 'amber', 'rose', 'teal'];

  const tables: Table[] = uniqueNames.map((name, idx) => {
    const tableId = `tbl_${name}_${Date.now()}_${idx}`;
    return {
      id: tableId,
      name,
      color: colors[idx % colors.length],
      position: { x: (idx % 3) * 360 + 50, y: Math.floor(idx / 3) * 320 + 50 },
      columns: [
        {
          id: `col_${name}_id`,
          name: 'id',
          type: 'UUID',
          isPrimary: true,
          isNullable: false,
          isUnique: true,
        },
        {
          id: `col_${name}_name`,
          name: name.endsWith('s') ? `${name.slice(0, -1)}_name` : `${name}_name`,
          type: 'VARCHAR',
          isPrimary: false,
          isNullable: false,
          isUnique: false,
        },
        {
          id: `col_${name}_created`,
          name: 'created_at',
          type: 'TIMESTAMPTZ',
          isPrimary: false,
          isNullable: false,
          isUnique: false,
        },
      ],
      indexes: [
        {
          id: `idx_${name}_pk`,
          name: `idx_${name}_id`,
          columns: ['id'],
          isUnique: true,
        },
      ],
    };
  });

  const relationships: Relationship[] = [];

  // If there is a second table, wire a foreign key to the first
  if (tables.length >= 2) {
    const parent = tables[0];
    for (let i = 1; i < tables.length; i++) {
      const child = tables[i];
      const fkName = `${parent.name.endsWith('s') ? parent.name.slice(0, -1) : parent.name}_id`;
      const colId = `col_${child.name}_fk_${i}`;

      child.columns.splice(1, 0, {
        id: colId,
        name: fkName,
        type: 'UUID',
        isPrimary: false,
        isNullable: false,
        isUnique: false,
      });

      relationships.push({
        id: `rel_${child.id}_${parent.id}`,
        sourceTableId: child.id,
        sourceColumnId: colId,
        targetTableId: parent.id,
        targetColumnId: parent.columns[0].id,
        cardinality: 'ONE_TO_MANY',
        onDelete: 'CASCADE',
      });
    }
  }

  return applyAutoLayout({ tables, relationships });
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  onApplySchema,
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [previewSchema, setPreviewSchema] = useState<SchemaState | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: PromptPreset) => {
    setSelectedPresetId(preset.id);
    setCustomPrompt(preset.prompt);
    setPreviewSchema(applyAutoLayout(preset.schema));
  };

  const handleSynthesize = () => {
    if (!customPrompt.trim()) return;
    const generated = synthesizeSchemaFromPrompt(customPrompt);
    setPreviewSchema(generated);
    setSelectedPresetId(null);
  };

  const handleConfirm = (mode: 'replace' | 'append') => {
    if (!previewSchema) return;
    onApplySchema(previewSchema, mode);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base flex items-center gap-2">
                <span>AI Schema Architect</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                  Prompt-to-DDL
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Transform natural language requirements into fully normalized database schemas with foreign keys & indexes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
          {/* Natural Language Prompt Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5 text-purple-400" />
              <span>Describe Your Application Domain</span>
            </label>
            <div className="relative">
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g. Design a multi-tenant SaaS with organizations, users, projects, tasks, comments, and audit_logs..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-all font-sans"
              />
              <button
                onClick={handleSynthesize}
                disabled={!customPrompt.trim()}
                className="absolute right-3 bottom-3.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-medium transition-all shadow-lg shadow-purple-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Schema</span>
              </button>
            </div>
          </div>

          {/* Architecture Presets */}
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-2.5 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Or Choose a Battle-Tested Architectural Template</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_ARCHITECTURES.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedPresetId === preset.id
                      ? 'bg-purple-600/15 border-purple-500 shadow-md shadow-purple-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {preset.badge}
                    </span>
                    {selectedPresetId === preset.id && (
                      <Check className="w-3.5 h-3.5 text-purple-400" />
                    )}
                  </div>
                  <h4 className="font-semibold text-xs text-white mb-1">{preset.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Generated Schema Preview */}
          {previewSchema && (
            <div className="border border-slate-800 bg-slate-950 rounded-xl p-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold text-purple-300">
                  <Layers className="w-4 h-4" />
                  <span>Synthesized Entities ({previewSchema.tables.length} tables, {previewSchema.relationships.length} relations)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ready to commit to canvas</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                {previewSchema.tables.map((t) => (
                  <div
                    key={t.id}
                    className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono"
                  >
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{t.name}</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {t.columns.length} col
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {t.columns.map((c) => c.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => handleConfirm('append')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Append to Canvas</span>
                </button>
                <button
                  onClick={() => handleConfirm('replace')}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shadow-lg shadow-purple-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Replace Entire Canvas</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
