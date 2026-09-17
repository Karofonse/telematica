import { cn } from '@/lib/utils';
import { Home, BookOpen, BarChart3, Trophy, Settings, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export type Route = 'dashboard' | 'quiz' | 'bank' | 'stats' | 'achievements' | 'settings' | 'add' | 'results';

interface NavBarProps {
  route: Route;
  onNavigate: (r: Route) => void;
}

const items: { key: Route; label: string; icon: typeof Home }[] = [
  { key: 'dashboard', label: 'Inicio', icon: Home },
  { key: 'bank', label: 'Preguntas', icon: BookOpen },
  { key: 'stats', label: 'Estadísticas', icon: BarChart3 },
  { key: 'achievements', label: 'Logros', icon: Trophy },
  { key: 'settings', label: 'Ajustes', icon: Settings },
];

export function NavBar({ route, onNavigate }: NavBarProps) {
  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-20 lg:w-60 fixed inset-y-0 left-0 bg-slate-900/80 backdrop-blur-md border-r border-slate-700/50 z-40">
        <div className="flex items-center justify-center lg:justify-start lg:px-6 h-16 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-white font-bold font-display">S</div>
            <span className="hidden lg:block font-display font-bold text-lg text-white">StudyQuest</span>
          </div>
        </div>
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {items.map((it) => {
            const Icon = it.icon;
            const active = route === it.key;
            return (
              <button
                key={it.key}
                onClick={() => onNavigate(it.key)}
                className={cn(
                  'flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl transition-all relative',
                  active ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700/40',
                )}
              >
                {active && <motion.div layoutId="nav-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/20 to-brand-600/10 border border-brand-500/30" />}
                <Icon className="w-5 h-5 relative z-10 shrink-0" />
                <span className="hidden lg:block relative z-10 font-medium text-sm">{it.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="p-3">
          <button
            onClick={() => onNavigate('add')}
            className="w-full flex items-center justify-center lg:justify-start gap-3 px-3 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white font-semibold hover:from-accent-400 hover:to-accent-500 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block text-sm">Nueva pregunta</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-700/50 z-40 flex items-center justify-around px-1 py-2 overflow-x-auto">
        {items.map((it) => {
          const Icon = it.icon;
          const active = route === it.key;
          return (
            <button
              key={it.key}
              onClick={() => onNavigate(it.key)}
              className={cn('flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-colors shrink-0', active ? 'text-brand-400' : 'text-slate-500')}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{it.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
