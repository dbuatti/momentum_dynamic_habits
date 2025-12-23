"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Anchor, FlaskConical, Layers, Trophy, Brain, CheckCircle2,
  Dumbbell, Wind, BookOpen, Music, Home, Code, Sparkles, Pill,
  ArrowRight, Lightbulb, Settings, HelpCircle, Mail, Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Placeholder for a dashboard screenshot
const DashboardScreenshot = () => (
  <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center text-muted-foreground text-sm italic border border-primary/20 shadow-inner">
    [Dashboard Screenshot Placeholder]
  </div>
);

const FeatureCard = ({ icon: Icon, title, description, colorClass }: { icon: React.ElementType, title: string, description: string, colorClass: string }) => (
  <Card className="rounded-2xl shadow-sm border-0 bg-card/50 backdrop-blur-sm">
    <CardContent className="p-6 space-y-4">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClass)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-bold text-foreground">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </CardContent>
  </Card>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 text-center overflow-hidden bg-gradient-to-br from-primary/5 to-background">
        <div className="container mx-auto px-4 max-w-3xl space-y-8">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tighter text-foreground">
            Build habits your brain can <span className="text-primary">stick to.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An ADHD-friendly, modular habit tracker with adaptive growth, designed to make consistency effortless.
          </p>
          <Link to="/login">
            <Button size="lg" className="h-14 px-8 text-lg rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-xl transition-all">
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Feature Highlights Section */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">Designed for Sustainable Growth</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We understand that building habits can be challenging. Our unique approach adapts to you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
            <FeatureCard
              icon={Anchor}
              title="Anchor Practices"
              description="Establish new routines with zero pressure. Focus on showing up, not on perfection, until it feels natural and effortless."
              colorClass="bg-blue-500"
            />
            <FeatureCard
              icon={FlaskConical}
              title="Trial Mode"
              description="Test new habits in a low-stakes environment. The app intelligently learns your pace before suggesting any growth."
              colorClass="bg-green-500"
            />
            <FeatureCard
              icon={Layers}
              title="Capsules & Chunking"
              description="Break down overwhelming tasks into small, manageable 'capsules' or chunks for easier completion and reduced overwhelm."
              colorClass="bg-purple-500"
            />
            <FeatureCard
              icon={Trophy}
              title="Gamified Progress"
              description="Stay motivated with XP, levels, and streaks. Watch your progress grow and earn special badges for your dedication."
              colorClass="bg-orange-500"
            />
          </div>
        </div>
      </section>

      {/* Neurodivergent Mode Highlight */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <Card className="rounded-3xl shadow-xl border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-950/10 p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/3 flex justify-center">
              <div className="w-24 h-24 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
                <Brain className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="md:w-2/3 text-center md:text-left space-y-4">
              <h3 className="text-3xl font-bold text-foreground">Neurodivergent-Friendly Design</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Our optional Neurodivergent Mode optimizes the app with smaller habit increments, longer stabilization plateaus, and modular task capsules to reduce overwhelm and support consistent engagement.
              </p>
              <Link to="/settings" className="inline-flex items-center text-primary font-semibold hover:underline">
                Learn more about Neurodivergent Mode <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Screenshots / Demo Section */}
      <section className="py-16 md:py-24 bg-muted/20">
        <div className="container mx-auto px-4 max-w-5xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">See Adaptive Growth in Action</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              A sneak peek into your personalized dashboard and habit tracking experience.
            </p>
          </div>
          <DashboardScreenshot />
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 md:py-24 bg-primary text-primary-foreground text-center">
        <div className="container mx-auto px-4 max-w-3xl space-y-8">
          <h2 className="text-4xl md:text-5xl font-extrabold leading-tight tracking-tighter">
            Ready to transform your habits?
          </h2>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Join thousands of users building lasting routines with a system that truly understands.
          </p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="h-16 px-10 text-xl rounded-full font-bold shadow-lg shadow-black/20 hover:shadow-xl transition-all">
              Sign Up Now <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-card border-t border-border">
        <div className="container mx-auto px-4 max-w-5xl text-center text-muted-foreground space-y-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium">
            <Link to="/help" className="hover:text-foreground transition-colors flex items-center gap-1">
              <HelpCircle className="w-4 h-4" /> Help
            </Link>
            <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Lock className="w-4 h-4" /> Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Settings className="w-4 h-4" /> Terms of Service
            </a>
            <a href="#" className="hover:text-foreground transition-colors flex items-center gap-1">
              <Mail className="w-4 h-4" /> Contact
            </a>
          </div>
          <p className="text-xs">&copy; {new Date().getFullYear()} Adaptive Growth Coach. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;