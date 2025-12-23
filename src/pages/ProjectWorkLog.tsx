import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code, BarChart3, ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ProjectWorkLog = () => {
  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto px-4 py-6">
      <div className="w-full space-y-8">
        <PageHeader title="Project Work Analytics" backLink="/" />
        
        <Card className="rounded-2xl shadow-lg border-4 border-habit-indigo overflow-hidden">
          <CardHeader className="p-8 text-center">
            <div className="bg-indigo-50 rounded-full w-24 h-24 flex items-center justify-center mb-6 mx-auto">
              <Code className="w-12 h-12 text-indigo-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-habit-indigo">
              Project Work Historical Data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 pt-0 text-center space-y-4">
            <p className="text-muted-foreground">
              This page will soon display detailed historical data, trends, and insights for your Project Work habit.
              For daily tracking, please use the main dashboard.
            </p>
            <div className="flex justify-center">
              <Link to="/">
                <Button className="bg-habit-indigo hover:bg-habit-indigo/90 text-habit-indigo-foreground text-lg py-6 rounded-2xl">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for future charts/data */}
        <Card className="rounded-2xl shadow-sm border-0">
          <CardHeader className="p-5 pb-3">
            <CardTitle className="font-semibold text-lg flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-muted-foreground" />
              Coming Soon: Performance Graphs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-0 text-muted-foreground">
            Detailed charts showing your progress over time, weekly averages, and more will appear here.
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProjectWorkLog;