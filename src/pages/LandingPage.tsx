"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Anchor, FlaskConical, Layers, Trophy, Brain, 
  CheckCircle2, ArrowRight, Zap, Target, MousePointer2,
  Sparkles // Add this
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DashboardScreenshot = () => (
  <div className="relative group max-w-5xl mx-auto">
    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-primary rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
    <div className="relative w-full aspect-video bg-white rounded-2xl flex flex-col border border-slate-200 shadow-2xl overflow-hidden">
      <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-4 gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
      </div>
      <div className="flex-grow flex items-center justify-center bg-slate-50/50 p-8">
        <div className="text-center">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Next Up</p>
                        <p className="font-black text-slate-900">10min Meditation</p>
                    </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 w-2/3" />
                </div>
            </div>
            <p className="mt-4 text-xs font-bold text-slate-400 italic">Adaptive Dashboard Preview</p>
        </div>
      </div>
    </div>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-black text-xl tracking-tighter text-slate-900 uppercase">Dyad</span>
          </div>
          <Link to="/login">
            <Button variant="ghost" className="font-bold text-slate-600">Login</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 mb-4">
            <Sparkles className="w-4 h-4" /> {/* <-- TypeScript compiler error here */}
            <span className="text-[10px] font-black uppercase tracking-widest">Built for ADHD & Neurodivergence</span>
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter text-slate-900 max-w-4xl mx-auto">
            Build habits your <br />
            brain can <span className="text-indigo-600">actually keep.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed">
            The first modular habit tracker that adapts to your energy, reduces overwhelm, and grows with you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="h-16 px-10 text-lg rounded-2xl font-black bg-slate-900 hover:bg-slate-800 text-white shadow-2xl shadow-slate-200 transition-all hover:scale-105 active:scale-95">
                Start for Free <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                No credit card required
            </div>
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-400/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        </div>
      </section>

      {/* Feature Bento Grid */}
      <section className="py-24 bg-slate-50 border-y border-slate-100">
        <div className="container mx-auto px-6 max-w-6xl space-y-16">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6">
              Designed for consistency, <br />
              <span className="text-slate-400">not perfection.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2 rounded-[32px] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-12">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                  <Anchor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Anchor Practices</h3>
                  <p className="text-slate-500 font-medium leading-relaxed max-w-md">
                    Foundation first. Build routines with zero pressure by prioritizing "Anchor" habits that keep you grounded during chaotic days.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="rounded-[32px] border-none shadow-sm bg-slate-900 p-8 group overflow-hidden relative">
              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Trial Mode</h3>
                  <p className="text-slate-400 font-medium leading-relaxed">
                    Test new habits in a "Sandbox" environment before they impact your main stats.
                  </p>
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl" />
            </Card>

            <Card className="rounded-[32px] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500">
                <div className="h-full flex flex-col justify-between space-y-12">
                <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center">
                    <Layers className="w-7 h-7 text-white" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Modular Capsules</h3>
                    <p className="text-slate-500 font-medium leading-relaxed">
                    Break big tasks into tiny, bite-sized capsules. Finish one, get the XP, keep the momentum.
                    </p>
                </div>
                </div>
            </Card>

            <Card className="md:col-span-2 rounded-[32px] border-none shadow-sm bg-white p-8 group hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-grow space-y-6">
                    <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 mb-3 uppercase tracking-tight">Adaptive Growth</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            Our system monitors your consistency. It suggests scaling up when you're on fire, and scaling back when life gets heavy.
                        </p>
                    </div>
                </div>
                <div className="w-full md:w-1/3 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-400">Streak Stability</span>
                        <span className="text-xs font-black text-slate-900">85%</span>
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-orange-500 w-[85%]" />
                    </div>
                </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Neurodivergent Mode */}
      <section className="py-32 bg-white">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="relative p-1 rounded-[40px] bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            <div className="bg-white rounded-[38px] p-10 md:p-16 flex flex-col md:flex-row items-center gap-12">
                <div className="shrink-0">
                    <div className="w-32 h-32 rounded-3xl bg-slate-900 flex items-center justify-center shadow-2xl rotate-3">
                        <Brain className="w-16 h-16 text-white" />
                    </div>
                </div>
                <div className="space-y-6 text-center md:text-left">
                    <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase">Neurodivergent <br /> Optimized.</h3>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                        Switch on <span className="font-bold text-slate-900 underline decoration-indigo-500 underline-offset-4">ND Mode</span> to enable ultra-small habit increments, longer stabilization plateaus, and dopamine-tuned task capsules.
                    </p>
                    <Button variant="link" className="p-0 h-auto font-black text-indigo-600 uppercase tracking-widest text-xs">
                        See how it works <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="container mx-auto px-6 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight">Your Adaptive Cockpit</h2>
            <p className="text-slate-500 font-bold">One place to track, stabilize, and grow.</p>
          </div>
          <DashboardScreenshot />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-slate-900 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase">
            Start your last <br />
            <span className="text-indigo-400">habit tracker.</span>
          </h2>
          <p className="text-xl text-slate-400 max-w-xl mx-auto font-medium">
            Join the journey of adaptive growth and stop fighting your brain's natural rhythm.
          </p>
          <Button size="lg" className="h-20 px-12 text-2xl rounded-3xl font-black bg-white text-slate-900 hover:bg-indigo-50 transition-all shadow-3xl">
            Get Started Now
          </Button>
        </div>
        
        {/* Abstract shapes */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-500/10 blur-[100px] -rotate-12" />
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-primary/10 blur-[100px] rotate-12" />
      </section>

      {/* Footer */}
      <footer className="py-20 bg-white border-t border-slate-100">
        <div className="container mx-auto px-6 max-w-6xl grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-black text-lg tracking-tighter text-slate-900 uppercase">Dyad</span>
                </div>
                <p className="text-xs font-bold text-slate-400 leading-relaxed uppercase tracking-widest">
                    The science of habit <br /> for the neurodivergent brain.
                </p>
            </div>
            <div className="grid grid-cols-2 md:col-span-3 gap-8">
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</h4>
                    <ul className="space-y-2 text-sm font-bold text-slate-600">
                        <li><Link to="/help">Features</Link></li>
                        <li><Link to="/help">Methodology</Link></li>
                    </ul>
                </div>
                <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Company</h4>
                    <ul className="space-y-2 text-sm font-bold text-slate-600">
                        <li><Link to="/help">Privacy</Link></li>
                        <li><Link to="/help">Terms</Link></li>
                        <li><Link to="/help">Contact</Link></li>
                    </ul>
                </div>
            </div>
        </div>
        <div className="container mx-auto px-6 mt-20 pt-8 border-t border-slate-50 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                &copy; {new Date().getFullYear()} Dyad Adaptive Growth. All rights reserved.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;