"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backLink?: string; // Optional link for a back button
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, backLink }) => {
  return (
    <div className="flex items-center justify-between mb-6">
      {backLink ? (
        <Link to={backLink}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
      ) : (
        <div className="w-10"></div> // Placeholder for alignment if no back button
      )}
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <div className="w-10"></div> {/* Placeholder for alignment */}
    </div>
  );
};