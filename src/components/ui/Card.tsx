import { cn } from '@/lib/utils';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 shadow-xl',
        hover && 'transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:border-brand-500/50 cursor-pointer',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
