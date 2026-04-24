import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Swords, Trophy, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { BossBattleData } from '../types';
import { cn } from '../lib/utils';

interface BossBattleProps {
  bossData: BossBattleData;
  onVictory: (xp: number) => void;
  onDefeat: () => void;
}

export default function BossBattle({ bossData, onVictory, onDefeat }: BossBattleProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [bossHealth, setBossHealth] = useState(100);
  const [playerShield, setPlayerShield] = useState(3);
  const [battleState, setBattleState] = useState<'fighting' | 'victory' | 'defeat'>('fighting');
  const [feedback, setFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const currentQuestion = bossData.questions[currentQuestionIndex];

  useEffect(() => {
    if (battleState === 'fighting' && !feedback) {
      speak(currentQuestion.question);
    }
  }, [currentQuestionIndex, battleState, feedback]);

  const handleAttack = (isCorrect: boolean) => {
    if (feedback) return; // Prevent double clicking

    if (isCorrect) {
      setFeedback({ text: "CRITICAL HIT! Direct hit on the Grammar Guardian!", isCorrect: true });
      setBossHealth(h => {
        const newHealth = Math.max(0, h - 25);
        if (newHealth === 0) {
          setTimeout(() => setBattleState('victory'), 1500);
        }
        return newHealth;
      });
    } else {
      setFeedback({ text: "COUNTERED! The Guardian strikes back!", isCorrect: false });
      setPlayerShield(s => {
        const newShield = s - 1;
        if (newShield === 0) {
          setTimeout(() => setBattleState('defeat'), 1500);
        }
        return newShield;
      });
    }

    // Move to next question after a delay if not finished
    setTimeout(() => {
      setFeedback(null);
      if (bossHealth > 25 && playerShield > (isCorrect ? 0 : 1)) {
        setCurrentQuestionIndex((prev) => (prev + 1) % bossData.questions.length);
      }
    }, 2000);
  };

  if (battleState === 'victory') {
    return (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg mx-auto glass-card p-12 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <div className="w-24 h-24 brand-gradient text-white rounded-full flex items-center justify-center mx-auto shadow-xl mb-8">
            <Trophy size={48} />
          </div>
          <h2 className="text-5xl font-black tracking-tight mb-4 text-white">VICTORY</h2>
          <p className="text-white/60 font-serif italic text-lg mb-8">You have mastered the {bossData.level} Guardian's trial. Your resolve is legendary.</p>
          <div className="glass py-4 rounded-2xl border border-white/10 mb-8">
            <span className="text-brand-light font-black tracking-[0.3em] uppercase text-xs">+100 XP REWARD</span>
          </div>
          <button 
            onClick={() => onVictory(100)}
            className="w-full py-5 brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all"
          >
            Claim Your Glory
          </button>
        </div>
      </motion.div>
    );
  }

  if (battleState === 'defeat') {
    return (
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-lg mx-auto glass-card p-12 text-center space-y-8 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-rose-500/10 blur-[100px] rounded-full" />
        <div className="relative z-10">
          <div className="w-24 h-24 glass border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <XCircle className="text-rose-400" size={48} />
          </div>
          <h2 className="text-5xl font-black tracking-tight text-rose-400 mb-4">DEFEATED</h2>
          <p className="text-white/40 font-serif italic text-lg mb-8">The Guardian's trial was too much this time. Study harder and return when your spirit is stronger.</p>
          <button 
            onClick={onDefeat}
            className="w-full py-5 glass border border-white/10 text-white/60 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-white/5 transition-all"
          >
            Retreat and Recover
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="relative w-full max-w-lg mx-auto glass-card p-10 border-white/10 shadow-2xl overflow-hidden group">
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
        <motion.div 
          className="h-full bg-brand shadow-[0_0_15px_rgba(112,0,255,0.5)]"
          initial={{ width: '100%' }}
          animate={{ width: `${bossHealth}%` }}
          transition={{ type: 'spring', stiffness: 40, damping: 15 }}
        />
      </div>

      {/* Boss Visuals */}
      <div className="relative z-10 text-center mb-10 pt-4">
        <motion.div 
          animate={{ 
            y: [0, -15, 0],
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-9xl mb-6 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] cursor-default"
        >
          {bossData.level === 'N1' ? '👹' : bossData.level === 'N2' ? '👺' : '👾'}
        </motion.div>
        <h3 className="text-white/40 font-black tracking-[0.4em] uppercase text-xs mb-2">{bossData.level} {bossData.name}</h3>
        <div className="text-xs font-black text-brand-light uppercase tracking-widest">{bossHealth}% HP</div>
      </div>

      {/* Battle Log / Feedback */}
      <div className="h-24 mb-8 flex items-center justify-center relative z-10">
        <AnimatePresence mode="wait">
          {feedback ? (
            <motion.div 
              key="feedback"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={cn(
                "w-full p-5 rounded-2xl text-center font-bold border shadow-xl backdrop-blur-md",
                feedback.isCorrect 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                  : "bg-rose-500/10 border-rose-500/20 text-rose-400"
              )}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                {feedback.isCorrect ? <Swords size={14} /> : <AlertCircle size={14} />}
                <span className="text-xs font-black uppercase tracking-[0.2em]">{feedback.isCorrect ? 'Critical Hit' : 'Countered'}</span>
              </div>
              <p className="text-sm font-serif italic">{feedback.text}</p>
            </motion.div>
          ) : (
            <motion.div 
              key="question"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full text-center"
            >
              <p className="text-2xl leading-relaxed text-white font-black japanese-text">{currentQuestion.question}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Battle Controls */}
      <div className="grid grid-cols-1 gap-3 mb-10 relative z-10">
        {currentQuestion.options.map((opt, i) => (
          <button 
            key={i} 
            onClick={() => handleAttack(opt.isCorrect)}
            disabled={!!feedback}
            className={cn(
              "group relative py-5 px-6 glass hover:bg-white/5 text-white font-bold rounded-2xl border border-white/10 transition-all active:scale-95 disabled:opacity-50 overflow-hidden text-left",
              feedback && opt.isCorrect && "border-brand/40 bg-brand/10 shadow-lg"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg transition-all japanese-text">{opt.text}</span>
              <ChevronRight size={18} className="text-white/20 group-hover:text-white/60 group-hover:translate-x-1 transition-all" />
            </div>
            {feedback && opt.isCorrect && (
              <motion.div 
                layoutId="correct-indicator"
                className="absolute left-0 top-0 bottom-0 w-1 bg-brand shadow-[0_0_10px_rgba(112,0,255,0.5)]"
              />
            )}
          </button>
        ))}
      </div>
      
      {/* Player Stats */}
      <div className="pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <motion.div 
                key={i}
                animate={{ 
                  scale: i < playerShield ? 1 : 0.8,
                  opacity: i < playerShield ? 1 : 0.2,
                }}
                className={cn(
                  "w-3 h-3 rounded-full",
                  i < playerShield ? "bg-brand shadow-[0_0_8px_rgba(112,0,255,0.5)]" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <span className="text-xs font-black text-white/40 uppercase tracking-widest">Shields</span>
        </div>
        <div className="text-xs font-black text-white/40 uppercase tracking-widest">
          Trial <span className="text-brand-light">{currentQuestionIndex + 1}/{bossData.questions.length}</span>
        </div>
      </div>
    </div>
  );
}
