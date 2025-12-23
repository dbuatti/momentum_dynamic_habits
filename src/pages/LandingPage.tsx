"use client";

import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Anchor, FlaskConical, Layers, Trophy, Brain, 
  CheckCircle2, ArrowRight, Zap, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
            <span className="font-black text-xl tracking-tighter text-white uppercase italic">Dyad</span>
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
                Start for Free <ArrowRight className="ml-2 h-6 w-6" />
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

      {/* Bento Grid - Elevated Surfaces */}
      <section className="py-24 bg-slate-900/30 border-y border-slate-800/50">
        <div className="container mx-auto px-6 max-w-6xl space-y-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Main Feature Card */}
            <Card className="md:col-span-2 rounded-[32px] border border-slate-800 bg-slate-900/50 p-8 group hover:border-indigo-500/50 transition-all duration-500">
              <div className="h-full flex flex-col justify-between space-y-12">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:rotate-6 transition-transform">
                  <Anchor className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Anchor Practices</h3>
                  <p className="text-slate-400 font-medium leading-relaxed max-w-md">
                    Foundation first. Build routines with zero pressure by prioritizing habits that keep you grounded during chaotic days.
                  </p>
                </div>
              </div>
            </Card>

            {/* Trial Mode Card */}
            <Card className="rounded-[32px] border border-indigo-500/30 bg-indigo-600/10 p-8 group overflow-hidden relative">
              <div className="relative z-10 h-full flex flex-col justify-between space-y-12">
                <div className="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-md">
                  <FlaskConical className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white mb-3 uppercase tracking-tight">Trial Mode</h3>
                  <p className="text-indigo-100/70 font-medium leading-relaxed">
                    Test new habits in a Sandbox before they impact your main stats.
                  </p>
                </div>
              </div>
            </Card>

          </div>
        </div>
      </section>

      {/* Final CTA - High Contrast */}
      <section className="py-32 bg-[#020617] relative overflow-hidden border-t border-slate-800">
        <div className="container mx-auto px-6 text-center space-y-10 relative z-10">
          <h2 className="text-5xl md:text-7xl font-black text-white leading-none tracking-tighter uppercase">
            Start your last <br />
            <span className="text-indigo-500">habit tracker.</span>
          </h2>
          <Button size="lg" className="h-20 px-12 text-2xl rounded-3xl font-black bg-white text-[#020617] hover:bg-slate-200 transition-all">
            Get Started Now
          </Button>
        </div>
      </section>

    </div>
  );
};

export default LandingPage;