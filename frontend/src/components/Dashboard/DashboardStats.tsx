import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  color: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, color }) => (
  <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderLeftColor: color }}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change !== undefined && (
          <div className="flex items-center mt-2">
            <span className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
);

interface DashboardStatsProps {
  stats: {
    totalPolicies: number;
    totalClaims: number;
    totalPremiums: number;
    totalPayouts: number;
    claimRatio: number;
    cancelledPolicies: number;
  };
  trends?: {
    claimsGrowth: number;
    policiesGrowth: number;
    premiumGrowth: number;
  };
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, trends }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <StatsCard
        title="Total Policies"
        value={stats.totalPolicies.toLocaleString()}
        change={trends?.policiesGrowth}
        color="#3B82F6"
      />
      
      <StatsCard
        title="Total Claims"
        value={stats.totalClaims.toLocaleString()}
        change={trends?.claimsGrowth}
        color="#F59E0B"
      />
      
      <StatsCard
        title="Total Premiums"
        value={formatCurrency(stats.totalPremiums)}
        change={trends?.premiumGrowth}
        color="#10B981"
      />
      
      <StatsCard
        title="Total Payouts"
        value={formatCurrency(stats.totalPayouts)}
        color="#EF4444"
      />
      
      <StatsCard
        title="Claim Ratio"
        value={`${stats.claimRatio}%`}
        color="#8B5CF6"
      />
      
      <StatsCard
        title="Cancelled Policies"
        value={stats.cancelledPolicies.toLocaleString()}
        color="#6366F1"
      />
    </div>
  );
};

export default DashboardStats;