"use client";

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Brain, Plus, LayoutTemplate } from 'lucide-react';
import { NewHabitModal } from '@/components/habits/NewHabitModal';

const CreateHabit = () => {
  const navigate = useNavigate();
  const [showCustomModal, setShowCustomModal] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Create New Habit" />

      <div className="space-y-6 text-center max-w-md mx-auto">
        <div className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Target className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-4">How do you want to create your habit?</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Wizard Button */}
          <Button
            className="h-32 rounded-3xl text-xl font-bold flex flex-col items-center justify-center space-y-2 bg-primary hover:bg-primary/90"
            onClick={() => navigate('/habit-wizard')}
          >
            <Zap className="w-8 h-8" />
            <span>Habit Wizard</span>
            <span className="text-sm font-normal opacity-80">Guided step-by-step flow</span>
          </Button>

          {/* Custom Modal Button */}
          <Button
            variant="outline"
            className="h-32 rounded-3xl text-xl font-bold flex flex-col items-center justify-center space-y-2 border-2 border-muted-foreground/20 hover:bg-muted/20"
            onClick={() => setShowCustomModal(true)}
          >
            <Brain className="w-8 h-8" />
            <span>Custom Habit</span>
            <span className="text-sm font-normal opacity-80">Full manual control</span>
          </Button>
        </div>

        {/* Template Creation Button */}
        <Button
          variant="ghost"
          className="w-full h-14 rounded-2xl font-semibold mt-4"
          onClick={() => navigate('/habit-wizard', { state: { mode: 'template' } })}
        >
          <LayoutTemplate className="w-5 h-5 mr-2" />
          Contribute a Template
        </Button>
      </div>

      {/* Custom Habit Modal */}
      <NewHabitModal 
        isOpen={showCustomModal} 
        onClose={() => setShowCustomModal(false)} 
      />
    </div>
  );
};

export default CreateHabit;