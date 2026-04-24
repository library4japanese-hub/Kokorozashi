import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface ProgressDashboardProps {
  stats: {
    level: string;
    progress: number;
    totalWords: number;
    mastered: number;
    streak: number;
  };
  weakTopic?: string | null;
}

export default function ProgressDashboard({ stats, weakTopic }: ProgressDashboardProps) {
  return (
    <div className="p-8 glass-card relative overflow-hidden group">
      <div className="flex justify-between items-end mb-6 relative z-10">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-1">Current Goal</p>
          <h2 className="text-3xl font-black text-white">{stats.level} Mastery</h2>
        </div>
        <span className="text-brand-light font-black text-xl">{Math.round(stats.progress)}%</span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-white/5 rounded-full h-3 mb-8 overflow-hidden border border-white/5 relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${stats.progress}%` }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="bg-brand h-full rounded-full shadow-[0_0_15px_rgba(112,0,255,0.5)]"
        />
      </div>

      {weakTopic && (
        <div className="mb-8 p-6 bg-amber-500/10 rounded-[24px] border border-amber-500/20 flex items-center justify-between relative z-10">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-amber-500/60 mb-1">Intensive Training Required</p>
            <h4 className="text-xl font-bold text-amber-200">Focus on "{weakTopic}"</h4>
          </div>
          <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 animate-pulse border border-amber-500/30">
            <span className="text-xl">🔥</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
        <div className="p-6 glass rounded-[24px] border border-white/5 hover:bg-white/5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Vocabulary</p>
          <p className="text-2xl font-black text-white">{stats.mastered} <span className="text-sm text-white/20 font-medium">/ {stats.totalWords}</span></p>
        </div>
        <div className="p-6 glass rounded-[24px] border border-white/5 hover:bg-white/5 transition-all">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mb-2">Study Streak</p>
          <p className="text-2xl font-black text-white">{stats.streak} <span className="text-sm text-white/20 font-medium">Days 🔥</span></p>
        </div>
      </div>
    </div>
  );
}
