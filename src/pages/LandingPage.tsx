"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Anchor, FlaskConical, Layers, Trophy, Brain,
  ArrowRight, Zap, Sparkles, MessageSquare,
  BookOpen, Wind, Dumbbell, Clock
} from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LandingPage = () => {
  return (
    <div className="min-h-screen landing-page-theme bg-background text-foreground selection:bg-landing-indigo/30">

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-landing-indigo rounded-lg flex items-center justify-center shadow-lg shadow-landing-indigo/20">
              <Zap className="w-5 h-5 text-landing-primary-foreground" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">Adaptive Growth</span>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="font-bold text-muted-foreground hover:text-foreground">Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-landing-indigo/10 border border-landing-indigo/20 text-landing-indigo mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Built for ADHD & Neurodivergence</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter max-w-4xl mx-auto">
            Build habits your <br />
            brain can <span className="text-landing-indigo">actually keep.</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-medium leading-relaxed">
            The first modular habit tracker that adapts to your energy, reduces overwhelm, and grows with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/login">
              <Button size="lg" className="h-16 px-10 text-lg rounded-2xl font-black bg-landing-indigo hover:bg-landing-indigo/90 text-white shadow-[0_0_40px_-10px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95">
                Get Started <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/help">
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl font-black border-border text-muted-foreground hover:bg-accent hover:text-foreground transition-all hover:scale-105 active:scale-95">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Deep Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-landing-indigo/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-landing-purple/10 rounded-full blur-[140px]" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-accent/30 border-y border-border">
        <div className="container mx-auto px-6 max-w-6xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">How it Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Adaptive Growth is designed to meet you where you are, making habit building accessible and sustainable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Card: Anchor Practices */}
            <Card className="rounded-[32px] border border-border bg-card/50 p-8 group hover:border-landing-indigo/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-indigo rounded-2xl flex items-center justify-center shadow-lg shadow-landing-indigo/20 group-hover:rotate-6 transition-transform">
                  <Anchor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Anchor Practices</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Designate core habits that keep you grounded and consistent, even on chaotic days.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Trial Mode */}
            <Card className="rounded-[32px] border border-landing-indigo/30 bg-landing-indigo/10 p-8 group overflow-hidden relative">
              <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-indigo rounded-2xl flex items-center justify-center shadow-md">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Trial Mode</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Start new habits in a low-pressure phase, focusing on consistency until it feels routine.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Capsules */}
            <Card className="rounded-[32px] border border-border bg-card/50 p-8 group hover:border-info/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-indigo rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Modular Capsules</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Break down larger goals into smaller, manageable "capsules" to reduce overwhelm and build momentum.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Adaptive Growth */}
            <Card className="rounded-[32px] border border-border bg-card/50 p-8 group hover:border-landing-green/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-green rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Adaptive Growth</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Your goals adjust dynamically to your actual progress, preventing burnout and ensuring sustainable growth.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: XP & Streaks */}
            <Card className="rounded-[32px] border border-border bg-card/50 p-8 group hover:border-landing-orange/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-orange rounded-2xl flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">XP & Streaks</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Gamified progress and micro-rewards keep you motivated and celebrate every step of your journey.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Neurodivergent Mode */}
            <Card className="rounded-[32px] border border-border bg-card/50 p-8 group hover:border-landing-purple/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-landing-purple rounded-2xl flex items-center justify-center shadow-lg shadow-landing-purple/20 group-hover:rotate-6 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-3 uppercase tracking-tight">Neurodivergent Mode</h3>
                  <p className="text-muted-foreground font-medium leading-relaxed">
                    Tailored settings for ADHD and neurodivergent individuals to reduce overwhelm and support consistency.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Dynamic Habit Examples */}
      <section className="py-24 container mx-auto px-6 max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">See It In Action</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A glimpse into how Adaptive Growth helps you manage your daily habits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-landing-green/20 flex items-center justify-center border border-landing-green/30">
                <BookOpen className="w-6 h-6 text-landing-green" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Study Session</h3>
                <p className="text-sm text-muted-foreground">Cognitive Growth</p>
              </div>
            </div>
            <div className="bg-accent rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-landing-green">25<span className="text-xl">min</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress: 1/2 capsules</span>
              <span className="text-landing-green font-semibold">50%</span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div className="bg-landing-green h-full rounded-full w-1/2"></div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-landing-indigo/20 flex items-center justify-center border border-landing-indigo/30">
                <Wind className="w-6 h-6 text-landing-indigo" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Morning Meditation</h3>
                <p className="text-sm text-muted-foreground">Wellness Anchor</p>
              </div>
            </div>
            <div className="bg-accent rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-landing-indigo">10<span className="text-xl">min</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress: Completed!</span>
              <span className="text-landing-indigo font-semibold">100%</span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div className="bg-landing-indigo h-full rounded-full w-full"></div>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-landing-orange/20 flex items-center justify-center border border-landing-orange/30">
                <Dumbbell className="w-6 h-6 text-landing-orange" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Push-ups</h3>
                <p className="text-sm text-muted-foreground">Physical Daily</p>
              </div>
            </div>
            <div className="bg-accent rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-landing-orange">30<span className="text-xl">reps</span></p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div className="bg-landing-orange h-full rounded-full w-1/2"></div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-accent/30 border-y border-border">
        <div className="container mx-auto px-6 max-w-4xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from people transforming their habits with Adaptive Growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
              <MessageSquare className="w-8 h-8 text-landing-indigo" />
              <p className="leading-relaxed italic">
                "This app finally helped me stick to meditation. The 'Trial Mode' took all the pressure off, and the small increments actually work for my ADHD brain."
              </p>
              <p className="font-semibold">- Alex P.</p>
            </Card>
            <Card className="rounded-2xl border border-border bg-card/50 p-6 space-y-4">
              <MessageSquare className="w-8 h-8 text-landing-indigo" />
              <p className="leading-relaxed italic">
                "I used to dread my project work, but breaking it into capsules made it so much more manageable. I'm actually making consistent progress now!"
              </p>
              <p className="font-semibold">- Jamie L.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 container mx-auto px-6 max-w-4xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter">Frequently Asked Questions</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border-b border-border">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
              What's the difference between Trial, Growth, and Fixed modes?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              <p>
                <strong>Trial Mode:</strong> Focuses purely on consistency. There's no pressure to increase your goal; your only job is to show up. This mode helps you anchor new habits without overwhelm.
              </p>
              <p className="mt-2">
                <strong>Adaptive Growth Mode:</strong> Once a habit is stable, the system suggests small, adaptive increments to your goal. If you struggle, growth pauses automatically to prevent burnout.
              </p>
              <p className="mt-2">
                <strong>Fixed (Maintenance) Mode:</strong> For habits with an ideal, unchanging goal. The system focuses on maintaining consistency without any goal adjustments.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-border">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
              What are Anchor Practices?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              Anchor Practices are core habits you designate to keep you grounded and consistent, especially during busy or chaotic periods.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b border-border">
            <AccordionTrigger className="text-lg font-semibold hover:no-underline py-4">
              How do Capsules prevent overwhelm?
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed pb-4">
              Capsules break down larger habit sessions into smaller, more manageable chunks. For example, a 30-minute meditation might become three 10-minute capsules.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-background relative overflow-hidden border-t border-border">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black leading-none tracking-tighter uppercase">
            Start your last <br />
            <span className="text-landing-indigo">habit tracker.</span>
          </h2>
          <Link to="/login">
            <Button size="lg" className="h-20 px-12 text-2xl rounded-3xl font-black bg-white text-black hover:bg-white/90 transition-all">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent/50 border-t border-border py-12">
        <div className="container mx-auto px-6 text-center text-muted-foreground space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-landing-indigo rounded-md flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase italic">Adaptive Growth</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Adaptive Growth. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;