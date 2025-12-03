import { Clock, Target, BarChart, Zap } from 'lucide-react';
import React from 'react';

const PatternItem = ({ icon, title, value }: { icon: React.ReactNode, title: string, value: string }) => (
  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3">
    <div className="flex items-center space-x-2 text-muted-foreground">{icon} <span className="text-sm">{title}</span></div>
    <p className="font-bold text-lg mt-1">{value}</p>
  </div>
);

export const PatternsCard = () => (
  <div className="bg-card rounded-2xl p-4 shadow-sm">
    <h3 className="font-semibold mb-3">Your Patterns</h3>
    <div className="grid grid-cols-2 gap-3">
      <PatternItem icon={<Clock className="w-4 h-4" />} title="Best time" value="🌙 Night owl" />
      <PatternItem icon={<Target className="w-4 h-4" />} title="Consistency" value="114% of days" />
      <PatternItem icon={<Zap className="w-4 h-4" />} title="Best streak" value="0 days" />
      <PatternItem icon={<BarChart className="w-4 h-4" />} title="Total sessions" value="29" />
    </div>
  </div>
);