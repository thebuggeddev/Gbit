import React, { useMemo } from 'react';
import { Goal } from '../types';
import { Card } from './ui';

interface HeatmapProps {
  goals: Goal[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ goals }) => {
  // --- Data Preparation ---
  const { weeks, monthLabels, totalWeeks } = useMemo(() => {
    const weeksData: (Date | null)[][] = [];
    const mLabels: { label: string; weekIndex: number }[] = [];
    
    // 2026 Details
    const year = 2026;
    const startDate = new Date(year, 0, 1); // Jan 1, 2026 (Thursday)
    
    // Start from the Sunday before Jan 1
    // Jan 1 2026 is Thu. Sunday before is Dec 28, 2025.
    const startSunday = new Date(startDate);
    while(startSunday.getDay() !== 0) {
        startSunday.setDate(startSunday.getDate() - 1);
    }

    let iterator = new Date(startSunday);
    let currentWeekIndex = 0;
    
    // Generate exactly 53 weeks to cover the full year comfortably
    // (365 days / 7 = 52.14 weeks, plus padding at start/end often results in 53 spans)
    const MAX_WEEKS = 53;

    for (let w = 0; w < MAX_WEEKS; w++) {
        const week: (Date | null)[] = [];
        let hasYearDays = false;

        for (let d = 0; d < 7; d++) {
            // Check if this date is within 2026
            if (iterator.getFullYear() === year) {
                week.push(new Date(iterator));
                hasYearDays = true;
                
                // Month Label Logic:
                // If it's the 1st of the month, add label
                if (iterator.getDate() === 1) {
                    mLabels.push({ 
                        label: iterator.toLocaleString('default', { month: 'short' }), 
                        weekIndex: currentWeekIndex 
                    });
                }
            } else {
                week.push(null);
            }
            iterator.setDate(iterator.getDate() + 1);
        }
        
        weeksData.push(week);
        currentWeekIndex++;
    }

    // Edge case: If Jan 1st didn't trigger a label (e.g. if loop started differently), add Jan manually
    // Though with Jan 1 being Thu, it should be caught in first week.
    if (!mLabels.find(m => m.label === 'Jan')) {
        mLabels.unshift({ label: 'Jan', weekIndex: 0 });
    }
    
    return { weeks: weeksData, monthLabels: mLabels, totalWeeks: MAX_WEEKS };
  }, [goals]);

  // --- Entry Counting ---
  const entriesMap = useMemo(() => {
    const map = new Map<string, number>();
    goals.forEach(goal => {
      goal.entries.forEach(entry => {
        const d = entry.date; // YYYY-MM-DD
        map.set(d, (map.get(d) || 0) + 1);
      });
    });
    return map;
  }, [goals]);

  // --- Styles ---
  const getIntensity = (count: number) => {
    if (count === 0) return 'bg-gray-100 border-gray-200';
    if (count <= 1) return 'bg-neo-yellow/40 border-neo-yellow/50';
    if (count <= 2) return 'bg-neo-yellow/70 border-neo-yellow/80';
    return 'bg-neo-yellow border-neo-yellow';
  };

  return (
    <Card className="w-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-sans border-b-4 border-neo-yellow inline-block">2026 Activity</h3>
        
        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium hidden sm:flex">
          <span>Less</span>
          <div className="w-3 h-3 bg-gray-100 rounded-[2px] border border-gray-200"></div>
          <div className="w-3 h-3 bg-neo-yellow/40 rounded-[2px] border border-neo-yellow/50"></div>
          <div className="w-3 h-3 bg-neo-yellow/70 rounded-[2px] border border-neo-yellow/80"></div>
          <div className="w-3 h-3 bg-neo-yellow rounded-[2px] border border-neo-yellow"></div>
          <span>More</span>
        </div>
      </div>
      
      {/* Heatmap Container - Responsive full width */}
      <div className="w-full">
        
        {/* Top Axis: Month Labels */}
        <div className="flex relative h-5 mb-2 w-full pr-[1px]">
            {/* Spacer for Day Labels column (width matching the day label col below) */}
            <div className="w-8 flex-shrink-0"></div> 
            
            {/* Months Track */}
            <div className="flex-1 relative">
                {monthLabels.map((m, i) => (
                    <div 
                        key={i} 
                        className="absolute text-xs font-bold text-gray-400 transform -translate-x-1/4"
                        style={{ left: `${(m.weekIndex / totalWeeks) * 100}%` }}
                    >
                        {m.label}
                    </div>
                ))}
            </div>
        </div>

        {/* Main Grid Area */}
        <div className="flex w-full">
            {/* Left Axis: Day Labels */}
            {/* We construct this identically to a week column to ensure vertical alignment */}
            <div className="w-8 flex flex-col gap-[3px] flex-shrink-0 mr-1 pt-[1px]"> 
                {/* 
                   Grid Structure:
                   Row 0: Sun
                   Row 1: Mon -> Label
                   Row 2: Tue
                   Row 3: Wed -> Label
                   Row 4: Thu
                   Row 5: Fri -> Label
                   Row 6: Sat
                */}
                <div className="flex-1"></div> {/* Sun */}
                <div className="flex-1 flex items-center text-[10px] font-bold text-gray-400 leading-none">Mon</div>
                <div className="flex-1"></div> {/* Tue */}
                <div className="flex-1 flex items-center text-[10px] font-bold text-gray-400 leading-none">Wed</div>
                <div className="flex-1"></div> {/* Thu */}
                <div className="flex-1 flex items-center text-[10px] font-bold text-gray-400 leading-none">Fri</div>
                <div className="flex-1"></div> {/* Sat */}
            </div>

            {/* The Grid: Columns of Weeks */}
            {/* Use flex-1 to distribute width evenly */}
            <div className="flex-1 flex gap-[2px] sm:gap-[3px]">
                {weeks.map((week, wIdx) => (
                    <div key={wIdx} className="flex-1 flex flex-col gap-[2px] sm:gap-[3px]">
                        {week.map((date, dIdx) => {
                            // If it's a null date (padding), we render a transparent placeholder
                            if (!date) {
                                return <div key={dIdx} className="w-full aspect-square bg-transparent"></div>;
                            }
                            
                            // Fix: Use local date components instead of toISOString() to avoid timezone shifts
                            // toISOString() returns UTC, which for IST (UTC+5:30) might be the previous day.
                            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                            
                            const count = entriesMap.get(dateStr) || 0;
                            const colorClass = getIntensity(count);

                            return (
                                <div
                                    key={dIdx}
                                    className={`w-full aspect-square rounded-[1px] sm:rounded-[2px] border ${colorClass} transition-colors hover:border-black cursor-pointer relative group`}
                                >
                                    {/* Tooltip */}
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-neo-black text-white text-xs font-bold rounded shadow-neo-sm whitespace-nowrap z-50 pointer-events-none">
                                        {count} logs on {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        {/* Arrow */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neo-black"></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
      </div>
    </Card>
  );
};