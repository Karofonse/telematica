import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  color?: string;
  height?: string;
}

export function ProgressBar({ value, className, color, height = 'h-3' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('w-full rounded-full bg-slate-700/60 overflow-hidden', height, className)}>
      <div
        className="h-full rounded-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: color ?? 'linear-gradient(90deg, #6366f1, #818cf8)',
        }}
      />
    </div>
  );
}
