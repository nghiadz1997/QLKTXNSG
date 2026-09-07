import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, action, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div>
            {typeof title === 'string' ? (
              <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  );
};

export const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'blue' | 'emerald' | 'amber' | 'purple' | 'rose' | 'cyan';
  subtitle?: string;
}> = ({ title, value, icon: Icon, color = 'blue', subtitle }) => {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    cyan: 'bg-cyanAccent-50 text-cyanAccent-600 border-cyanAccent-100',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl border flex items-center justify-center ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};
