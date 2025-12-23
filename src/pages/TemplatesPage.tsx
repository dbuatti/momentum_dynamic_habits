"use client";

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Search, Filter, AlertCircle, Loader2, Target } from 'lucide-react';
import { useTemplates } from '@/hooks/useTemplates';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateDetailModal } from '@/components/templates/TemplateDetailModal';
import { HabitTemplate, habitCategories } from '@/lib/habit-templates';
import { Card, CardContent } from '@/components/ui/card';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedTemplateForPreview, setSelectedTemplateForPreview] = useState<HabitTemplate | null>(null);

  const { data: templates, isLoading, isError } = useTemplates({
    category: categoryFilter,
    searchQuery: searchQuery,
  });

  const handleUseTemplate = (template: HabitTemplate) => {
    navigate('/create-habit', { state: { templateToPreFill: template } });
  };

  const handleContributeTemplate = () => {
    navigate('/create-habit', { state: { mode: 'template' } });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 bg-background">
        <AlertCircle className="w-12 h-12 text-destructive mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-foreground">Could not load Templates</h2>
        <p className="text-lg text-muted-foreground">There was an error fetching habit templates. Please try again later.</p>
        <Link to="/"><Button variant="outline" className="mt-4">Go Home</Button></Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-8 pb-32">
      <PageHeader title="Habit Templates" backLink="/" />

      <div className="space-y-4">
        <p className="text-muted-foreground text-center">Browse pre-made habits or contribute your own to the community.</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              className="pl-9 h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px] h-11 rounded-xl">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {habitCategories.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-2">
                    <cat.icon className="w-4 h-4" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button 
        className="w-full rounded-xl h-11 font-semibold"
        onClick={handleContributeTemplate}
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Contribute a Template
      </Button>

      {templates && templates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onUseTemplate={handleUseTemplate}
              onPreviewDetails={setSelectedTemplateForPreview}
            />
          ))}
        </div>
      ) : (
        <Card className="rounded-2xl p-8 text-center shadow-sm border-0">
          <CardContent className="p-0 space-y-4">
            <Target className="w-16 h-16 text-muted-foreground mx-auto" />
            <p className="text-xl font-semibold text-foreground">No templates found</p>
            <p className="text-muted-foreground">Try adjusting your filters or be the first to contribute!</p>
          </CardContent>
        </Card>
      )}

      <TemplateDetailModal
        template={selectedTemplateForPreview}
        isOpen={!!selectedTemplateForPreview}
        onClose={() => setSelectedTemplateForPreview(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
};

export default TemplatesPage;