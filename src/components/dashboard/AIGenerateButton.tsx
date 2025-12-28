"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import AIGenerativeDialogue from '../habits/AIGenerativeDialogue'; // Fixed path
import { useNavigate } from 'react-router-dom';

export const AIGenerateButton = () => {
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);
  const navigate = useNavigate();

  const handleHabitGenerated = (habitData: any) => {
    navigate('/create-habit', { 
      state: { 
        aiGeneratedData: habitData 
      } 
    });
  };

  return (
    <>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-[150]"
      >
        <Button
          onClick={() => setIsDialogueOpen(true)}
          className="h-16 w-16 rounded-full shadow-2xl bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center"
          aria-label="AI Generate Habit"
        >
          <Brain className="w-8 h-8" />
        </Button>
      </motion.div>

      <AnimatePresence>
        {isDialogueOpen && (
          <AIGenerativeDialogue
            isOpen={isDialogueOpen}
            onClose={() => setIsDialogueOpen(false)}
            onHabitGenerated={handleHabitGenerated}
          />
        )}
      </AnimatePresence>
    </>
  );
};