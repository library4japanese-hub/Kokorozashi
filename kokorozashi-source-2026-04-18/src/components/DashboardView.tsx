import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Trophy, Flame, Zap, Target, ChevronRight, BookOpen, Brain, Newspaper, Users, Star, ArrowUpRight, Heart, Smartphone } from 'lucide-react';
import { cn } from '../lib/utils';
import { Profile, StudyLog } from '../types';

interface DashboardViewProps {
  profile: Profile | null;
  studyLogs: StudyLog[];
  onNavigate: (view: any) => void;
  weakTopic?: string | null;
  onDonate?: () => void;
  onDonateUPI?: () => void;
}

export default function DashboardView({ profile, studyLogs, onNavigate, weakTopic, onDonate, onDonateUPI }: DashboardViewProps) {
  const xp = profile?.xp_points || 0;
  const currentLevel = Math.floor(xp / 1000) + 1;
  const xpInLevel = xp % 1000;
  const xpPercentage = (xpInLevel / 1000) * 100;

  const todayLogs = studyLogs.filter(log => {
    const logDate = new Date(log.created_at!).toDateString();
    const today = new Date().toDateString();
    return logDate === today;
  });

  const dailyMissions = [
    { 
      id: 1, 
      title: 'Learn 5 New Words', 
      progress: todayLogs.filter(l => l.is_correct && l.metadata?.type === 'vocab').length, 
      total: 5, 
      icon: <BookOpen size={18} />, 
      color: 'text-blue-400', 
      bg: 'bg-blue-500/20', 
      view: 'vocab' 
    },
    { 
      id: 2, 
      title: 'Complete a Mock Test', 
      progress: todayLogs.filter(l => l.metadata?.type === 'exam').length, 
      total: 1, 
      icon: <Target size={18} />, 
      color: 'text-purple-400', 
      bg: 'bg-purple-500/20', 
      view: 'news' 
    },
    { 
      id: 3, 
      title: 'Chat with AI Sensei', 
      progress: todayLogs.filter(l => l.metadata?.type === 'chat').length > 0 ? 1 : 0, 
      total: 1, 
      icon: <Sparkles size={18} />, 
      color: 'text-emerald-400', 
      bg: 'bg-emerald-500/20', 
      view: 'tutor' 
    },
  ];

  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];
  const targetLevelIdx = levels.indexOf(profile?.target_level || 'N5');

  const roadmapSteps = levels.map((lvl, idx) => ({
    level: lvl,
    status: idx < targetLevelIdx ? 'completed' : (idx === targetLevelIdx ? 'current' : 'locked'),
    label: lvl === 'N5' ? 'Beginner' : lvl === 'N4' ? 'Elementary' : lvl === 'N3' ? 'Intermediate' : lvl === 'N2' ? 'Advanced' : 'Master'
  }));

  return (
    <div className="min-h-screen pb-24 px-6 pt-8">
      {/* Welcome Header & Support Card */}
      <header className="mb-10 flex flex-col md:flex-row justify-between items-start gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex-1"
        >
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">Welcome back,</p>
          <h1 className="text-4xl font-black tracking-tight">
            {profile?.username || 'Sensei Learner'} <span className="text-brand">👋</span>
          </h1>
        </motion.div>

        {/* Support Section - Moved to Top Right Corner */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass border border-white/5 p-6 rounded-[2rem] w-full md:w-[320px] relative overflow-hidden group shadow-2xl shadow-brand/10"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand/10 blur-[30px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <h3 className="text-sm font-black tracking-tighter mb-1 flex items-center gap-2">
              Support Sensei <Heart size={14} className="text-brand-light fill-current" />
            </h3>
            <p className="text-[10px] text-white/40 font-bold mb-4 uppercase tracking-widest leading-relaxed">Keep Kokorozashi free for everyone</p>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={onDonate}
                className="py-2.5 bg-brand text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-light transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-brand/20"
              >
                Card
              </button>
              <button 
                onClick={onDonateUPI}
                className="py-2.5 glass bg-white/5 border border-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-1.5"
              >
                <Smartphone size={12} />
                UPI
              </button>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Level Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card mb-8 relative overflow-hidden group border-white/5"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/20 blur-[100px] rounded-full group-hover:bg-brand/30 transition-colors duration-700" />
        
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center shadow-xl shadow-brand/40 relative overflow-hidden">
                <div className="absolute inset-0 bg-white/20 animate-pulse" />
                <span className="text-2xl font-black text-white relative z-10">{currentLevel}</span>
              </div>
              <div>
                <h3 className="font-black text-xl tracking-tight">Level {currentLevel}</h3>
                <p className="text-xs text-white/40 font-black uppercase tracking-widest">Rank: Diamond League</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-white tabular-nums">{xpInLevel} <span className="text-xs text-white/20 font-bold">/ 1000 XP</span></p>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-light">Next Level in {1000 - xpInLevel} XP</p>
            </div>
          </div>
          
          <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-1">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full brand-gradient rounded-full relative"
            >
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-white/30 blur-md" />
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Daily Missions */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black tracking-tight">Daily Missions</h2>
          <button 
            onClick={() => onNavigate('profile')}
            className="text-xs font-bold text-brand-light flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        
        <div className="space-y-4">
          {dailyMissions.map((mission, idx) => (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              onClick={() => onNavigate(mission.view)}
              className="glass-card p-4 flex items-center justify-between group cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", mission.bg, mission.color)}>
                  {mission.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{mission.title}</h4>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest">
                    {mission.progress} / {mission.total} Completed
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 relative flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="18"
                    stroke="currentColor"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={113}
                    initial={{ strokeDashoffset: 113 }}
                    animate={{ strokeDashoffset: 113 - (113 * (mission.progress / mission.total)) }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={mission.color}
                  />
                </svg>
                {mission.progress === mission.total && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star size={12} className={cn("fill-current", mission.color)} />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Learning Roadmap */}
      <section className="mb-10">
        <h2 className="text-xl font-black tracking-tight mb-6 px-1">Learning Roadmap</h2>
        <div className="glass-card p-6 md:p-10 border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand/5 blur-3xl rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="overflow-x-auto no-scrollbar relative z-10 pb-2">
            <div className="flex justify-between items-start min-w-[500px] md:min-w-full relative px-2">
              {/* Path Line */}
              <div className="absolute top-7 left-0 right-0 h-1 bg-white/5 z-0 rounded-full" />
              
              {roadmapSteps.map((step, idx) => (
              <div key={step.level} className="relative z-10 flex flex-col items-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.15, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onNavigate('vocab')}
                  className={cn(
                    "w-14 h-14 rounded-[20px] flex items-center justify-center font-black text-sm transition-all border-2 relative group",
                    step.status === 'completed' ? "bg-brand border-brand text-white shadow-xl shadow-brand/30" :
                    step.status === 'current' ? "bg-brand/10 border-brand-light text-brand-light" :
                    "bg-white/5 border-white/10 text-white/20"
                  )}
                >
                  {step.status === 'current' && (
                    <motion.div 
                      layoutId="roadmap-active"
                      className="absolute inset-0 border-2 border-brand-light rounded-[20px] animate-ping opacity-50"
                    />
                  )}
                  {step.level}
                </motion.button>
                <div className="text-center">
                  <p className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    step.status === 'locked' ? "text-white/10" : "text-white/40"
                  )}>
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-2 gap-4">
        <button 
          onClick={() => onNavigate('tutor')}
          className="glass-card p-6 flex flex-col items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Sparkles size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">AI Tutor</span>
        </button>
        <button 
          onClick={() => onNavigate('quiz')}
          className="glass-card p-6 flex flex-col items-center gap-3 group"
        >
          <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Zap size={24} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest">Quick Quiz</span>
        </button>
      </section>
    </div>
  );
}
