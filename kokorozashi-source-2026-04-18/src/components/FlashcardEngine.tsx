import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  RefreshCw, 
  Volume2, 
  Image as ImageIcon, 
  Settings2, 
  Layers, 
  Palette, 
  User as UserIcon,
  ChevronRight,
  Brain,
  Zap,
  CheckCircle2,
  Info,
  BookOpen
} from 'lucide-react';
import { FlashcardRequest, FlashcardResponse, JLPTLevel, ContentMode, StyleMode, DifficultyBias } from '../types';
import { generateFlashcard } from '../services/flashcardService';
import { cn } from '../lib/utils';

export default function FlashcardEngine() {
  const [config, setConfig] = useState<FlashcardRequest>({
    jlpt_level: 'N5',
    content_mode: 'word',
    style_mode: 'anime',
    theme_preference: [],
    color_preference: [],
    character_preference: [],
    daily_seed: Math.random().toString(36).substring(7),
    difficulty_bias: 'medium',
    include_example: true,
    include_audio: true,
    output_format: 'full'
  });

  const [card, setCard] = useState<FlashcardResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setCard(null);
    setIsFlipped(false);
    
    try {
      const newCard = await generateFlashcard({
        ...config,
        daily_seed: Date.now().toString()
      });
      setCard(newCard);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to generate premium flashcard. Please check your API key.";
      setError(errorMessage);
      console.error("Flashcard Generation Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 px-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white flex items-center gap-3">
            <Layers className="text-brand" />
            AI Flashcard <span className="text-brand">Engine</span>
          </h2>
          <p className="text-white/40 font-medium text-sm">Experience JLPT mastery with AI-generated visual mnemonics.</p>
        </div>
        
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="brand-gradient text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand/30 disabled:opacity-50"
        >
          {isGenerating ? (
            <RefreshCw className="animate-spin" size={18} />
          ) : (
            <Sparkles size={18} />
          )}
          {isGenerating ? "Synthesizing..." : "Forge New Card"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6 space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-2">
              <Settings2 size={14} />
              Configuration
            </h3>
            
            {/* JLPT Level */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Level</label>
              <div className="grid grid-cols-5 gap-1">
                {(['N5', 'N4', 'N3', 'N2', 'N1'] as JLPTLevel[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setConfig({ ...config, jlpt_level: level })}
                    className={cn(
                      "py-2 rounded-lg text-[10px] font-black transition-all border",
                      config.jlpt_level === level 
                        ? "bg-brand/20 border-brand text-brand-light" 
                        : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Content Type</label>
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                {(['word', 'grammar', 'mixed'] as ContentMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setConfig({ ...config, content_mode: mode })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      config.content_mode === mode 
                        ? "bg-white/10 text-white" 
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Style */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Aesthetic Style</label>
              <div className="grid grid-cols-2 gap-2">
                {(['anime', 'manga', 'futuristic', 'minimalist', 'dreamy'] as StyleMode[]).map(style => (
                  <button
                    key={style}
                    onClick={() => setConfig({ ...config, style_mode: style })}
                    className={cn(
                      "py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border text-left flex items-center justify-between",
                      config.style_mode === style 
                        ? "bg-brand/10 border-brand text-brand-light" 
                        : "bg-white/5 border-white/10 text-white/40"
                    )}
                  >
                    {style}
                    {config.style_mode === style && <CheckCircle2 size={12} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Bias */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/60">Complexity</label>
              <div className="flex gap-1 bg-black/40 p-1 rounded-xl">
                {(['easy', 'medium', 'hard'] as DifficultyBias[]).map(bias => (
                  <button
                    key={bias}
                    onClick={() => setConfig({ ...config, difficulty_bias: bias })}
                    className={cn(
                      "flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                      config.difficulty_bias === bias 
                        ? "bg-white/10 text-white" 
                        : "text-white/40 hover:text-white"
                    )}
                  >
                    {bias}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="glass-card p-4 bg-blue-500/5 border-blue-500/20">
            <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-1">
              <Info size={12} />
              Free Access
            </h4>
            <p className="text-[9px] text-blue-400/60 font-medium leading-relaxed">
              No Gemini key required. The Standard Engine uses our built-in curated datasets to provide instant, zero-cost study material.
            </p>
          </div>
          
          <div className="glass-card p-6 bg-brand/5 border-brand/20">
            <h4 className="text-xs font-black text-brand-light uppercase tracking-widest flex items-center gap-2 mb-2">
              <Brain size={14} />
              Engine Status
            </h4>
            <p className="text-[10px] text-brand-light/60 font-medium leading-relaxed">
              {card ? (
                card.isAiGenerated 
                  ? "Gemini 3 Flash is currently managing semantic content while Gemini 2.5 Flash Image generates high-frequency mnemonic imagery."
                  : "Standard Mastery Engine active. Utilizing curated local JSON datasets for high-speed, zero-API pedagogical delivery."
              ) : (
                "Select a mode to initialize the forge. Standard Mode active by default for all users."
              )}
            </p>
          </div>
        </div>

        {/* Display Panel */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {!card && !isGenerating && (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[500px] glass-card flex flex-col items-center justify-center p-12 text-center border-dashed border-2 border-white/10 bg-white/[0.02]"
              >
                <div className="w-20 h-20 glass rounded-3xl flex items-center justify-center mb-6 text-white/10">
                  <Zap size={40} />
                </div>
                <h3 className="text-xl font-black text-white/80 mb-2">Ready for Enlightenment?</h3>
                <p className="text-white/40 max-w-sm mb-8">Configure your learning parameters and trigger the AI forge to create your first premium flashcard.</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <Palette size={14} /> 6 Aesthetic Modes
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                    <ImageIcon size={14} /> AI Mnemonic Generator
                  </div>
                </div>
              </motion.div>
            )}

            {isGenerating && (
              <motion.div 
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full min-h-[500px] glass-card flex flex-col items-center justify-center p-12 text-center"
              >
                <div className="relative mb-8">
                  <div className="w-24 h-24 border-4 border-brand/20 rounded-full animate-spin border-t-brand" />
                  <div className="absolute inset-0 flex items-center justify-center text-brand">
                    <Sparkles className="animate-pulse" size={32} />
                  </div>
                </div>
                <h3 className="text-xl font-black text-white mb-2 italic">Forging Card Data...</h3>
                <p className="text-white/40 text-sm max-w-xs leading-relaxed">Gemini is synthesizing content and generating high-resolution mnemonics for you.</p>
                <div className="mt-8 flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-brand animate-bounce" />
                </div>
              </motion.div>
            )}

            {card && (
              <motion.div 
                key="card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="perspective-1000 h-full min-h-[600px]"
              >
                <div 
                  className={cn(
                    "relative w-full h-full transition-all duration-700 preserve-3d cursor-pointer",
                    isFlipped ? "rotate-y-180" : ""
                  )}
                  onClick={() => setIsFlipped(!isFlipped)}
                >
                  {/* Front View */}
                  <div className="absolute inset-0 backface-hidden">
                    <div className="glass-card h-full flex flex-col overflow-hidden bg-black/40 border-white/5">
                      <div className="relative flex-1 bg-black/60 overflow-hidden">
                        {card.imageUrl ? (
                          <img 
                            src={card.imageUrl} 
                            alt="Mnemonic" 
                            className="w-full h-full object-cover opacity-80"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "https://picsum.photos/seed/japanese/800/600?blur=2";
                              target.onerror = null; // Prevent infinite loop
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-brand/5 text-brand/20">
                            <ImageIcon size={64} />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                        
                        <div className="absolute top-4 left-4 flex gap-2">
                          <div className={cn(
                            "px-3 py-1 glass rounded-lg text-[10px] font-black border",
                            card.isAiGenerated ? "text-brand-light border-brand/30" : "text-blue-400 border-blue-500/30"
                          )}>
                            {card.isAiGenerated ? "AI MASTER" : "LOCAL CORE"}
                          </div>
                          <div className="px-3 py-1 glass rounded-lg text-[10px] font-black text-white/60 border border-white/10 uppercase">
                            JLPT {card.jlpt_level}
                          </div>
                        </div>

                        <div className="absolute bottom-8 left-0 right-0 text-center px-12">
                          <p className="text-brand-light font-black uppercase tracking-[0.3em] text-[10px] mb-4 drop-shadow-md">FRONT VIEW</p>
                          <h2 className="japanese-text text-8xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                            {card.content.kanji}
                          </h2>
                          <p className="text-white/60 font-black tracking-widest text-lg mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            {card.content.reading}
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 bg-black/40 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              speak(card.content.kanji);
                            }}
                            className="w-12 h-12 glass text-brand-light rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all border border-brand/20"
                          >
                            <Volume2 size={20} />
                          </button>
                        </div>
                        <div className="text-[10px] font-black text-white/30 uppercase tracking-widest flex items-center gap-2">
                          Tap to Reveal <ChevronRight size={14} className="text-brand" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Back View */}
                  <div className="absolute inset-0 backface-hidden rotate-y-180">
                    <div className="glass-card h-full p-8 flex flex-col bg-brand-[0.05] border-brand/20">
                      <div className="flex-1 space-y-8">
                        <div>
                          <label className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-2 block">Kanji & Reading</label>
                          <div className="flex items-end gap-3">
                            <h2 className="japanese-text text-5xl font-black text-white">{card.content.kanji}</h2>
                            <span className="japanese-text text-2xl font-bold text-brand-light pb-1">{card.content.reading}</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-black text-brand-light uppercase tracking-widest mb-2 block">Universal Meaning</label>
                          <p className="text-2xl font-bold text-white leading-tight">{card.content.meaning}</p>
                          {card.content.part_of_speech && (
                            <span className="inline-block mt-2 px-2 py-0.5 glass rounded text-[9px] font-black uppercase text-white/40">
                              {card.content.part_of_speech}
                            </span>
                          )}
                        </div>

                        <div className="space-y-4">
                          <label className="text-[10px] font-black text-brand-light uppercase tracking-widest block">Contextual Example</label>
                          <div className="glass p-4 rounded-2xl border-white/5 space-y-3">
                            <p className="japanese-text text-lg text-white font-black leading-relaxed">
                              {card.content.example_jp}
                            </p>
                            <div className="h-px bg-white/5" />
                            <p className="text-sm text-white/50 font-medium">
                              {card.content.example_en}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                          <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 block">Style Meta</label>
                            <p className="text-[10px] font-black text-white/60 uppercase">{card.style.theme} • {card.style.color_palette}</p>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1 block">Difficulty</label>
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <div 
                                  key={s} 
                                  className={cn(
                                    "w-3 h-1 rounded-full",
                                    s <= (card.content.difficulty === 'hard' ? 5 : card.content.difficulty === 'medium' ? 3 : 1)
                                      ? "bg-brand" 
                                      : "bg-white/5"
                                  )} 
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-8 flex gap-4">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(false);
                          }}
                          className="flex-1 py-3 glass text-white/60 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all border border-white/5"
                        >
                          Back to Front
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate();
                          }}
                          className="flex-1 py-3 brand-gradient text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg shadow-brand/20"
                        >
                          Forge Next
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {error && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 glass border-red-500/20 px-6 py-3 rounded-2xl text-red-400 text-xs font-black shadow-xl animate-bounce">
          {error}
        </div>
      )}
    </div>
  );
}
