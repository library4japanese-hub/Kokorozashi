import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Users, Send, MessageSquare, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { cn } from '../lib/utils';

interface Message {
  id: string;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
}

interface StudyRoomProps {
  user: User | null;
  username: string;
}

export default function StudyRoom({ user, username }: StudyRoomProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    // 1. Subscribe to messages
    const channel = supabase
      .channel('study_room')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'study_room_messages' 
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();

    // 2. Presence
    const presenceChannel = supabase.channel('online_users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('join', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('leave', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: user.id,
            username: username,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 3. Initial fetch
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('study_room_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      if (data) setMessages(data);
    };
    fetchMessages();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, username]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    const { error } = await supabase.from('study_room_messages').insert({
      user_id: user.id,
      username: username,
      content: input.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
    } else {
      setInput('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-180px)] px-6 pt-8">
      {/* Sidebar: Online Users */}
      <div className="lg:col-span-1 glass-card flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black tracking-tight leading-none">Study Group</h3>
            <p className="text-xs text-white/60 font-black uppercase tracking-widest mt-1">{onlineUsers.length} Online Now</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar">
          {onlineUsers.map((u, idx) => (
            <div key={idx} className="flex items-center gap-3 group">
              <div className="w-8 h-8 glass rounded-lg flex items-center justify-center text-brand-light font-black text-xs uppercase">
                {u.username?.[0] || '?'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{u.username || 'Anonymous'}</p>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  <p className="text-xs text-white/40 font-black uppercase tracking-widest">Studying</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main: Chat Area */}
      <div className="lg:col-span-3 flex flex-col glass-card p-0 overflow-hidden relative">
        <div className="p-6 border-b border-white/5 glass flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MessageSquare className="text-brand-light" size={20} />
            <h2 className="text-xl font-black tracking-tight">Global Study Chat</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 glass text-brand-light rounded-full text-xs font-black uppercase tracking-widest border border-brand/20">
            <Sparkles size={12} />
            Live Collaboration
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn("flex flex-col", msg.user_id === user?.id ? "items-end" : "items-start")}
            >
              <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-xs font-black uppercase tracking-widest text-white/40">{msg.username}</span>
                <span className="text-[10px] text-white/20 font-black uppercase tracking-widest">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className={cn(
                "max-w-[80%] px-6 py-4 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm",
                msg.user_id === user?.id 
                  ? "bg-brand text-white rounded-tr-none shadow-lg shadow-brand/20" 
                  : "glass text-white rounded-tl-none"
              )}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 glass border-t border-white/10 flex gap-3">
          <input 
            type="text" 
            placeholder="Share a tip, ask a question, or just say hello!" 
            className="flex-1 glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button 
            onClick={handleSend}
            className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20 active:scale-95 transition-all"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
