"use client";

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  PlusCircle,
  Search,
  Filter,
  AlertCircle,
  Target,
  Users,
  Sparkles,
} from 'lucide-react';

import { useTemplates } from '@/hooks/useTemplates';
import { TemplateCard } from '@/components/templates/TemplateCard';
import { TemplateDetailModal } from '@/components/templates/TemplateDetailModal';
import { HabitTemplate, habitCategories } from '@/lib/habit-templates';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<HabitTemplate | null>(null);

  const { data: templates = [], isLoading, isError, error } = useTemplates({
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    searchQuery: searchQuery.trim() || undefined,
  });

  const handleUseTemplate = (template: HabitTemplate) => {
    navigate('/create-habit', { state: { templateToPreFill: template } });
  };

  const handleContributeTemplate = () => {
    navigate('/create-habit', { state: { mode: 'template' } });
  };

  // Memoized filtered count for better performance
  const templateCount = useMemo(() => templates.length, [templates]);

  // Loading skeletons
  const loadingSkeletons = Array(6).fill(null);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 pb-24">

      {/* Hero Section */}
      <div className="text-center space-y-4 mb-10">
        <h2 className="text-3xl font-bold tracking-tight">Start Strong with Community Templates</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Discover proven habits crafted by the community, or share your own successful routines.
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Users className="w-4 h-4" />
          <span>{templateCount} {templateCount === 1 ? 'template' : 'templates'} available</span>
          <Sparkles className="w-4 h-4 ml-4" />
          <span>Community contributed</span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="max-w-3xl mx-auto space-y-6 mb-10">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, goal, or keyword..."
              className="pl-12 h-12 rounded-2xl bg-muted/50 border-0 text-base"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-56 h-12 rounded-2xl bg-muted/50 border-0">
              <Filter className="w-5 h-5 mr-2" />
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {habitCategories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex items-center gap-3">
                    <cat.icon className="w-5 h-5" />
                    {cat.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contribute CTA */}
        <Button
          size="lg"
          className="w-full h-14 rounded-2xl text-lg font-semibold shadow-lg"
          onClick={handleContributeTemplate}
        >
          <PlusCircle className="w-6 h-6 mr-3" />
          Contribute Your Template
        </Button>
      </div>

      {/* Templates Grid */}
      <section className="mt-12">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingSkeletons.map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <Skeleton className="h-32 w-full rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="max-w-2xl mx-auto rounded-3xl p-10 text-center shadow-lg">
            <CardContent className="space-y-6">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Failed to Load Templates</h3>
                <p className="text-muted-foreground">
                  Something went wrong while fetching templates. Please try again.
                </p>
              </div>
              <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : templates.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUseTemplate={handleUseTemplate}
                onPreviewDetails={setSelectedTemplate}
              />
            ))}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto rounded-3xl p-12 text-center shadow-lg border-dashed">
            <CardContent className="space-y-6">
              <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto">
                <Target className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-3">No Templates Found</h3>
                <p className="text-muted-foreground text-lg">
                  {searchQuery || categoryFilter !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Be the first to contribute a template to the community!'}
                </p>
              </div>
              {(searchQuery || categoryFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </section>

      {/* Detail Modal */}
      <TemplateDetailModal
        template={selectedTemplate}
        isOpen={!!selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  );
};

export default TemplatesPage;