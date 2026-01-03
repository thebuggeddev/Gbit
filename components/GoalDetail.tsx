import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Goal } from '../types';
import { Card, Button, ProgressBar } from './ui';
import { getCategoryColor, calculateProgress } from '../services/storage';

// --- Icons ---
const LinkIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>;
const TrashIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

interface GoalDetailProps {
  goal: Goal;
  onBack: () => void;
  onEdit: () => void;
  onDeleteGoal: (id: string) => void;
  onDeleteEntry: (goalId: string, entryId: string) => void;
  onAddEntry: () => void;
}

export const GoalDetail: React.FC<GoalDetailProps> = ({ goal, onBack, onEdit, onDeleteGoal, onDeleteEntry, onAddEntry }) => {
  // Prepare chart data (cumulative progress)
  const chartData = React.useMemo(() => {
    const sortedEntries = [...goal.entries].sort((a, b) => a.timestamp - b.timestamp);
    let cumulative = 0;
    
    // Create data points
    const points = sortedEntries.map(e => {
      cumulative += e.value;
      return {
        date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: cumulative,
        rawDate: e.date
      };
    });

    // Add start point
    if (points.length === 0 || points[0].rawDate !== '2026-01-01') {
        points.unshift({ date: 'Start', value: 0, rawDate: '2026-01-01' });
    }
    
    return points;
  }, [goal.entries]);

  const progress = calculateProgress(goal);
  const colorClass = getCategoryColor(goal.category);

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="neutral" size="sm" onClick={onBack} tooltip="Esc">
            ← Back
        </Button>
        <div className="flex-1 overflow-hidden">
           <div className="flex items-center gap-2">
               <h2 className="text-2xl font-bold truncate">{goal.title}</h2>
               {goal.link && (
                   <a 
                    href={goal.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-neo-blue hover:text-blue-700 bg-blue-50 p-1.5 rounded-full border border-neo-blue"
                    title="Open Link"
                   >
                       <LinkIcon />
                   </a>
               )}
           </div>
        </div>
        
        <div className="flex items-center gap-2">
            <Button variant="neutral" size="sm" onClick={() => onDeleteGoal(goal.id)} className="text-red-500 border-red-200 hover:bg-red-50" title="Delete Goal">
                <TrashIcon />
            </Button>
            <Button variant="secondary" size="sm" onClick={onEdit}>
                Edit
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Card */}
        <Card className="md:col-span-1 flex flex-col justify-between relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 ${colorClass}`}></div>
            <div>
                <span className="text-gray-500 text-sm font-bold uppercase tracking-wider">{goal.category}</span>
                <div className="mt-2 text-4xl font-black font-sans">
                    {progress}%
                </div>
                <p className="text-gray-600 font-medium">Completed</p>
            </div>
            <div className="mt-6">
                    <div className="flex justify-between text-sm mb-1 font-bold">
                        <span>Current: {goal.currentValue}</span>
                        <span>Target: {goal.targetValue > 0 ? goal.targetValue : '∞'} {goal.unit}</span>
                    </div>
                    <ProgressBar current={goal.currentValue} total={goal.targetValue} colorClass={colorClass.replace('bg-', 'bg-')} />
            </div>
        </Card>

        {/* Chart Card */}
        <Card className="md:col-span-2 h-64">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-lg">Progress Over Time</h4>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={colorClass.includes('yellow') ? '#FCD34D' : colorClass.includes('blue') ? '#60A5FA' : '#34D399'} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#FFFFFF" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tick={{fontSize: 12}} tickLine={false} axisLine={false} minTickGap={30} />
                    <YAxis tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: '2px solid black', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#171717" 
                        strokeWidth={2}
                        fill="url(#colorVal)" 
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Card>
      </div>

      {/* Entries List */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-2">
            <h3 className="text-xl font-bold border-b-4 border-neo-black inline-block translate-y-[9px]">History</h3>
            <Button onClick={onAddEntry} size="sm" tooltip="L">
                Add Logs
            </Button>
        </div>
        
        <div className="flex flex-col gap-3">
            {goal.entries.length > 0 ? (
                [...goal.entries].sort((a,b) => b.timestamp - a.timestamp).map(entry => (
                    <div key={entry.id} className="bg-white border-2 border-neo-black rounded-lg p-4 flex items-center justify-between shadow-neo-sm hover:translate-x-1 transition-transform">
                        <div>
                            <div className="flex items-baseline gap-3">
                                <span className="font-bold text-lg">{entry.value > 0 ? `+${entry.value}` : '•'} {entry.value > 0 ? goal.unit : ''}</span>
                                <span className="text-gray-500 text-sm font-medium">{new Date(entry.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                            </div>
                            <p className="text-gray-800">{entry.description}</p>
                        </div>
                        <button 
                            onClick={() => onDeleteEntry(goal.id, entry.id)}
                            className="text-gray-300 hover:text-red-500 transition-colors p-2"
                            title="Delete Entry"
                        >
                            <TrashIcon />
                        </button>
                    </div>
                ))
            ) : (
                <div className="text-gray-400 italic text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    No entries yet. Start logging progress!
                </div>
            )}
        </div>
      </div>
    </div>
  );
};