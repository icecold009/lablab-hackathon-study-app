import type { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-border/50 text-muted border-border/50',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  danger: 'bg-danger/10 text-danger border-danger/20',
  info: 'bg-primary/10 text-primary-light border-primary/20',
};

export default function Badge({
  variant = 'default',
  icon,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${variantStyles[variant]} ${className}`}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}

/* ── Confidence/level dot badge ───────────────────────────── */

const confidenceStyles = {
  low: { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
  high: { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
};

export function ConfidenceBadge({
  level,
  label,
}: {
  level: 'low' | 'medium' | 'high';
  label?: string;
}) {
  const s = confidenceStyles[level];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border border-transparent ${s.bg} ${s.text}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {label ?? level}
    </span>
  );
}