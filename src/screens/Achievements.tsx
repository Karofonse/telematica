import { motion } from 'framer-motion';
import { Trophy, Flame, Target, Brain, Zap, Book, Flag, Star, Lock } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Card } from '@/components/ui/Card';
import { ACHIEVEMENT_DEFS } from '@/lib/types';

const ICONS: Record<string, typeof Trophy> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  brain: Brain,
  zap: Zap,
  book: Book,
  flag: Flag,
  star: Star,
};

export function Achievements() {
  const { achievements } = useApp();
  const unlockedKeys = new Set(achievements.map((a) => a.key));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display font-bold text-white">Logros</h1>
        <p className="text-slate-400 mt-1">{achievements.length} / {ACHIEVEMENT_DEFS.length} desbloqueados</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {ACHIEVEMENT_DEFS.map((def, i) => {
          const unlocked = unlockedKeys.has(def.key);
          const Icon = ICONS[def.icon] ?? Trophy;
          return (
            <motion.div
              key={def.key}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className={`p-5 text-center transition-all ${unlocked ? 'border-accent-500/40 bg-gradient-to-br from-accent-500/10 to-transparent' : 'opacity-50 grayscale'}`}>
                <div className={`w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center ${unlocked ? 'bg-gradient-to-br from-accent-500 to-orange-500 shadow-lg shadow-accent-500/30' : 'bg-slate-700/50'}`}>
                  {unlocked ? <Icon className="w-8 h-8 text-white" /> : <Lock className="w-7 h-7 text-slate-500" />}
                </div>
                <h3 className={`font-display font-bold text-sm ${unlocked ? 'text-white' : 'text-slate-500'}`}>{def.title}</h3>
                <p className="text-xs text-slate-400 mt-1">{def.description}</p>
                {unlocked && (
                  <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success-500/20 text-success-300 text-xs font-semibold">
                    Desbloqueado
                  </div>
                )}
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
