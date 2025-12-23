"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  backLink?: string;
  showHomeLink?: boolean;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  backLink,
  showHomeLink = false
}) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-2">
        {backLink ? (
          <Link to={backLink}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        ) : (
          <div className="w-10"></div>
        )}
        
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      </div>
      
      {showHomeLink ? (
        <Link to="/">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Home className="w-5 h-5" />
          </Button>
        </Link>
      ) : (
        <div className="w-10"></div>
      )}
    </div>
  );
};