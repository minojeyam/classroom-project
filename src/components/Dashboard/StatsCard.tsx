import React from 'react';
// import { DivideIcon as LucideIcon } from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { usersAPI } from "../../utils/api";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'teal' | 'coral' | 'green' | 'purple' | 'blue' | 'orange' | "red";
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const colorClasses = {
  teal: 'bg-teal-500 text-white',
  coral: 'bg-red-400 text-white',
  green: 'bg-green-500 text-white',
  purple: 'bg-purple-500 text-white',
  blue: 'bg-blue-500 text-white',
  orange: 'bg-orange-500 text-white',
  red:'bg-orange-500 text-white'
};


const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, color, trend }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.isPositive ? 'text-green-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-sm text-gray-500 ml-2">vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;