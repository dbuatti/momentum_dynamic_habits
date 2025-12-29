"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListOrdered, GripVertical, CheckCircle2, Loader2 } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { cn } from '@/lib/utils';
import { habitIconMap } from '@/lib/habit-utils';
import { ProcessedUserHabit } from '@/types/habit';

export const HabitOrderSettings: React.FC = () => {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardData();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const [orderedHabits, setOrderedHabits] = useState<ProcessedUserHabit[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (dashboardData?.habits) {
      // Filter out habits without a key or name, then sort by custom order or default
      const sortableHabits = dashboardData.habits.filter(h => h.habit_key && h.name);
      
      const customOrderMap = new Map(
        (dashboardData.customHabitOrder || []).map((key, index) => [key, index])
      );

      const sorted = [...sortableHabits].sort((a, b) => {
        const orderA = customOrderMap.has(a.habit_key) ? customOrderMap.get(a.habit_key)! : Infinity;
        const orderB = customOrderMap.has(b.habit_key) ? customOrderMap.get(b.habit_key)! : Infinity;
        
        if (orderA === Infinity && orderB === Infinity) {
          // If neither are in custom order, sort by name
          return a.name.localeCompare(b.name);
        }
        // Cast to number to fix TS2362 and TS2363
        return (orderA as number) - (orderB as number);
      });
      setOrderedHabits(sorted);
      setHasChanges(false);
    }
  }, [dashboardData]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(orderedHabits);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedHabits(items);
    setHasChanges(true);
  };

  const handleSaveOrder = () => {
    const newOrder = orderedHabits.map(h => h.habit_key);
    updateProfile({ custom_habit_order: newOrder });
    setHasChanges(false);
  };

  if (isLoadingDashboard) {
    return (
      <Card className="rounded-3xl shadow-sm border border-border bg-card">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <ListOrdered className="w-4 h-4" /> Habit Display Order
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl shadow-sm border border-border bg-card">
      <CardHeader className="p-6 pb-0">
        <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
          <ListOrdered className="w-4 h-4" /> Habit Display Order
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Drag and drop your habits to set a custom display order on your dashboard.
        </p>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="habit-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {orderedHabits.map((habit, index) => {
                  const Icon = habitIconMap[habit.habit_key] || habitIconMap.custom_habit;
                  return (
                    <Draggable key={habit.habit_key} draggableId={habit.habit_key} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border bg-muted/50",
                            snapshot.isDragging && "shadow-lg bg-primary/10 border-primary"
                          )}
                        >
                          <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                          <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <span className="font-medium text-sm flex-grow">{habit.name}</span>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
        <Button 
          className="w-full h-11 rounded-xl font-bold mt-4" 
          onClick={handleSaveOrder}
          disabled={!hasChanges || isUpdatingProfile}
        >
          {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
          {isUpdatingProfile ? 'Saving Order...' : 'Save Custom Order'}
        </Button>
      </CardContent>
    </Card>
  );
};