"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const History = () => {
  return (
    <div className="w-full max-w-lg mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to="/">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-foreground">Activity History</h1>
        <div className="w-10"></div> {/* Placeholder for alignment */}
      </div>

      <div className="bg-card rounded-2xl p-6 shadow-sm text-center">
        <p className="text-lg text-muted-foreground">
          This page will display your past completed tasks, habit progress, and overall activity.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">
          Stay tuned for more detailed historical data!
        </p>
      </div>

      {/* Future content for history can go here */}
    </div>
  );
};

export default History;