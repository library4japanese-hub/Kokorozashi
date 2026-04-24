import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Flame, Gem, BookOpen, Globe, Zap, Clock, ShieldCheck, ChevronRight, Star, Settings, Edit3, Save, X, LogOut, Heart, Smartphone, Mail, Phone, Calendar, MapPin } from 'lucide-react';
import { cn } from '../lib/utils';
import { User } from '@supabase/supabase-js';
import { Profile, StudyLog, MockExamResult } from '../types';
import { supabase } from '../lib/supabase';

interface ProfileViewProps {
  user: User;
  profile: Profile | null;
  onRefresh: () => void;
  studyLogs: StudyLog[];
  examResults: MockExamResult[];
  onRefreshStudyData: () => void;
  onDonate: () => void;
  onDonateUPI: () => void;
  onOpenSettings: () => void;
  weakTopic?: string | null;
  totalMastered?: number;
}

export default function ProfileView({ 
  user, 
  profile, 
  onRefresh, 
  studyLogs, 
  examResults, 
  onRefreshStudyData,
  onDonate,
  onDonateUPI,
  onOpenSettings,
  weakTopic,
  totalMastered = 0
}: ProfileViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const calculateStreak = (logs: StudyLog[]) => {
    if (logs.length === 0) return 0;
    const dates = logs.map(log => new Date(log.created_at!).toDateString());
    const uniqueDates = [...new Set(dates)];
    
    let streak = 0;
    let today = new Date();
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const checkDate = new Date();
      checkDate.setDate(today.getDate() - i);
      if (uniqueDates.includes(checkDate.toDateString())) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const getTargetTotal = (level: string | null) => {
    switch(level) {
      case 'N5': return 800;
      case 'N4': return 1500;
      case 'N3': return 3000;
      case 'N2': return 6000;
      case 'N1': return 10000;
      default: return 1000;
    }
  };

  const streak = calculateStreak(studyLogs);
  const masteredCount = totalMastered;
  const targetLevel = profile?.target_level || 'N5';
  const targetTotal = getTargetTotal(targetLevel);
  const xp = profile?.xp_points || 0;
  const nextLevelXp = (Math.floor(xp / 1000) + 1) * 1000;
  const xpPercentage = ((xp % 1000) / 1000) * 100;
  const currentLevel = Math.floor(xp / 1000) + 1;

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const { role, ...saveData } = formData;
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...saveData
        });
      
      if (error) throw error;
      setIsEditing(false);
      onRefresh();
    } catch (err: any) {
      alert("Error updating profile: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const achievements = [
    { label: 'Words Mastered', value: masteredCount, icon: <BookOpen size={20} />, color: 'from-blue-500 to-cyan-400' },
    { label: 'Target Level', value: targetLevel, icon: <Trophy size={20} />, color: 'from-purple-500 to-pink-400' },
    { label: 'Total XP', value: xp.toLocaleString(), icon: <Zap size={20} />, color: 'from-amber-500 to-orange-400' },
    { label: 'Exams Taken', value: examResults.length, icon: <Clock size={20} />, color: 'from-emerald-500 to-teal-400' },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white font-sans selection:bg-brand/30">
      {/* Background Glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-900/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="grid-layout">
        {/* Main Content Area */}
        <div className="main-content-area space-y-8">
          {/* Profile Header Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 md:p-12 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-brand/20 transition-all duration-700" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
              <div className="relative">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] p-1 bg-gradient-to-tr from-brand to-blue-400 shadow-2xl shadow-brand/20"
                >
                  <div className="w-full h-full rounded-[2.3rem] bg-[#0A0E27] flex items-center justify-center overflow-hidden border-4 border-[#0A0E27]">
                    {profile?.photo_url ? (
                      <img 
                        src={profile.photo_url} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-5xl font-serif italic text-white/20">
                        {profile?.username?.[0].toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, type: 'spring' }}
                  className="absolute -bottom-2 -right-2 brand-gradient px-4 py-1.5 rounded-full border-4 border-[#0A0E27] shadow-xl"
                >
                  <span className="text-xs font-black tracking-tighter">LVL {currentLevel}</span>
                </motion.div>
              </div>

              <div className="text-center md:text-left flex-1">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-2">
                  <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none">
                    {profile?.username || user.email?.split('@')[0]}
                  </h1>
                  {profile?.is_pro && (
                    <div className="bg-brand/20 text-brand-light px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-brand/30">
                      <ShieldCheck size={14} />
                      PRO MEMBER
                    </div>
                  )}
                </div>
                <p className="text-white/40 text-sm font-black uppercase tracking-widest mb-6">{user.email}</p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-6 py-3 glass hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <Edit3 size={16} />
                    Edit Profile
                  </button>
                  <button 
                    onClick={onOpenSettings}
                    className="flex items-center gap-2 px-6 py-3 glass hover:bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard 
              label="Current Streak" 
              value={`${streak} Days`} 
              icon={<Flame className="text-orange-500" />} 
              sub="Keep it up!"
              delay={0.1}
            />
            <StatCard 
              label="Total XP" 
              value={xp.toLocaleString()} 
              icon={<Zap className="text-brand-light" />} 
              sub={`Next Level: ${nextLevelXp.toLocaleString()}`}
              delay={0.2}
            />
            <StatCard 
              label="Words Mastered" 
              value={masteredCount} 
              icon={<BookOpen className="text-blue-400" />} 
              sub={`Goal: ${targetTotal}`}
              delay={0.3}
            />
          </div>

          {/* Learning Roadmap (Progressive Disclosure) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-black tracking-tight">Learning Roadmap</h3>
                <p className="text-xs text-white/40 font-black uppercase tracking-widest mt-1">Your path to {targetLevel} mastery</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-black text-brand">{Math.min(100, Math.round((masteredCount / targetTotal) * 100))}%</span>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Completed</p>
              </div>
            </div>

            <div className="relative space-y-8">
              <div className="absolute left-6 top-8 bottom-8 w-1 bg-white/5 rounded-full" />
              
              <RoadmapStep 
                title="Foundation" 
                desc="Master basic JLPT N5 vocabulary and grammar." 
                status={masteredCount > 200 ? 'complete' : 'active'} 
                icon={<Star size={18} />}
              />
              <RoadmapStep 
                title="Intermediate Bridge" 
                desc="Transition to N4/N3 with complex sentence structures." 
                status={masteredCount > 1500 ? 'complete' : (masteredCount > 200 ? 'active' : 'locked')} 
                icon={<Globe size={18} />}
              />
              <RoadmapStep 
                title="Advanced Fluency" 
                desc="Conquer N2/N1 and read native Japanese news." 
                status={masteredCount > 5000 ? 'complete' : (masteredCount > 1500 ? 'active' : 'locked')} 
                icon={<Trophy size={18} />}
              />
            </div>
          </motion.div>

          {/* Recent Activity Feed */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-black tracking-tight mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {studyLogs.slice(0, 5).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 glass rounded-2xl border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      log.is_correct ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {log.is_correct ? <ShieldCheck size={20} /> : <X size={20} />}
                    </div>
                    <div>
                      <p className="text-sm font-black">{log.word || log.topic_tag}</p>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{log.is_correct ? 'Mastered' : 'Needs Review'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-white/60">{new Date(log.created_at!).toLocaleDateString()}</p>
                    <p className="text-[10px] text-white/20 font-black uppercase tracking-widest">Study Session</p>
                  </div>
                </div>
              ))}
              {studyLogs.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="mx-auto text-white/10 mb-4" size={48} />
                  <p className="text-sm font-black uppercase tracking-widest text-white/20">No recent activity found</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Right Rail Area */}
        <div className="right-rail space-y-8">
          {/* Friends & Leaderboard */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-black tracking-tight">Leaderboard</h3>
              <button className="text-[10px] font-black uppercase tracking-widest text-brand hover:text-brand-light transition-colors">View All</button>
            </div>
            <div className="space-y-6">
              <LeaderboardItem name="Rajni Singh" xp={12450} rank={1} isUser={profile?.username === 'Rajni Singh'} />
              <LeaderboardItem name="Kenji Sato" xp={10200} rank={2} />
              <LeaderboardItem name="Sakura Tanaka" xp={9800} rank={3} />
              <LeaderboardItem name="Alex Chen" xp={8500} rank={4} />
            </div>
          </motion.div>

          {/* Achievements / Badges */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className="glass-card p-8"
          >
            <h3 className="text-lg font-black tracking-tight mb-6">Badges</h3>
            <div className="grid grid-cols-3 gap-4">
              <Badge icon={<Flame size={20} />} label="7 Day Streak" active={streak >= 7} />
              <Badge icon={<BookOpen size={20} />} label="Vocab King" active={masteredCount >= 500} />
              <Badge icon={<Zap size={20} />} label="XP Titan" active={xp >= 5000} />
              <Badge icon={<Trophy size={20} />} label="N5 Master" active={masteredCount >= 800} />
              <Badge icon={<ShieldCheck size={20} />} label="Pro" active={profile?.is_pro} />
              <Badge icon={<Heart size={20} />} label="Supporter" active={false} />
            </div>
          </motion.div>

          </div>
        </div>
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg glass-card p-8 md:p-12 overflow-hidden"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black tracking-tight">Edit Profile</h3>
                <button onClick={() => setIsEditing(false)} className="p-3 hover:bg-white/5 rounded-2xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">First Name</label>
                    <input 
                      type="text" 
                      className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                      value={formData.first_name || ''}
                      onChange={e => setFormData({...formData, first_name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Last Name</label>
                    <input 
                      type="text" 
                      className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                      value={formData.last_name || ''}
                      onChange={e => setFormData({...formData, last_name: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Username</label>
                  <input 
                    type="text" 
                    className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                    value={formData.username || ''}
                    onChange={e => setFormData({...formData, username: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Photo URL</label>
                  <input 
                    type="url" 
                    className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                    placeholder="https://example.com/photo.jpg"
                    value={formData.photo_url || ''}
                    onChange={e => setFormData({...formData, photo_url: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Phone</label>
                    <input 
                      type="tel" 
                      className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                      value={formData.phone || ''}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40">Age</label>
                    <input 
                      type="number" 
                      className="w-full glass border border-white/5 rounded-2xl px-4 py-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                      value={formData.age || ''}
                      onChange={e => setFormData({...formData, age: parseInt(e.target.value) || undefined})}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <button 
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="w-full py-5 brand-gradient text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-2xl shadow-brand/30"
                >
                  <Save size={20} />
                  {loading ? "Syncing..." : "Save Profile"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, sub, delay }: { label: string, value: string | number, icon: React.ReactNode, sub: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-card p-6 hover:bg-white/5 transition-all group"
    >
      <div className="w-12 h-12 rounded-2xl glass flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">{label}</p>
      <p className="text-[8px] font-black uppercase tracking-widest text-brand-light opacity-60">{sub}</p>
    </motion.div>
  );
}

function RoadmapStep({ title, desc, status, icon }: { title: string, desc: string, status: 'complete' | 'active' | 'locked', icon: React.ReactNode }) {
  return (
    <div className="relative pl-16">
      <div className={cn(
        "absolute left-0 w-12 h-12 rounded-2xl flex items-center justify-center z-10 transition-all",
        status === 'complete' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" :
        status === 'active' ? "bg-brand text-white shadow-lg shadow-brand/20 animate-pulse" :
        "bg-white/5 text-white/20 border border-white/5"
      )}>
        {status === 'complete' ? <ShieldCheck size={20} /> : icon}
      </div>
      <div>
        <h4 className={cn(
          "text-sm font-black uppercase tracking-widest mb-1",
          status === 'locked' ? "text-white/20" : "text-white"
        )}>{title}</h4>
        <p className={cn(
          "text-xs font-medium leading-relaxed",
          status === 'locked' ? "text-white/10" : "text-white/40"
        )}>{desc}</p>
      </div>
    </div>
  );
}

function LeaderboardItem({ name, xp, rank, isUser }: { name: string, xp: number, rank: number, isUser?: boolean }) {
  return (
    <div className={cn(
      "flex items-center justify-between p-4 rounded-2xl transition-all",
      isUser ? "bg-brand/10 border border-brand/20" : "hover:bg-white/5"
    )}>
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black",
          rank === 1 ? "bg-amber-500/20 text-amber-500" :
          rank === 2 ? "bg-slate-400/20 text-slate-400" :
          rank === 3 ? "bg-orange-600/20 text-orange-600" :
          "bg-white/5 text-white/40"
        )}>
          #{rank}
        </div>
        <div>
          <p className="text-sm font-black">{name}</p>
          <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">{xp.toLocaleString()} XP</p>
        </div>
      </div>
      {rank === 1 && <Trophy size={16} className="text-amber-500" />}
    </div>
  );
}

function Badge({ icon, label, active }: { icon: React.ReactNode, label: string, active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
        active ? "glass text-brand shadow-xl shadow-brand/10" : "bg-white/5 text-white/10 grayscale"
      )}>
        {icon}
      </div>
      <span className={cn(
        "text-[8px] font-black uppercase tracking-widest text-center",
        active ? "text-white/60" : "text-white/10"
      )}>{label}</span>
    </div>
  );
}
