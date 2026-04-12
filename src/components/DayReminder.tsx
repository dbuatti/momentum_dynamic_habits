import React from 'react';
import { format } from 'date-fns';
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";

export function DayReminder() {
  const day = format(new Date(), 'EEE').toUpperCase();
  const fullDate = format(new Date(), 'MMMM do, yyyy');

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center bg-background overflow-hidden select-none p-8">
      <div className="text-center space-y-4 mb-12">
        <div className="mx-auto w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center mb-6">
          <Calendar className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-5xl font-black tracking-tighter text-white uppercase italic">Today</h2>
        <p className="text-white/60 font-bold uppercase tracking-widest text-sm">{fullDate}</p>
      </div>

      <div className={cn(
        "bg-white/10 backdrop-blur-md rounded-[5rem] flex items-center justify-center transition-all duration-700 shadow-2xl border border-white/10",
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
      
      <div className="mt-12 landscape:hidden opacity-40">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">
          Swipe right to return
        </p>
      </div>
    </div>
  );
}