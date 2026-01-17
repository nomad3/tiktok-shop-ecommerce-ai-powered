"use client";

interface MobileStatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  color?: 'default' | 'red' | 'green' | 'blue' | 'yellow';
}

const colorClasses = {
  default: 'bg-tiktok-dark',
  red: 'bg-gradient-to-br from-tiktok-red/20 to-tiktok-dark',
  green: 'bg-gradient-to-br from-green-500/20 to-tiktok-dark',
  blue: 'bg-gradient-to-br from-blue-500/20 to-tiktok-dark',
  yellow: 'bg-gradient-to-br from-yellow-500/20 to-tiktok-dark',
};

const iconColors = {
  default: 'text-gray-400',
  red: 'text-tiktok-red',
  green: 'text-green-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
};

export function MobileStatsCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  color = 'default',
}: MobileStatsCardProps) {
  const isPositiveChange = change !== undefined && change >= 0;

  return (
    <div className={`${colorClasses[color]} rounded-xl p-4`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-gray-400 text-sm">{title}</span>
        {icon && <span className={iconColors[color]}>{icon}</span>}
      </div>

      <div className="flex items-end justify-between">
        <span className="text-white text-2xl font-bold">{value}</span>

        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${isPositiveChange ? 'text-green-400' : 'text-red-400'}`}>
            <svg
              className={`w-4 h-4 ${!isPositiveChange && 'rotate-180'}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
            </svg>
            <span>{Math.abs(change)}%</span>
            {changeLabel && <span className="text-gray-500 text-xs ml-1">{changeLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

// Grid component for stats
interface MobileStatsGridProps {
  children: React.ReactNode;
}

export function MobileStatsGrid({ children }: MobileStatsGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {children}
    </div>
  );
}

// Quick action button for mobile
interface QuickActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  color?: 'red' | 'cyan' | 'gray';
}

export function QuickActionButton({ icon, label, onClick, color = 'gray' }: QuickActionButtonProps) {
  const colorClasses = {
    red: 'bg-tiktok-red text-white',
    cyan: 'bg-tiktok-cyan text-black',
    gray: 'bg-tiktok-gray text-white',
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} rounded-xl p-4 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
