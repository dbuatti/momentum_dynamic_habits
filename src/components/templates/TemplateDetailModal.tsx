"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Clock, Repeat, Target, Anchor, FlaskConical, Zap, ShieldCheck, Layers, Info, ArrowRight } from 'lucide-react';
import { HabitTemplate, habitCategories, habitModes, habitIcons } from '@/lib/habit-templates';
import { cn } from '@/lib/utils';

interface TemplateDetailModalProps {
  template: HabitTemplate | null;
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (template: HabitTemplate) => void;
}

export const TemplateDetailModal: React.FC<TemplateDetailModalProps> = ({ template, isOpen, onClose, onUseTemplate }) => {
  if (!template) return null;

  const CategoryIcon = habitCategories.find(cat => cat.value === template.category)?.icon || Target;
  const IconComponent = habitIcons.find(icon => icon.value === template.icon_name)?.icon || Target;
  const ModeIcon = habitModes.find(mode => mode.value === template.defaultMode)?.icon || Info;

  const categoryColorMap: Record<string, string> = {
    cognitive: 'bg-habit-blue text-habit-blue-foreground border-habit-blue-border',
    physical: 'bg-habit-green text-habit-green-foreground border-habit-green-border',
    wellness: 'bg-habit-purple text-habit-purple-foreground border-habit-purple-border',
    daily: 'bg-habit-orange text-habit-orange-foreground border-habit-orange-border',
    anchor: 'bg-habit-indigo text-habit-indigo-foreground border-habit-indigo-border',
  };
  const categoryClasses = categoryColorMap[template.category] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">{template.name}</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-1">
                {template.shortDescription}
              </DialogDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", categoryClasses)}>
              <CategoryIcon className="w-3 h-3 inline-block mr-1" />
              {habitCategories.find(cat => cat.value === template.category)?.label || template.category}
            </span>
            {template.anchorPractice && (
              <span className="px-3 py-1 rounded-full text-xs font-bold border bg-habit-indigo text-habit-indigo-foreground border-habit-indigo-border">
                <Anchor className="w-3 h-3 inline-block mr-1" />
                Anchor Practice
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-primary" />
              <span>Daily Goal: {template.defaultDuration} {template.unit}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Repeat className="w-4 h-4 text-primary" />
              <span>Frequency: {template.defaultFrequency}x / week</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ModeIcon className="w-4 h-4 text-primary" />
              <span>Mode: {template.defaultMode}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Layers className="w-4 h-4 text-primary" />
              <span>Chunks: {template.defaultChunks} {template.autoChunking ? '(Auto)' : '(Manual)'}</span>
            </div>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl border border-border space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Info className="w-4 h-4 text-muted-foreground" />
              <span>Growth Logic</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This habit starts in {template.defaultMode} mode. It requires {template.plateauDaysRequired} days of consistency before suggesting goal adjustments.
            </p>
          </div>
        </div>

        <Button 
          className="w-full rounded-xl h-11 font-semibold mt-6"
          onClick={() => onUseTemplate(template)}
        >
          Use This Template <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </DialogContent>
    </Dialog>
  );
};