import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";

export function DayReminder() {
  const day = format(new Date(), 'EEE').toUpperCase();

  return (
    <div className="w-full h-screen flex items-center justify-center bg-background overflow-hidden select-none">
      <div className="flex flex-col items-center justify-center w-full h-full p-4">
        {/* The "Block" container for the day */}
        <div className={cn(
          "bg-white/10 backdrop-blur-md rounded-[5rem] flex items-center justify-center transition-all duration-700",
          "w-[85vw] h-[85vw] max-w-[500px] max-h-[500px]",
          "landscape:w-full landscape:h-full landscape:max-w-none landscape:max-h-none landscape:rounded-none landscape:bg-transparent"
        )}>
          <h1 className={cn(
            "font-black tracking-tighter text-white leading-none text-center",
            "text-[25vw] sm:text-[12rem]",
            "landscape:text-[70vh] landscape:tracking-[-0.02em]"
          )}>
            {day}
          </h1>
        </div>
        
        <div className="mt-12 landscape:hidden">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40 animate-pulse">
            Swipe right to return
          </p>
        </div>
      </div>
    </div>
  );
}