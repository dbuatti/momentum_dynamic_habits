"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Info, Clock, Repeat, Target, Anchor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HabitTemplate, habitCategories, habitIcons } from '@/lib/habit-templates';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TemplateCardProps {
  template: HabitTemplate;
  onUseTemplate: (template: HabitTemplate) => void;
  onPreviewDetails: (template: HabitTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onUseTemplate, onPreviewDetails }) => {
  const CategoryIcon = habitCategories.find(cat => cat.value === template.category)?.icon || Target;
  const IconComponent = habitIcons.find(icon => icon.value === template.icon_name)?.icon || Target;

  const categoryColorMap: Record<string, string> = {
    cognitive: 'bg-habit-blue text-habit-blue-foreground border-habit-blue-border',
    physical: 'bg-habit-green text-habit-green-foreground border-habit-green-border',
    wellness: 'bg-habit-purple text-habit-purple-foreground border-habit-purple-border',
    daily: 'bg-habit-orange text-habit-orange-foreground border-habit-orange-border',
    anchor: 'bg-habit-indigo text-habit-indigo-foreground border-habit-indigo-border',
  };

  const categoryClasses = categoryColorMap[template.category] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <Card className="rounded-2xl shadow-sm border-0 hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">{template.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border", categoryClasses)}>
                  <CategoryIcon className="w-3 h-3 inline-block mr-1" />
                  {habitCategories.find(cat => cat.value === template.category)?.label || template.category}
                </span>
                {template.anchorPractice && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold border bg-habit-indigo text-habit-indigo-foreground border-habit-indigo-border">
                    <Anchor className="w-3 h-3 inline-block mr-1" />
                    Anchor
                  </span>
                )}
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onPreviewDetails(template)}
          >
            <Info className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{template.shortDescription}</p>

        <div className="grid grid-cols-2 gap-4 text-sm font-medium text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>{template.defaultDuration} {template.unit}</span>
          </div>
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-primary" />
            <span>{template.defaultFrequency}x / week</span>
          </div>
        </div>

        <Button 
          className="w-full rounded-xl h-11 font-semibold mt-4"
          onClick={() => onUseTemplate(template)}
        >
          Use This Template <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};