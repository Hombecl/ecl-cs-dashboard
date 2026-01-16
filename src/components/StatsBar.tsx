'use client';

import { DashboardStats } from '@/types';
import { Inbox, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface StatsBarProps {
  stats: DashboardStats;
}

export default function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center space-x-8">
        <StatItem
          icon={<Inbox className="h-4 w-4" />}
          label="New"
          value={stats.newCases}
          color="blue"
        />
        <StatItem
          icon={<Clock className="h-4 w-4" />}
          label="In Progress"
          value={stats.inProgressCases}
          color="yellow"
        />
        <StatItem
          icon={<AlertCircle className="h-4 w-4" />}
          label="Pending"
          value={stats.pendingCases}
          color="orange"
        />
        <StatItem
          icon={<CheckCircle className="h-4 w-4" />}
          label="Resolved Today"
          value={stats.resolvedToday}
          color="green"
        />
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'blue' | 'yellow' | 'orange' | 'green';
}

function StatItem({ icon, label, value, color }: StatItemProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    orange: 'bg-orange-100 text-orange-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <div className="flex items-center space-x-2">
      <div className={`p-1.5 rounded ${colorClasses[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-lg font-semibold text-gray-900">{value}</p>
      </div>
    </div>
  );
}
