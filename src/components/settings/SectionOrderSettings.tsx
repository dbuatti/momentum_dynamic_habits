"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ListOrdered, GripVertical, CheckCircle2, Loader2, Anchor, CalendarCheck, Zap } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useUpdateProfile } from '@/hooks/useUpdateProfile';
import { cn } from '@/lib/utils';

interface SectionItem {
  id: 'anchor' | 'weekly_objective' | 'daily_momentum';
  label: string;
  icon: React.ElementType;
}

const sectionDefinitions: Record<SectionItem['id'], Omit<SectionItem, 'id'>> = {
  anchor: { label: 'Anchor Practices', icon: Anchor },
  weekly_objective: { label: 'Weekly Objectives', icon: CalendarCheck },
  daily_momentum: { label: 'Daily Momentum', icon: Zap },
};

export const SectionOrderSettings: React.FC = () => {
  const { data: dashboardData, isLoading: isLoadingDashboard } = useDashboardData();
  const { mutate: updateProfile, isPending: isUpdatingProfile } = useUpdateProfile();
  const [orderedSections, setOrderedSections] = useState<SectionItem[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (dashboardData?.sectionOrder) {
      const initialOrder = (dashboardData.sectionOrder || ['anchor', 'weekly_objective', 'daily_momentum']).map(id => ({
        id: id as SectionItem['id'],
        label: sectionDefinitions[id as SectionItem['id']].label,
        icon: sectionDefinitions[id as SectionItem['id']].icon,
      }));
      setOrderedSections(initialOrder);
      setHasChanges(false);
    }
  }, [dashboardData]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }

    const items = Array.from(orderedSections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setOrderedSections(items);
    setHasChanges(true);
  };

  const handleSaveOrder = () => {
    const newOrder = orderedSections.map(s => s.id);
    updateProfile({ section_order: newOrder });
    setHasChanges(false);
  };

  if (isLoadingDashboard) {
    return (
      <Card className="rounded-3xl shadow-sm border border-border bg-card">
        <CardHeader className="p-6 pb-0">
          <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <ListOrdered className="w-4 h-4" /> Section Display Order
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
          <ListOrdered className="w-4 h-4" /> Section Display Order
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          Drag and drop these sections to customize their order on your dashboard.
        </p>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="section-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {orderedSections.map((section, index) => {
                  const Icon = section.icon;
                  return (
                    <Draggable key={section.id} draggableId={section.id} index={index}>
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
                          <span className="font-medium text-sm flex-grow">{section.label}</span>
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
          {isUpdatingProfile ? 'Saving Order...' : 'Save Section Order'}
        </Button>
      </CardContent>
    </Card>
  );
};