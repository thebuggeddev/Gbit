import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell
} from 'recharts';
import { Goal, GoalCategory } from '../types';
import { Card } from './ui';

interface ChartsProps {
  goals: Goal[];
}

const COLORS = {
  Learning: '#60A5FA', // neo-blue
  Book: '#FCD34D',     // neo-yellow
  Money: '#34D399',    // neo-green
  General: '#F472B6'   // neo-accent
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-neo-black shadow-neo rounded-lg p-2 text-sm">
        <p className="font-bold">{label || payload[0].name}</p>
        <p className="text-gray-600">
          Progress: <span className="font-mono font-bold text-neo-black">{payload[0].value}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border-2 border-neo-black shadow-neo rounded-lg p-2 text-sm">
          <p className="font-bold">{payload[0].name}</p>
          <p className="text-gray-600">
            Count: <span className="font-mono font-bold text-neo-black">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

export const OverviewCharts: React.FC<ChartsProps> = ({ goals }) => {
  
  // 1. Progress by Category Data
  const categoryData = Object.values(GoalCategory).map(cat => {
    const goalsInCat = goals.filter(g => g.category === cat);
    if (goalsInCat.length === 0) return null;
    
    // Average completion of goals in this category
    const totalProgress = goalsInCat.reduce((acc, g) => {
        if(g.targetValue <= 0) {
             return acc + (g.entries.length > 0 ? Math.min(100, g.entries.length * 10) : 0);
        }
        const p = Math.min(100, (g.currentValue / g.targetValue) * 100);
        return acc + p;
    }, 0);
    
    return {
      name: cat,
      progress: Math.round(totalProgress / goalsInCat.length),
      fill: COLORS[cat as keyof typeof COLORS]
    };
  }).filter(Boolean) as { name: string, progress: number, fill: string }[];

  // 2. Overall Completion Status
  const completedGoals = goals.filter(g => g.targetValue > 0 && g.currentValue >= g.targetValue).length;
  const inProgressGoals = goals.length - completedGoals;
  
  const pieData = [
    { name: 'Completed', value: completedGoals, color: '#34D399' },
    { name: 'In Progress', value: inProgressGoals, color: '#FCD34D' }
  ].filter(d => d.value > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Category Performance */}
      <Card className="h-80 flex flex-col">
        <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg border-b-4 border-neo-blue inline-block">Category Breakdown</h4>
        </div>
        <div className="flex-1 w-full min-h-0">
            {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={24}
                            tickFormatter={(value) => value[0]} 
                            tick={{ fill: '#171717', fontWeight: 'bold', fontSize: 14 }}
                            axisLine={false} 
                            tickLine={false} 
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{fill: '#f3f4f6'}} />
                        <Bar dataKey="progress" radius={[0, 6, 6, 0]} barSize={32} label={{ position: 'insideLeft', fill: 'black', fontWeight: 'bold', fontSize: 12 }}>
                            {
                                categoryData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} stroke="black" strokeWidth={2} />
                                ))
                            }
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-gray-400 italic">No activity yet</div>
            )}
        </div>
      </Card>

      {/* Overall Status */}
      <Card className="h-80 flex flex-col">
         <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-lg border-b-4 border-neo-purple inline-block">Goal Status</h4>
        </div>
        <div className="flex-1 w-full min-h-0 flex items-center justify-center relative">
            {goals.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="black"
                            strokeWidth={2}
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div className="text-gray-400 italic">Add goals to see progress</div>
            )}
        </div>
      </Card>
    </div>
  );
};