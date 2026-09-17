import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Trash2, FolderPlus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { MODULE_COLORS, MODULE_ICONS, moduleColor } from '@/lib/modules';
import * as db from '@/lib/db';
import type { Module } from '@/lib/types';

interface ModuleFormProps {
  module?: Module | null;          // when set, edit mode
  questionCount?: number;          // shown in delete confirmation
  onClose: () => void;
  onSaved: (m: Module) => void;
  onDeleted?: () => void;
}

export function ModuleForm({ module, questionCount = 0, onClose, onSaved, onDeleted }: ModuleFormProps) {
  const isEdit = !!module;
  const [name, setName] = useState(module?.name ?? '');
  const [description, setDescription] = useState(module?.description ?? '');
  const [color, setColor] = useState(module?.color ?? 'brand');
  const [icon, setIcon] = useState(module?.icon ?? 'folder');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');

  const canSave = name.trim().length > 0;
  const preview = moduleColor(color);
  const PreviewIcon = MODULE_ICONS.find((i) => i.key === icon)?.icon ?? MODULE_ICONS[0].icon;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const saved = isEdit && module
        ? await db.updateModule(module.id, { name: name.trim(), description: description.trim(), color, icon })
        : await db.createModule({ name, description, color, icon });
      onSaved(saved);
    } catch (e: any) {
      setError(e.message ?? 'Error al guardar el módulo');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!module) return;
    setSaving(true);
    try {
      await db.deleteModule(module.id);
      onDeleted?.();
    } catch (e: any) {
      setError(e.message ?? 'Error al eliminar el módulo');
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }} onClick={(e) => e.stopPropagation()} className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <Card className="p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${preview.gradient} flex items-center justify-center shadow-lg`}>
                <PreviewIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-bold text-white text-lg">{isEdit ? 'Editar módulo' : 'Nuevo módulo'}</h3>
                <p className="text-xs text-slate-400">Una carpeta para agrupar preguntas</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg bg-slate-700/50 text-slate-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Módulos 16 - 17"
              autoFocus
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Descripción</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Seguridad de red y rendimiento"
              className="w-full px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Color</label>
            <div className="flex flex-wrap gap-2">
              {MODULE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  title={c.label}
                  onClick={() => setColor(c.key)}
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.gradient} transition-all ${color === c.key ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-300 mb-2">Icono</label>
            <div className="flex flex-wrap gap-2">
              {MODULE_ICONS.map((i) => {
                const Icon = i.icon;
                return (
                  <button
                    key={i.key}
                    type="button"
                    title={i.label}
                    onClick={() => setIcon(i.key)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${icon === i.key ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>

          {error && <div className="p-3 rounded-xl bg-error-500/15 border border-error-500/30 text-error-300 text-sm">{error}</div>}

          {confirmDelete ? (
            <div className="p-4 rounded-xl bg-error-500/10 border border-error-500/30 space-y-3">
              <p className="text-sm text-slate-200">
                ¿Eliminar el módulo <span className="font-semibold text-white">{module?.name}</span>?
                {questionCount > 0
                  ? ` Sus ${questionCount} preguntas no se borran: quedarán sin módulo y podrás asignarlas a otro.`
                  : ' No tiene preguntas.'}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
                <Button variant="danger" size="sm" className="flex-1" onClick={handleDelete} disabled={saving}>Sí, eliminar</Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 pt-1">
              {isEdit && (
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="text-error-300 hover:bg-error-500/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" className="flex-1" onClick={onClose}>Cancelar</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !canSave}>
                {isEdit ? <Save className="w-4 h-4 inline mr-1" /> : <FolderPlus className="w-4 h-4 inline mr-1" />}
                {saving ? 'Guardando...' : isEdit ? 'Guardar' : 'Crear módulo'}
              </Button>
            </div>
          )}
        </Card>
      </motion.div>
    </motion.div>
  );
}
