import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Sparkles, Clock, Hash, Repeat, Sun, Moon, Download, Upload, AlertCircle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import * as db from '@/lib/db';
import type { AppSettings } from '@/lib/types';

export function Settings() {
  const { settings, updateSettings } = useApp();
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const update = async (patch: Partial<AppSettings>) => {
    await updateSettings({ ...settings, ...patch });
  };

  const handleExport = async () => {
    try {
      const json = await db.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studyquest-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup exportado correctamente.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Error al exportar' });
    }
  };

  const handleImport = async (file: File) => {
    setImporting(true);
    setMessage(null);
    try {
      const text = await file.text();
      await db.importData(text);
      setMessage({ type: 'success', text: 'Backup importado correctamente. Recarga la página para ver todos los cambios.' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message ?? 'Error al importar' });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const toggle = (label: string, value: boolean, onChange: (v: boolean) => void, icon: typeof Volume2) => {
    const Icon = icon;
    return (
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40">
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${value ? 'text-brand-400' : 'text-slate-500'}`} />
          <span className="text-sm text-slate-200 font-medium">{label}</span>
        </div>
        <button
          onClick={() => onChange(!value)}
          className={`relative w-12 h-7 rounded-full transition-colors ${value ? 'bg-brand-500' : 'bg-slate-600'}`}
        >
          <motion.div layout className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md ${value ? 'left-6' : 'left-1'}`} />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Configuración</h1>

      {/* General */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wide text-slate-400">General</h3>
          {toggle('Sonidos', settings.sounds, (v) => update({ sounds: v }), Volume2)}
          {toggle('Animaciones', settings.animations, (v) => update({ animations: v }), Sparkles)}
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/40">
            <div className="flex items-center gap-3">
              {settings.theme === 'dark' ? <Moon className="w-5 h-5 text-brand-400" /> : <Sun className="w-5 h-5 text-accent-400" />}
              <span className="text-sm text-slate-200 font-medium">Tema</span>
            </div>
            <div className="flex gap-1 p-1 rounded-lg bg-slate-700/50">
              <button onClick={() => update({ theme: 'dark' })} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${settings.theme === 'dark' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>Oscuro</button>
              <button onClick={() => update({ theme: 'light' })} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${settings.theme === 'light' ? 'bg-brand-500 text-white' : 'text-slate-400'}`}>Claro</button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quiz */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wide text-slate-400">Quiz</h3>
          {toggle('Temporizador', settings.timerEnabled, (v) => update({ timerEnabled: v }), Clock)}
          <div className="p-4 rounded-xl bg-slate-800/40">
            <div className="flex items-center gap-3 mb-3">
              <Clock className="w-5 h-5 text-brand-400" />
              <span className="text-sm text-slate-200 font-medium">Tiempo por pregunta</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[0, 10, 15, 20, 30, 60].map((s) => (
                <button
                  key={s}
                  onClick={() => update({ timerSeconds: s })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${settings.timerSeconds === s ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  {s === 0 ? 'Sin límite' : `${s}s`}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40">
            <div className="flex items-center gap-3 mb-3">
              <Hash className="w-5 h-5 text-brand-400" />
              <span className="text-sm text-slate-200 font-medium">Preguntas por quiz</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {[5, 10, 15, 20, 30].map((n) => (
                <button
                  key={n}
                  onClick={() => update({ defaultQuestionCount: n })}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${settings.defaultQuestionCount === n ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/40">
            <div className="flex items-center gap-3 mb-3">
              <Repeat className="w-5 h-5 text-brand-400" />
              <span className="text-sm text-slate-200 font-medium">Intensidad de repetición</span>
            </div>
            <div className="flex gap-2">
              {(['gentle', 'normal', 'aggressive'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => update({ repetitionIntensity: r })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${settings.repetitionIntensity === r ? 'bg-brand-500 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                >
                  {r === 'gentle' ? 'Suave' : r === 'normal' ? 'Normal' : 'Intensa'}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Backup */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="p-5 space-y-3">
          <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wide text-slate-400">Backup</h3>
          <p className="text-sm text-slate-400">Exporta tus preguntas y progreso para no perder meses de estudio. Puedes importarlas en cualquier momento.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="secondary" className="flex-1" onClick={handleExport}>
              <Download className="w-5 h-5 inline mr-2" /> Exportar backup
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()} disabled={importing}>
              <Upload className="w-5 h-5 inline mr-2" /> {importing ? 'Importando...' : 'Importar backup'}
            </Button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])} />
          </div>
          {message && (
            <div className={`flex items-start gap-2 p-3 rounded-xl text-sm ${message.type === 'success' ? 'bg-success-500/15 text-success-300' : 'bg-error-500/15 text-error-300'}`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {message.text}
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
