import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Info, MessageCircle, AlertTriangle, CheckCircle, ArrowRight, ArrowLeft, Play, Sparkles } from 'lucide-react';
import { GrammarExplanation } from '../types';
import Markdown from 'react-markdown';
import SentenceVisualizer from './SentenceVisualizer';
import { analyzeSentenceStructure } from '../services/gemini';
import { cn } from '../lib/utils';

interface GrammarDetailViewProps {
  data: GrammarExplanation;
  onBack: () => void;
}

export const GrammarDetailView: React.FC<GrammarDetailViewProps> = ({ data, onBack }) => {
  const [activeTab, setActiveTab] = useState<'dna' | 'sentences' | 'pragmatics' | 'assessment'>('dna');
  const [userAnswer, setUserAnswer] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [visualizingIdx, setVisualizingIdx] = useState<number | null>(null);
  const [sentenceAnalysis, setSentenceAnalysis] = useState<any>(null);
  const [isAnalyzingSentence, setIsAnalyzingSentence] = useState(false);

  const handleVisualize = async (idx: number, sentence: string) => {
    if (visualizingIdx === idx) {
      setVisualizingIdx(null);
      return;
    }
    setVisualizingIdx(idx);
    setIsAnalyzingSentence(true);
    const result = await analyzeSentenceStructure(sentence);
    setSentenceAnalysis(result);
    setIsAnalyzingSentence(false);
  };

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any current speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 px-6 pt-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Learning</span>
        </button>
        <div className="flex items-center gap-2 px-4 py-1.5 glass text-brand-light rounded-full text-xs font-black uppercase tracking-widest border border-brand/20">
          <Sparkles className="w-3 h-3" />
          <span>Advanced AI Analysis</span>
        </div>
      </div>

      <header className="glass-card p-10 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <BookOpen size={120} className="text-brand" />
        </div>
        
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <h1 className="text-6xl font-black tracking-tight japanese-text text-white">{data.meta.pattern}</h1>
            <span className="px-4 py-1.5 brand-gradient text-white rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20">
              JLPT {data.meta.jlpt_level}
            </span>
            <div className="flex gap-2">
              {data.meta.skill_type.map(skill => (
                <span key={skill} className="px-3 py-1 glass text-white/60 rounded-full text-xs uppercase tracking-widest font-black border border-white/5">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <p className="text-2xl text-white/60 italic font-serif leading-relaxed">
            "{data.form_meaning.literal_meaning}"
          </p>
        </div>
      </header>

      <div className="flex gap-2 p-1.5 glass rounded-2xl w-fit mx-auto border border-white/5">
        {[
          { id: 'dna', label: 'DNA', icon: Info },
          { id: 'sentences', label: 'Sentences', icon: MessageCircle },
          { id: 'pragmatics', label: 'Pragmatics', icon: BookOpen },
          { id: 'assessment', label: 'Challenge', icon: CheckCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? 'bg-brand text-white shadow-lg shadow-brand/20' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            )}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="min-h-[500px]"
      >
        {activeTab === 'dna' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="glass-card">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Core Structure
                </h3>
                <div className="p-6 glass rounded-2xl font-mono text-xl border border-white/5 text-brand-light">
                  {data.core_grammar_dna.structure}
                </div>
              </section>

              <section className="glass-card">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Cognitive Insight
                </h3>
                <p className="text-white/60 leading-relaxed font-serif italic text-lg">
                  {data.core_grammar_dna.cognitive_insight}
                </p>
              </section>
            </div>

            <div className="space-y-8">
              <section className="glass-card">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Nuance & Tone</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/5">
                    <span className="text-white/40 text-xs font-black uppercase tracking-widest">Social Tone</span>
                    <span className="px-3 py-1 glass text-brand-light rounded-full text-xs font-black uppercase tracking-widest border border-brand/20">
                      {data.form_meaning.social_tone}
                    </span>
                  </div>
                  <p className="text-white/60 italic font-serif text-lg leading-relaxed">
                    {data.form_meaning.nuance}
                  </p>
                </div>
              </section>

              <section className="brand-gradient text-white p-8 rounded-[32px] shadow-lg shadow-brand/20 relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-6">Progression Path</h3>
                  <div className="flex items-center gap-6">
                    <div className="flex-1 p-4 glass border border-white/10 rounded-2xl">
                      <span className="block text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Previous</span>
                      <span className="font-bold text-white">{data.progression.previous}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/20" />
                    <div className="flex-1 p-4 glass border border-white/10 rounded-2xl">
                      <span className="block text-[10px] text-white/60 font-black uppercase tracking-widest mb-1">Next</span>
                      <span className="font-bold text-white">{data.progression.next}</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'sentences' && (
          <div className="space-y-8">
            {data.sentence_triad.map((sentence, idx) => (
              <div key={idx} className="glass-card p-0 overflow-hidden group hover:border-brand/30 transition-all">
                <div className="flex min-h-[160px]">
                  <div className="w-16 glass flex items-center justify-center border-r border-white/5 font-black text-white/5 text-4xl">
                    {sentence.level}
                  </div>
                  <div className="flex-1 p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-4">
                        <ruby className="text-3xl font-black text-white leading-relaxed japanese-text">
                          {sentence.japanese}
                        </ruby>
                        <p className="text-white/40 font-serif italic text-lg">{sentence.english}</p>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => speak(sentence.japanese)}
                          className="w-12 h-12 glass hover:bg-white/5 rounded-xl flex items-center justify-center transition-all border border-white/10 group-hover:scale-110 text-brand-light"
                        >
                          <Play className="w-5 h-5 fill-current" />
                        </button>
                        <button 
                          onClick={() => handleVisualize(idx, sentence.japanese)}
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all border group-hover:scale-110",
                            visualizingIdx === idx ? "bg-brand text-white border-brand shadow-lg shadow-brand/20" : "glass hover:bg-white/5 border-white/10 text-brand-light"
                          )}
                        >
                          <Sparkles className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {visualizingIdx === idx && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="px-4 pb-4"
                      >
                        <SentenceVisualizer 
                          sentence={sentence.japanese} 
                          analysis={isAnalyzingSentence ? undefined : sentenceAnalysis} 
                        />
                      </motion.div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                      <div className="p-4 glass rounded-2xl border border-white/5">
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Pitch Pattern</span>
                        <span className="text-sm font-bold text-brand-light capitalize tracking-wide">{sentence.audio.pitch_pattern}</span>
                      </div>
                      <div className="p-4 glass rounded-2xl border border-white/5">
                        <span className="text-xs font-black text-white/40 uppercase tracking-widest block mb-2">Pronunciation Note</span>
                        <span className="text-sm text-white/60 font-serif italic">{sentence.audio.pronunciation_notes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'pragmatics' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <section className="glass-card border-emerald-500/20">
                <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  When to Use
                </h3>
                <p className="text-white/60 leading-relaxed font-serif italic text-lg">{data.pragmatics.when_to_use}</p>
              </section>

              <section className="glass-card border-rose-500/20">
                <h3 className="text-xs font-black text-rose-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  When NOT to Use
                </h3>
                <p className="text-white/60 leading-relaxed font-serif italic text-lg">{data.pragmatics.when_not_to_use}</p>
              </section>
            </div>

            <div className="space-y-8">
              <section className="glass-card">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Cultural Context</h3>
                <p className="text-white/60 leading-relaxed font-serif italic text-lg">{data.pragmatics.cultural_note}</p>
              </section>

              <section className="glass-card">
                <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.3em] mb-6">Common Errors</h3>
                <div className="space-y-6">
                  {data.common_errors.map((err, idx) => (
                    <div key={idx} className="p-5 glass rounded-2xl border border-white/5">
                      <div className="flex items-center gap-2 text-rose-400 font-black text-xs uppercase tracking-widest mb-2">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Error: {err.error}</span>
                      </div>
                      <div className="text-emerald-400 font-bold text-sm mb-3">
                        ✓ Correction: {err.correction}
                      </div>
                      <p className="text-sm text-white/60 font-serif italic leading-relaxed">{err.explanation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === 'assessment' && (
          <div className="max-w-2xl mx-auto space-y-10">
            <section className="glass-card p-12 relative overflow-hidden">
              <h3 className="text-2xl font-black tracking-tight mb-10">Grammar Challenge</h3>
              
              <div className="space-y-12">
                <div>
                  <p className="text-white/40 text-xs uppercase font-black tracking-[0.3em] mb-6">1. Reordering Challenge</p>
                  <div className="flex flex-wrap gap-3 mb-6">
                    {data.assessment.reordering.question.map((word, idx) => (
                      <div key={idx} className="px-5 py-2.5 glass rounded-xl border border-white/10 font-bold text-white japanese-text">
                        {word}
                      </div>
                    ))}
                  </div>
                  <input 
                    type="text"
                    placeholder="Type the correct sentence..."
                    className="w-full glass border border-white/10 rounded-2xl p-5 text-lg outline-none focus:border-brand/50 transition-all text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <p className="text-white/40 text-xs uppercase font-black tracking-[0.3em] mb-6">2. Fill in the Blank</p>
                  <p className="text-2xl font-bold text-white mb-8 japanese-text leading-relaxed">
                    {data.assessment.fill_blank.sentence.replace(data.assessment.fill_blank.answer, '_______')}
                  </p>
                  <div className="flex gap-4">
                    <input 
                      type="text"
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Your answer..."
                      className="flex-1 glass border border-white/10 rounded-2xl p-5 text-lg outline-none focus:border-brand/50 transition-all text-white placeholder:text-white/40"
                    />
                    <button 
                      onClick={() => setShowResult(true)}
                      className="px-10 py-5 brand-gradient text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all"
                    >
                      Check
                    </button>
                  </div>
                  {showResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "mt-6 p-6 rounded-2xl border",
                        userAnswer === data.assessment.fill_blank.answer 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      )}
                    >
                      <div className="flex items-center gap-2 font-black mb-2 text-xs uppercase tracking-widest">
                        {userAnswer === data.assessment.fill_blank.answer ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                        {userAnswer === data.assessment.fill_blank.answer ? 'Correct!' : 'Not quite...'}
                      </div>
                      <p className="text-sm font-medium">The answer is: <span className="font-bold text-white">{data.assessment.fill_blank.answer}</span></p>
                    </motion.div>
                  )}
                </div>
              </div>
            </section>

            <div className="brand-gradient text-white p-12 rounded-[40px] shadow-lg shadow-brand/20 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.3em] mb-6">Sensei's Encouragement</h3>
                <p className="text-white font-serif italic text-2xl leading-relaxed">
                  "{data.motivation}"
                </p>
              </div>
              <Sparkles className="absolute -right-8 -bottom-8 w-48 h-48 text-white/5 rotate-12" />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
