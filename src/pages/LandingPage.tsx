"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Anchor, FlaskConical, Layers, Trophy, Brain,
  CheckCircle2, ArrowRight, Zap, Sparkles, MessageSquare, Lightbulb,
  Dumbbell, Wind, BookOpen, Music, Home, Code, ShieldCheck, Clock, Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const LandingPage = () => {
  return (
    // Updated background to a deep Slate 950 for better ND comfort
    <div className="min-h-screen bg-[#020617] text-slate-50 selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Navigation - Glassmorphism on Dark */}
      <nav className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-white uppercase italic">Adaptive Growth</span>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="font-bold text-slate-400 hover:text-white hover:bg-slate-800">Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Using Gradients for Depth */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Built for ADHD & Neurodivergence</span>
          </div>

          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter text-white max-w-4xl mx-auto">
            Build habits your <br />
            brain can <span className="text-indigo-500">actually keep.</span>
          </h1>

          <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            The first modular habit tracker that adapts to your energy, reduces overwhelm, and grows with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link to="/login">
              <Button size="lg" className="h-16 px-10 text-lg rounded-2xl font-black bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_40px_-10px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95">
                Start Free Trial <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link to="/help">
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg rounded-2xl font-black border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all hover:scale-105 active:scale-95">
                Learn More
              </Button>
            </Link>
          </div>
        </div>

        {/* Deep Glow Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px]" />
        </div>
      </section>

      {/* Features Section - Using Gradients for Depth */}
      <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="container mx-auto px-6 max-w-6xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">How it Works</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Adaptive Growth is designed to meet you where you are, making habit building accessible and sustainable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Feature Card: Anchor Practices */}
            <Card className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-indigo-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                  <Anchor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Anchor Practices</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Foundation first. Designate core habits that keep you grounded during chaotic days.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Trial Mode */}
            <Card className="rounded-[32px] border border-indigo-500/30 bg-indigo-600/10 p-8 group overflow-hidden relative">
              <div className="relative z-10 h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Trial Mode</h3>
                  <p className="text-indigo-100/70 font-medium leading-relaxed">
                    Test new habits in a low-pressure sandbox before they impact your main stats.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Capsules */}
            <Card className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-blue-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-transform">
                  <Layers className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Modular Capsules</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Break big habits into smaller, manageable "capsules" to reduce overwhelm and build consistency.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Adaptive Growth */}
            <Card className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-green-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:rotate-6 transition-transform">
                  <Zap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Adaptive Growth</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Your goals adjust dynamically to your progress, preventing burnout and ensuring sustainable growth.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: XP & Streaks */}
            <Card className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-yellow-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-yellow-600 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:rotate-6 transition-transform">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">XP & Streaks</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Gamified progress and micro-rewards keep you motivated and celebrate every step of your journey.
                  </p>
                </div>
              </div>
            </Card>

            {/* Feature Card: Neurodivergent Mode */}
            <Card className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-purple-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-8">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:rotate-6 transition-transform">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Neurodivergent Mode</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Tailored settings for ADHD and neurodivergent individuals to reduce overwhelm and support consistency.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Dynamic Habit Examples Section */}
      <section className="py-24 container mx-auto px-6 max-w-6xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">See It In Action</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            A glimpse into how Adaptive Growth helps you manage your daily habits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Habit Card 1 */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-600/20 flex items-center justify-center border border-green-500/30">
                <BookOpen className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Study Session</h3>
                <p className="text-sm text-slate-400">Cognitive Growth</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-green-400">25<span className="text-xl">min</span></p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Progress: 1/2 capsules</span>
              <span className="text-green-400 font-semibold">50%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-green-500 h-full rounded-full w-1/2"></div>
            </div>
          </Card>

          {/* Example Habit Card 2 */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Wind className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Morning Meditation</h3>
                <p className="text-sm text-slate-400">Wellness Anchor</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-blue-400">10<span className="text-xl">min</span></p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Progress: Completed!</span>
              <span className="text-blue-400 font-semibold">100%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-blue-500 h-full rounded-full w-full"></div>
            </div>
          </Card>

          {/* Example Habit Card 3 */}
          <Card className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-orange-600/20 flex items-center justify-center border border-orange-500/30">
                <Dumbbell className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-white">Push-ups</h3>
                <p className="text-sm text-slate-400">Physical Daily</p>
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-4 text-center">
              <p className="text-4xl font-black text-orange-400">30<span className="text-xl">reps</span></p>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Daily Goal</p>
            </div>
            <div className="flex items-center justify-between text-sm text-slate-400">
              <span>Progress: 15/30 reps</span>
              <span className="text-orange-400 font-semibold">50%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-orange-500 h-full rounded-full w-1/2"></div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials / Social Proof Section */}
      <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="container mx-auto px-6 max-w-4xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">What Our Users Say</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Real stories from people transforming their habits with Adaptive Growth.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
              <p className="text-slate-300 leading-relaxed italic">
                "This app finally helped me stick to meditation. The 'Trial Mode' took all the pressure off, and the small increments actually work for my ADHD brain."
              </p>
              <p className="font-semibold text-white">- Alex P.</p>
            </Card>
            <Card className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
              <MessageSquare className="w-8 h-8 text-indigo-500" />
              <p className="text-slate-300 leading-relaxed italic">
                "I used to dread my project work, but breaking it into capsules made it so much more manageable. I'm actually making consistent progress now!"
              </p>
              <p className="font-semibold text-white">- Jamie L.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 container mx-auto px-6 max-w-4xl space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Frequently Asked Questions</h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Got questions? We've got answers.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          <AccordionItem value="item-1" className="border-b border-slate-800">
            <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
              What's the difference between Trial, Growth, and Fixed modes?
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 leading-relaxed pb-4">
              <p>
                <strong>Trial Mode:</strong> Focuses purely on consistency. There's no pressure to increase your goal; your only job is to show up. This mode helps you anchor new habits without overwhelm.
              </p>
              <p className="mt-2">
                <strong>Adaptive Growth Mode:</strong> Once a habit is stable, the system suggests small, adaptive increments to your goal (duration or reps) or frequency. If you struggle, growth pauses automatically to prevent burnout.
              </p>
              <p className="mt-2">
                <strong>Fixed (Maintenance) Mode:</strong> For habits with an ideal, unchanging goal (e.g., brushing teeth for 2 minutes). The system focuses on maintaining consistency without any goal adjustments.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="border-b border-slate-800">
            <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
              What are Anchor Practices?
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 leading-relaxed pb-4">
              Anchor Practices are core habits you designate to keep you grounded and consistent, especially during busy or chaotic periods. They are prioritized on your dashboard and are designed to be foundational to your routine.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="border-b border-slate-800">
            <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
              How do Capsules prevent overwhelm?
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 leading-relaxed pb-4">
              Capsules break down larger habit sessions into smaller, more manageable chunks. For example, a 30-minute meditation might become three 10-minute capsules. This makes starting and completing tasks less daunting, especially for neurodivergent individuals, by focusing on one small part at a time.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="border-b border-slate-800">
            <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
              How do XP, streaks, and leveling work?
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 leading-relaxed pb-4">
              Every completed habit session earns you Experience Points (XP). Accumulate XP to level up, unlocking new insights and celebrating your journey. Maintaining consistency builds your daily streak, and achieving specific milestones earns you special badges, providing micro-rewards and motivation.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="border-b border-slate-800">
            <AccordionTrigger className="text-lg font-semibold text-white hover:no-underline py-4">
              Is there a Neurodivergent Mode?
            </AccordionTrigger>
            <AccordionContent className="text-slate-400 leading-relaxed pb-4">
              Yes! Our Neurodivergent Mode optimizes the app for individuals with ADHD and other neurodivergent profiles. It enables smaller habit increments, longer stabilization plateaus, and modular task capsules to reduce overwhelm, support consistent engagement, and make habit building more accessible.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Final CTA - High Contrast */}
      <section className="py-32 bg-[#020617] relative overflow-hidden border-t border-slate-800">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase">
            Start your last <br />
            <span className="text-indigo-500">habit tracker.</span>
          </h2>
          <Link to="/login">
            <Button size="lg" className="h-20 px-12 text-2xl rounded-3xl font-black bg-white text-[#020617] hover:bg-slate-200 transition-all">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-800/50 py-12">
        <div className="container mx-auto px-6 text-center text-slate-400 space-y-6">
          <div className="flex items-center justify-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg tracking-tighter text-white uppercase italic">Adaptive Growth</span>
          </div>
          <p className="text-sm">&copy; {new Date().getFullYear()} Adaptive Growth. All rights reserved.</p>
          <div className="flex justify-center space-x-6 text-sm font-medium">
            <Link to="/help" className="hover:text-white transition-colors">Help</Link>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <div className="flex justify-center space-x-4 mt-4">
            {/* Placeholder for social icons */}
            <a href="#" aria-label="Twitter" className="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17-18 11.6 2.2.1 4.4-.6 6-2 1.1-1.1 1.8-2.5 2-4 2.2.2 4.4-.4 6-2 1.1-1.1 1.8-2.5 2-4z"/></svg></a>
            <a href="#" aria-label="LinkedIn" className="text-slate-400 hover:text-white"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-linkedin"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg></a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;