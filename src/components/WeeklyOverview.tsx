import React from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from "@/lib/utils";

export function WeeklyOverview() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Start on Monday
  
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-12 py-12">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic">Your Week</h2>
        <p className="text-lg font-bold text-white/60 uppercase tracking-widest">Keep the rhythm going</p>
      </div>

      <div className="grid grid-cols-1 gap-4 w-full px-4">
        {weekDays.map((day) => {
          const isToday = isSameDay(day, today);
          return (
            <div 
              key={day.toString()}
              className={cn(
                "p-6 rounded-[2rem] flex items-center justify-between transition-all duration-500",
                isToday 
                  ? "bg-white shadow-2xl scale-105" 
                  : "bg-white/10 border border-white/10"
              )}
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl",
                  isToday ? "bg-orange-500 text-white" : "bg-white/20 text-white"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="flex flex-col">
                  <span className={cn(
                    "font-black uppercase tracking-widest text-sm",
                    isToday ? "text-orange-500" : "text-white"
                  )}>
                    {format(day, 'EEEE')}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500/60">
                      Today
                    </span>
                  )}
                </div>
              </div>
              
              {isToday ? (
                <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-white/20" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 text-center">
        Swipe right to return
      </p>
    </div>
  );
}