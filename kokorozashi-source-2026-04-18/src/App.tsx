import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Brain, MessageSquare, Search, ChevronRight, Volume2, Sparkles, Newspaper, Trophy, Users, Wifi, WifiOff, Eye, EyeOff, CheckCircle, Mic, MicOff, ArrowUpRight, Facebook, Share2,
  Database, Settings, Swords, Zap, Github, Linkedin, Mail, Heart, User as UserIcon, Phone, Calendar, MapPin, Camera, Save, LogOut, Palette, Layout, Shield, Info, HelpCircle, Smartphone, AlertCircle,
  Chrome, MessageCircle
} from 'lucide-react';
import { VocabEntry, View, NewsArticle, MockTest, CommunityPost, Theme } from './types';
import n5Data from './data/jlpt_n5.json';
import n4Data from './data/jlpt_n4.json';
import n3Data from './data/jlpt_n3.json';
import n2Data from './data/jlpt_n2.json';
import n1Data from './data/jlpt_n1.json';
import mockPapers from './data/mock_papers.json';
import { cn } from './lib/utils';
import Markdown from 'react-markdown';
import { getJapaneseExplanation, chatWithTutor, explainNewsArticle, generateMockTest, embedText, parseScrapedJLPT, getAdvancedGrammarExplanation } from './services/gemini';
import { generateFlashcard } from './services/flashcardService';
import { supabase, searchKnowledge, addKnowledgeItem, logStudentPerformance, fetchCommunityPosts, createCommunityPost, getLlmUsage } from './lib/supabase';
import { User } from '@supabase/supabase-js';
import { Profile, StudyLog, MockExamResult, BossBattleData, GrammarExplanation } from './types';
import ProfileView from './components/ProfileView';

const XBrandIcon = ({ size = 18, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    aria-hidden="true" 
    className={className}
    fill="currentColor"
  >
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zM17.61 20.644h2.039L6.486 3.24H4.298L17.61 20.644z"></path>
  </svg>
);
import DashboardView from './components/DashboardView';
import BossBattle from './components/BossBattle';
import { GrammarDetailView } from './components/GrammarDetailView';
import UPIDonationModal from './components/UPIDonationModal';
import { AdminDashboard } from './components/AdminDashboard';
import KanjiStrokeOrder from './components/KanjiStrokeOrder';
import StudyRoom from './components/StudyRoom';
import FlashcardEngine from './components/FlashcardEngine';
import { ComplianceModal } from './components/Compliance';

const jlptData: Record<string, VocabEntry[]> = {
  N5: n5Data,
  N4: n4Data,
  N3: n3Data,
  N2: n2Data,
  N1: n1Data,
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [hub, setHub] = useState<'home' | 'practice' | 'sensei' | 'social' | 'profile'>('home');
  const [theme, setTheme] = useState<Theme>('midnight');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [selectedLevel, setSelectedLevel] = useState('N5');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWord, setSelectedWord] = useState<VocabEntry | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);
  const [showStrokeOrder, setShowStrokeOrder] = useState(false);
  const [currentMockTest, setCurrentMockTest] = useState<MockTest | null>(null);
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [studyLogs, setStudyLogs] = useState<StudyLog[]>([]);
  const [examResults, setExamResults] = useState<MockExamResult[]>([]);
  const [weakTopic, setWeakTopic] = useState<string | null>(null);
  const [showFurigana, setShowFurigana] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [currentBossBattle, setCurrentBossBattle] = useState<BossBattleData | null>(null);
  const [currentGrammarDetail, setCurrentGrammarDetail] = useState<GrammarExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [hasConsented, setHasConsented] = useState(false);
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);

  const [isUPIModalOpen, setIsUPIModalOpen] = useState(false);
  const upiId = (import.meta as any).env.VITE_UPI_ID || '';
  const upiName = (import.meta as any).env.VITE_UPI_NAME || 'Kokorozashi Support';

  const handleDonation = async () => {
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Failed to get checkout URL from server.");
      }
    } catch (err: any) {
      console.error("Donation error:", err);
      alert(err.message || "Failed to initiate donation. Please try again later.");
    }
  };

  const handleTestLogin = () => {
    const mockUser: User = {
      id: 'test-user-id',
      email: 'test@example.com',
      app_metadata: {},
      user_metadata: { full_name: 'Test User', avatar_url: 'https://picsum.photos/seed/test/200' },
      aud: 'authenticated',
      created_at: new Date().toISOString(),
    };
    setUser(mockUser);
    setProfile({
      id: 'test-user-id',
      username: 'TestUser',
      first_name: 'Test',
      last_name: 'User',
      photo_url: 'https://picsum.photos/seed/test/200',
      target_level: 'N5',
      xp_points: 100,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!hasConsented) {
      setError("Please agree to the Privacy Policy and Terms of Service.");
      return;
    }
    setLoading(true);
    setError(null);
    setAuthSuccess(null);
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message || "An unexpected error occurred");
    } else {
      setAuthSuccess("Registration successful! Please check your email to confirm your account.");
      setConfirmPassword('');
    }
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setAuthSuccess(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message || "An unexpected error occurred");
    setLoading(false);
  };

  const handleSocialLogin = async (provider: any) => {
    setError(null);
    setAuthSuccess(null);
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin,
          skipBrowserRedirect: true,
        }
      });

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          setError(`The ${provider} login is not enabled in your Supabase dashboard. Please go to Authentication > Providers and enable it.`);
        } else {
          setError(error.message);
        }
        return;
      }

      if (data?.url) {
        // Open in popup to avoid iframe "refused to connect" issues
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const popup = window.open(
          data.url,
          'supabase-oauth',
          `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
        );

        if (!popup) {
          setError("Popup blocked! Please allow popups for this site to use social login.");
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during social login.");
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('kokorozashi_offline_vocab');
    if (cached) {
      setIsOfflineMode(true);
    }
  }, []);

  const cacheVocab = () => {
    const dataToCache = {
      N5: n5Data,
      N4: n4Data,
      N3: n3Data,
      N2: n2Data,
      N1: n1Data,
    };
    localStorage.setItem('kokorozashi_offline_vocab', JSON.stringify(dataToCache));
    setIsOfflineMode(true);
    alert("All JLPT Vocabulary levels cached for offline study!");
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN') {
        setHub('home');
        setView('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchStudyData = async () => {
    if (!user) return;
    
    // Fetch logs for current progress (missions/history)
    const { data: logs } = await supabase
      .from('study_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50); // Increased for better streak/history
    
    const { data: exams } = await supabase
      .from('mock_exam_results')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false })
      .limit(5);

    // Fetch TOTAL mastered count dynamically
    const { count: totalCorrect } = await supabase
      .from('study_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_correct', true);

    if (logs) {
      setStudyLogs(logs);
      // Calculate weak topic: 3 failures in last 50 attempts
      const failures: Record<string, number> = {};
      let identifiedWeakTopic: string | null = null;
      for (const log of logs) {
        if (!log.is_correct) {
          failures[log.topic_tag] = (failures[log.topic_tag] || 0) + 1;
          if (failures[log.topic_tag] >= 3) {
            identifiedWeakTopic = log.topic_tag;
            break;
          }
        }
      }
      setWeakTopic(identifiedWeakTopic);
    }
    if (exams) setExamResults(exams);
    if (totalCorrect !== null) setMasteredCount(totalCorrect);
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchStudyData();
      fetchLlmUsage();
    } else {
      setProfile(null);
      setStudyLogs([]);
      setExamResults([]);
      setWeakTopic(null);
      setUsageCount(0);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('donation') === 'success') {
      alert("Thank you for your donation! Your support helps us keep Kokorozashi running.");
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (params.get('donation') === 'cancel') {
      alert("Donation cancelled. No worries, you can always support us later!");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchLlmUsage = async () => {
    if (!user) return;
    const count = await getLlmUsage(user.id);
    setUsageCount(count);
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, secondary_email, phone, photo_url, age, sex, religion, target_level, xp_points')
      .eq('id', user.id)
      .single();
    
    const metadata = user.user_metadata || {};
    const metaFullName = metadata.full_name || '';
    const [metaFirst, ...metaLastArr] = metaFullName.split(' ');
    const metaLast = metaLastArr.join(' ');
    const metaPhoto = metadata.avatar_url || '';
    const metaUsername = metadata.user_name || metadata.preferred_username || user.email?.split('@')[0] || 'User';

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it with metadata if available
      const newProfile: Partial<Profile> = {
        id: user.id,
        username: metaUsername,
        first_name: metaFirst || '',
        last_name: metaLast || '',
        photo_url: metaPhoto || '',
        target_level: 'N5',
        xp_points: 0,
      };
      const { data: created, error: createError } = await supabase
        .from('profiles')
        .insert(newProfile)
        .select('id, username, first_name, last_name, secondary_email, phone, photo_url, age, sex, religion, target_level, xp_points')
        .single();
      if (!createError) {
        setProfile(created);
      } else {
        console.error("Profile Creation Error:", createError);
        if (createError.code === '23505') {
          const { data: retry } = await supabase.from('profiles').select('id, username, first_name, last_name, secondary_email, phone, photo_url, age, sex, religion, target_level, xp_points').eq('id', user.id).single();
          if (retry) setProfile(retry);
        } else {
          setError(`Failed to create profile: ${createError.message || "An unexpected error occurred"}`);
        }
      }
    } else if (error) {
      console.error("Profile Fetch Error:", error);
      setError(`Failed to fetch profile: ${error.message || "An unexpected error occurred"}`);
    } else {
      // If profile exists but missing basic info, and we have it in metadata, we could update it
      // but for now let's just merge it into the state for better UX if the user hasn't set it
      const mergedProfile = {
        ...data,
        first_name: data.first_name || metaFirst || '',
        last_name: data.last_name || metaLast || '',
        photo_url: data.photo_url || metaPhoto || '',
        username: data.username || metaUsername
      };
      setProfile(mergedProfile);
    }
  };

  useEffect(() => {
    if (view === 'news') {
      fetchNews();
    }
  }, [view]);

  const fetchNews = async () => {
    setIsLoadingNews(true);
    try {
      const response = await fetch('/api/news');
      const data = await response.json();
      if (Array.isArray(data)) {
        setNewsArticles(data);
        setError(null);
      } else {
        console.error("News data is not an array:", data);
        setNewsArticles([]);
        if (data.details?.includes('not found')) {
          setError("Supabase table 'kokorozashi_news' not found. Please run the SQL in 'supabase_setup.sql' in your Supabase SQL Editor.");
        } else {
          setError(data.error || "Failed to fetch news");
        }
      }
    } catch (error) {
      console.error("Failed to fetch news:", error);
      setNewsArticles([]);
      setError("Failed to connect to news service.");
    } finally {
      setIsLoadingNews(false);
    }
  };

  const vocabData = jlptData[selectedLevel] || [];

  const filteredVocab = vocabData.filter(v => 
    v.word.includes(searchQuery) || 
    v.reading.includes(searchQuery) || 
    v.meaning.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleExplain = async (word: VocabEntry) => {
    setSelectedWord(word);
    setIsExplaining(true);
    setExplanation(null);
    const result = await getJapaneseExplanation(word.word, word.reading, word.meaning, user?.id);
    setExplanation(result || "No explanation found.");
    setIsExplaining(false);
    fetchLlmUsage();
  };

  const handleShowGrammarDetail = async (pattern: string, level: string) => {
    setIsExplaining(true);
    try {
      const detail = await getAdvancedGrammarExplanation(pattern, level, 'daily', user?.id);
      if (detail) {
        setCurrentGrammarDetail(detail);
        setView('grammar-detail');
      }
    } catch (error: any) {
      if (error.message === "DAILY_LIMIT_EXCEEDED") {
        setError("You have reached your daily limit for advanced AI analysis.");
      } else {
        setError("Failed to generate advanced explanation.");
      }
    } finally {
      setIsExplaining(false);
      fetchLlmUsage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#fdfcf9] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[40px] p-10 shadow-2xl border border-[#f0f0e8] text-center">
          <div className="w-20 h-20 bg-[#5A5A40] rounded-full flex items-center justify-center text-white font-serif italic text-4xl mx-auto mb-8 shadow-lg">
            志
          </div>
          <h2 className="font-serif text-3xl mb-2">志 — Kokorozashi</h2>
          <p className="text-[#8e8e8e] text-sm mb-2">Your journey to Japanese mastery starts here.</p>
          <p className="text-[#5A5A40] text-xs font-medium mb-8">日本語能力試験（JLPT）合格への第一歩</p>
          
          <div className="space-y-4">
            <div className="flex p-1 bg-[#f5f5f0] rounded-xl mb-6">
              <button 
                onClick={() => { 
                  setAuthMode('signin'); 
                  setError(null); 
                  setAuthSuccess(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  authMode === 'signin' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#8e8e8e]"
                )}
              >
                Login
              </button>
              <button 
                onClick={() => { 
                  setAuthMode('signup'); 
                  setError(null); 
                  setAuthSuccess(null);
                  setPassword('');
                  setConfirmPassword('');
                }}
                className={cn(
                  "flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-lg transition-all",
                  authMode === 'signup' ? "bg-white text-[#5A5A40] shadow-sm" : "text-[#8e8e8e]"
                )}
              >
                Sign Up
              </button>
            </div>

            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="メールアドレス (Email)"
                className="w-full bg-[#f5f5f0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="パスワード (Password)"
                  className="w-full bg-[#f5f5f0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8e8e8e] hover:text-[#5A5A40]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {authMode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="パスワードの確認 (Confirm Password)"
                    className="w-full bg-[#f5f5f0] border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#5A5A40]/20"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                  />
                </motion.div>
              )}

              {authMode === 'signup' && (
                <div className="flex items-start gap-3 py-2">
                  <input 
                    type="checkbox" 
                    id="consent"
                    className="mt-1 w-4 h-4 rounded border-[#e8e4d9] text-[#5A5A40] focus:ring-[#5A5A40]/20"
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                  />
                  <label htmlFor="consent" className="text-[10px] text-[#8e8e8e] leading-relaxed">
                    I agree to the <button type="button" onClick={() => setIsComplianceModalOpen(true)} className="text-[#5A5A40] font-bold hover:underline">Privacy Policy</button> and <button type="button" onClick={() => setIsComplianceModalOpen(true)} className="text-[#5A5A40] font-bold hover:underline">Terms of Service</button>.
                  </label>
                </div>
              )}
              
              {error && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-red-500 bg-red-50 p-3 rounded-xl border border-red-100"
                >
                  {error}
                </motion.p>
              )}

              {authSuccess && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] text-emerald-600 bg-emerald-50 p-3 rounded-xl border border-emerald-100"
                >
                  {authSuccess}
                </motion.p>
              )}

              {authMode === 'signin' && (
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={() => setError("Password reset feature coming soon!")}
                    className="text-[10px] text-[#8e8e8e] hover:text-[#5A5A40] transition-all"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              <button 
                onClick={authMode === 'signin' ? handleSignIn : handleSignUp}
                disabled={loading}
                className="w-full py-4 bg-[#5A5A40] text-white rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#4a4a34] transition-all shadow-lg shadow-[#5A5A40]/20 disabled:opacity-50"
              >
                {loading ? "Processing..." : (authMode === 'signin' ? "ログイン (Login)" : "新規登録 (Sign Up)")}
              </button>

              {email === 'library4japanese@gmail.com' && (
                <button 
                  onClick={handleTestLogin}
                  className="w-full py-3 border-2 border-[#5A5A40] text-[#5A5A40] rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#5A5A40] hover:text-white transition-all"
                >
                  Test as Guest (Functionality Test)
                </button>
              )}
            </div>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#f0f0e8]"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest"><span className="bg-white px-3 text-[#8e8e8e]">Social Login</span></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
                <button 
                  disabled
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl bg-gray-50 transition-all shadow-sm"
                  title="Google (Coming Soon)"
                >
                  <Mail size={18} className="text-gray-400" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#8e8e8e]">Soon</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <button 
                  onClick={() => handleSocialLogin('github')}
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl hover:bg-[#f5f5f0] transition-all hover:shadow-md hover:-translate-y-0.5"
                  title="GitHub"
                >
                  <Github size={18} className="text-black" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#5A5A40]">Log In</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
                <button 
                  disabled
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl bg-gray-50 transition-all shadow-sm"
                  title="LinkedIn (Coming Soon)"
                >
                  <Linkedin size={18} className="text-gray-400" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#8e8e8e]">Soon</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
                <button 
                  disabled
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl bg-gray-50 transition-all shadow-sm"
                  title="X (Twitter) (Coming Soon)"
                >
                  <XBrandIcon size={18} className="text-gray-400" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#8e8e8e]">Soon</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
                <button 
                  disabled
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl bg-gray-50 transition-all shadow-sm"
                  title="Facebook (Coming Soon)"
                >
                  <Facebook size={18} className="text-gray-400" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#8e8e8e]">Soon</span>
              </div>

              <div className="flex flex-col items-center gap-1.5 opacity-40 cursor-not-allowed">
                <button 
                  disabled
                  className="w-full flex items-center justify-center py-3 border border-[#e8e4d9] rounded-xl bg-gray-50 transition-all shadow-sm"
                  title="LINE (Highly popular in Japan) (Coming Soon)"
                >
                  <MessageCircle size={18} className="text-gray-400" />
                </button>
                <span className="text-[8px] font-bold uppercase tracking-tighter text-[#8e8e8e]">Soon</span>
              </div>
            </div>
          </div>
          
          <p className="mt-8 text-[10px] text-[#8e8e8e] leading-relaxed">
            By continuing, you agree to our <button type="button" onClick={() => setIsComplianceModalOpen(true)} className="underline cursor-pointer hover:text-[#5A5A40]">Terms of Service</button> and <button type="button" onClick={() => setIsComplianceModalOpen(true)} className="underline cursor-pointer hover:text-[#5A5A40]">Privacy Policy</button>.
          </p>

          {error && (error.includes("not enabled") || error.includes("Unsupported provider") || error.includes("validation_failed")) && (
            <div className="mt-6 p-5 bg-brand/5 border border-brand/20 rounded-3xl text-left overflow-hidden relative">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Settings size={40} />
              </div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-light mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-brand-light" />
                Action Required: Configure Supabase Auth
              </h4>
              
              <div className="space-y-4">
                <div className="p-3 bg-white/50 rounded-2xl border border-brand/10">
                  <h5 className="text-[9px] font-bold uppercase text-brand-light mb-2">1. Google / Gmail Setup</h5>
                  <p className="text-[10px] text-[#5A5A40] leading-relaxed mb-2">
                    Google is more reliable than Twitter. To set it up:
                  </p>
                  <ul className="text-[9px] text-[#8e8e8e] space-y-1 list-disc pl-4">
                    <li>Go to the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="underline">Google Cloud Console</a>.</li>
                    <li>Create an <b>OAuth 2.0 Client ID</b> for "Web application".</li>
                    <li>Add the <b>Redirect URI</b> (below) to "Authorized redirect URIs".</li>
                    <li>In Supabase <b>Authentication → Providers</b>, enable Google and paste the Client ID / Secret.</li>
                  </ul>
                </div>

                <div className="p-3 bg-white/50 rounded-2xl border border-brand/10">
                  <h5 className="text-[9px] font-bold uppercase text-brand-light mb-2">2. X (Twitter) Specific Fix</h5>
                  <p className="text-[10px] text-[#5A5A40] leading-relaxed mb-2">
                    Twitter is the most common failure point. Ensure you use <b>OAuth 2.0</b> in your Twitter Developer Portal:
                  </p>
                  <ul className="text-[9px] text-[#8e8e8e] space-y-1 list-disc pl-4">
                    <li>Set <b>App Type</b> to "Web App".</li>
                    <li>Add the <b>Redirect URI</b> (below) to "Callback URLs".</li>
                    <li>In Supabase, use your <b>OAuth 2.0 Client ID</b> and <b>Client Secret</b> (not the standard API Key).</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand-light shrink-0">1</div>
                    <p className="text-[10px] text-[#8e8e8e]">Go to <b>Authentication → Providers</b> in <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-brand-light underline font-bold">Supabase</a>.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand-light shrink-0">2</div>
                    <p className="text-[10px] text-[#8e8e8e]">Enable <b>Twitter (X)</b> toggle.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-[10px] font-bold text-brand-light shrink-0">3</div>
                    <p className="text-[10px] text-[#8e8e8e]">Paste your <b>Client ID</b> and <b>Secret</b>.</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-brand/10">
                  <p className="text-[9px] uppercase font-black text-[#5A5A40]/40 tracking-widest mb-2">Your Redirect URI</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-brand/5 rounded-xl text-[9px] break-all font-mono text-brand-light border border-brand/10">
                      {window.location.origin}/auth/v1/callback
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/auth/v1/callback`);
                        alert("Copied!");
                      }}
                      className="p-2 bg-brand-light text-white rounded-lg text-[10px]"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {isComplianceModalOpen && (
            <ComplianceModal 
              isOpen={isComplianceModalOpen} 
              onClose={() => setIsComplianceModalOpen(false)} 
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans bg-[#0A0E27] text-white selection:bg-brand/30">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-[5rem] lg:w-[16rem] h-screen sticky top-0 glass border-r border-white/5 z-50 transition-all duration-300">
        <div className="p-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 brand-gradient rounded-[14px] flex items-center justify-center text-white font-serif italic text-xl shadow-xl shadow-brand/30 relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              <span className="relative z-10">志</span>
            </div>
            <div className="hidden lg:block">
              <h1 className="font-serif text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Kokorozashi</h1>
              <p className="text-[8px] uppercase tracking-[0.3em] text-brand-light font-black opacity-80">JLPT Mastery</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <SidebarNavButton active={hub === 'home'} onClick={() => { setHub('home'); setView('dashboard'); }} icon={<Layout size={20} />} label="Home" />
          <SidebarNavButton active={hub === 'practice'} onClick={() => { setHub('practice'); setView('vocab'); }} icon={<BookOpen size={20} />} label="Practice" />
          <SidebarNavButton active={hub === 'sensei'} onClick={() => { setHub('sensei'); setView('news'); }} icon={<Sparkles size={20} />} label="Sensei" />
          <SidebarNavButton active={hub === 'social'} onClick={() => { setHub('social'); setView('community'); }} icon={<Users size={20} />} label="Social" />
          <SidebarNavButton active={hub === 'profile'} onClick={() => { setHub('profile'); setView('profile'); }} icon={<UserIcon size={20} />} label="Me" />
        </nav>

        <div className="p-4 border-t border-white/5 space-y-4">
          {user ? (
            <button 
              onClick={() => supabase.auth.signOut()}
              className="w-full flex items-center gap-3 px-4 py-3 text-white/40 hover:text-white hover:bg-white/5 rounded-xl transition-all group"
            >
              <LogOut size={20} className="group-hover:text-rose-400 transition-colors" />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Sign Out</span>
            </button>
          ) : (
            <button 
              onClick={() => setView('profile')}
              className="w-full flex items-center gap-3 px-4 py-3 text-brand-light hover:bg-brand/10 rounded-xl transition-all group"
            >
              <UserIcon size={20} />
              <span className="hidden lg:block text-xs font-black uppercase tracking-widest">Sign In</span>
            </button>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header (Search & Tools) */}
        <header className="sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="md:hidden flex items-center gap-3">
              <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center text-white font-serif italic text-lg">志</div>
              <h1 className="font-serif text-xl font-black tracking-tight">Kokorozashi</h1>
            </div>

            <div className="hidden md:block relative flex-1 max-w-xs lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input 
                type="text" 
                placeholder="Search vocabulary, grammar, or news..." 
                className="w-full pl-12 pr-4 py-3 glass border border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-brand/20 transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-1 glass p-1 rounded-full">
                <button 
                  onClick={() => setShowFurigana(!showFurigana)}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    showFurigana ? "bg-brand text-white shadow-sm" : "text-white/40 hover:text-white"
                  )}
                >
                  {showFurigana ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button 
                  onClick={cacheVocab}
                  className={cn(
                    "p-2 rounded-full transition-all",
                    isOfflineMode ? "bg-emerald-500 text-white shadow-sm" : "text-white/40 hover:text-white"
                  )}
                >
                  {isOfflineMode ? <Wifi size={16} /> : <WifiOff size={16} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            {/* Sub-Navigation Hubs */}
            <AnimatePresence mode="wait">
              {hub === 'practice' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2 mb-12 glass p-1.5 rounded-[2rem] w-fit mx-auto"
                >
                  <SubNavButton active={view === 'vocab' || view === 'grammar-detail'} onClick={() => setView('vocab')} label="Vocabulary" />
                  <SubNavButton active={view === 'review'} onClick={() => setView('review')} label="Flashcards" />
                  <SubNavButton active={view === 'quiz' || view === 'boss-battle'} onClick={() => setView('quiz')} label="Quizzes" />
                </motion.div>
              )}
              {hub === 'sensei' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2 mb-12 glass p-1.5 rounded-[2rem] w-fit mx-auto"
                >
                  <SubNavButton active={view === 'news' || view === 'mock-test'} onClick={() => setView('news')} label="Reading Room" />
                  <SubNavButton active={view === 'tutor'} onClick={() => setView('tutor')} label="AI Tutor" />
                </motion.div>
              )}
              {hub === 'social' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2 mb-12 glass p-1.5 rounded-[2rem] w-fit mx-auto"
                >
                  <SubNavButton active={view === 'community'} onClick={() => setView('community')} label="Community" />
                  <SubNavButton active={view === 'study-room'} onClick={() => setView('study-room')} label="Study Group" />
                </motion.div>
              )}
              {hub === 'profile' && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-center gap-2 mb-12 glass p-1.5 rounded-[2rem] w-fit mx-auto"
                >
                  <SubNavButton active={view === 'profile'} onClick={() => setView('profile')} label="Stats" />
                  <SubNavButton active={view === 'settings'} onClick={() => setView('settings')} label="Settings" />
                  {(user?.email === 'library4japanese@gmail.com' || profile?.username === 'Rajni Singh') && (
                    <SubNavButton active={view === 'admin'} onClick={() => setView('admin')} label="Admin" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {/* Content Views */}
              {view === 'review' && <FlashcardEngine />}
              {view === 'study-room' && <StudyRoom user={user} username={profile?.username || user?.email?.split('@')[0] || 'Anonymous'} />}
              {view === 'dashboard' && user && (
                <DashboardView 
                  profile={profile} 
                  studyLogs={studyLogs} 
                  onNavigate={setView}
                  weakTopic={weakTopic}
                  onDonate={handleDonation}
                  onDonateUPI={() => setIsUPIModalOpen(true)}
                />
              )}
              {view === 'vocab' && (
                <motion.div 
                  key="vocab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  <div className="lg:col-span-8 space-y-8">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-[2.5rem] font-black tracking-tight leading-none">JLPT {selectedLevel}</h2>
                        <p className="text-sm text-white/40 font-black uppercase tracking-[0.2em] mt-2">{filteredVocab.length} words found</p>
                      </div>
                      
                      <div className="flex items-center gap-1 glass p-1.5 rounded-2xl">
                        {['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => (
                          <button
                            key={level}
                            onClick={() => setSelectedLevel(level)}
                            className={cn(
                              "px-4 py-2 rounded-xl text-xs font-black transition-all",
                              selectedLevel === level 
                                ? "bg-brand text-white shadow-lg shadow-brand/20" 
                                : "text-white/40 hover:text-white"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {filteredVocab.map((item, idx) => (
                        <VocabCard 
                          key={idx} 
                          item={item} 
                          onClick={() => handleExplain(item)}
                          onPlay={() => speak(item.word)}
                          isSelected={selectedWord?.word === item.word}
                          showFurigana={showFurigana}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="lg:col-span-4">
                    <div className="sticky top-28 space-y-6">
                      <div className="glass-card min-h-[500px] flex flex-col border-white/5">
                        {selectedWord ? (
                          <div className="flex-1 flex flex-col">
                            <div className="mb-8">
                              <div className="flex items-center justify-between mb-6">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-light bg-brand/10 px-4 py-1.5 rounded-full border border-brand/20">
                                  {selectedWord.jlpt_level}
                                </span>
                                <button 
                                  onClick={() => speak(selectedWord.word)}
                                  className="text-white/60 hover:text-white transition-colors p-3 rounded-2xl glass border-white/5"
                                >
                                  <Volume2 size={24} />
                                </button>
                              </div>
                              <h3 className="font-jp text-[3.5rem] font-black mb-2 tracking-tighter leading-none">{selectedWord.word}</h3>
                              {showFurigana && <p className="text-white/40 font-jp text-2xl mb-6">{selectedWord.reading}</p>}
                              <p className="text-2xl font-black text-white mb-8">{selectedWord.meaning}</p>
                              
                              <button 
                                onClick={() => setShowStrokeOrder(!showStrokeOrder)}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-brand-light hover:text-brand transition-colors"
                              >
                                <Eye size={16} />
                                {showStrokeOrder ? "Hide Stroke Order" : "Show Stroke Order"}
                              </button>

                              {showStrokeOrder && (
                                <div className="mt-6 p-6 glass rounded-3xl border-white/5">
                                  <KanjiStrokeOrder kanji={selectedWord.word[0]} />
                                  <p className="text-[10px] text-center text-white/20 mt-4 font-black uppercase tracking-widest">Stroke Order Visualization</p>
                                </div>
                              )}
                            </div>

                            <div className="h-px bg-white/5 mb-8" />

                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                              {isExplaining ? (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                  <Sparkles className="text-brand-light animate-pulse mb-4" size={48} />
                                  <p className="text-sm font-black uppercase tracking-widest text-white/40">Rudra is analyzing...</p>
                                </div>
                              ) : explanation ? (
                                <div className="space-y-8">
                                  <button 
                                    onClick={() => handleShowGrammarDetail(selectedWord.word, selectedWord.jlpt_level)}
                                    className="w-full flex items-center justify-center gap-3 py-4 brand-gradient text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.02] transition-all shadow-xl shadow-brand/30"
                                  >
                                    <Sparkles size={18} />
                                    Advanced AI Analysis
                                  </button>
                                  <div className="markdown-body text-white/80 leading-relaxed">
                                    <Markdown>{explanation}</Markdown>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                                  <Info className="text-white/10 mb-4" size={48} />
                                  <p className="text-sm font-black uppercase tracking-widest text-white/20">Select a word to begin analysis</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5">
                              <BookOpen className="text-white/20" size={32} />
                            </div>
                            <h3 className="text-xl font-black mb-3">Select a Word</h3>
                            <p className="text-sm text-white/40 max-w-[240px] font-medium leading-relaxed">Choose a vocabulary item to see its full details and AI-powered explanation.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              {/* ... other views ... */}
              {view === 'grammar-detail' && currentGrammarDetail && <GrammarDetailView data={currentGrammarDetail} onBack={() => setView('vocab')} />}
              {view === 'news' && <NewsView articles={newsArticles} isLoading={isLoadingNews} onRefresh={fetchNews} usageCount={usageCount} onStartTest={async (article) => { setIsGeneratingTest(true); setView('mock-test'); const test = await generateMockTest(article.title, article.content); setCurrentMockTest(test); setIsGeneratingTest(false); fetchLlmUsage(); }} />}
              {view === 'mock-test' && <MockTestView test={currentMockTest} isLoading={isGeneratingTest} onBack={() => setView('news')} user={user} profile={profile} onRefreshStudyData={fetchStudyData} />}
              {view === 'community' && <CommunityView user={user} profile={profile} />}
              {view === 'admin' && (user?.email === 'library4japanese@gmail.com' || profile?.username === 'Rajni Singh') && <AdminDashboard />}
              {view === 'boss-battle' && currentBossBattle && <BossBattle bossData={currentBossBattle} onVictory={async (xp) => { if (user) { await supabase.rpc('increment_xp', { amount: xp }); await fetchProfile(); } setView('quiz'); setCurrentBossBattle(null); }} onDefeat={() => { setView('quiz'); setCurrentBossBattle(null); }} />}
              {view === 'quiz' && <QuizView vocabData={vocabData} user={user} profile={profile} onStartBoss={() => { const boss: BossBattleData = { id: 'n1-guardian', name: 'Grammar Guardian', level: selectedLevel, questions: [{ question: `To pass, you must correctly use '～を皮切りに' in this sentence!`, options: [{ text: 'この祭りを皮切りに、各地でイベントが開かれる。', isCorrect: true }, { text: '雨を皮切りに、傘をさした。', isCorrect: false }, { text: '勉強を皮切りに、合格した。', isCorrect: false }, { text: '朝食を皮切りに、学校へ行った。', isCorrect: false }], explanation: '～を皮切りに indicates that something started with a specific event and then spread or continued.' }, { question: `Choose the correct usage of '～にかたくない'.`, options: [{ text: '彼の成功は想像にかたくない。', isCorrect: true }, { text: 'このパンは食べるにかたくない。', isCorrect: false }, { text: '意志を強く持つのにかたくない。', isCorrect: false }, { text: '石はかたくない。', isCorrect: false }], explanation: '～にかたくない means "it is not difficult to (imagine/guess/etc.)".' }, { question: `Which one uses '～極まりない' correctly?`, options: [{ text: '彼の態度は失礼極まりない。', isCorrect: true }, { text: 'この山は高い極まりない。', isCorrect: false }, { text: '勉強は楽しい極まりない。', isCorrect: false }, { text: '海は広い極まりない。', isCorrect: false }], explanation: '～極まりない means "extremely" or "to the utmost limit", usually for negative qualities.' }, { question: `Final Strike! Use '～といえども' correctly.`, options: [{ text: '子供といえども、社会のルールは守るべきだ。', isCorrect: true }, { text: '暑いといえども、エアコンをつけた。', isCorrect: false }, { text: '日本人といえども、日本語を話す。', isCorrect: false }, { text: '忙しいといえども、休みます。', isCorrect: false }], explanation: '～といえども means "even though" or "even if".' }] }; setCurrentBossBattle(boss); setView('boss-battle'); }} />}
              {view === 'tutor' && <TutorView user={user} profile={profile} studyLogs={studyLogs} weakTopic={weakTopic} usageCount={usageCount} onRefreshUsage={fetchLlmUsage} />}
              {view === 'profile' && user && <ProfileView user={user} profile={profile} onRefresh={fetchProfile} studyLogs={studyLogs} examResults={examResults} onRefreshStudyData={fetchStudyData} onDonate={handleDonation} onDonateUPI={() => setIsUPIModalOpen(true)} onOpenSettings={() => setView('settings')} weakTopic={weakTopic} totalMastered={masteredCount} />}
              {view === 'settings' && user && <SettingsView theme={theme} onThemeChange={setTheme} profile={profile} onProfileUpdate={fetchProfile} user={user} onOpenCompliance={() => setIsComplianceModalOpen(true)} />}
            </AnimatePresence>
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/5 px-2 py-3 flex items-center justify-around z-50 rounded-t-[2.5rem] backdrop-blur-3xl">
          <MobileNavButton active={hub === 'home'} onClick={() => { setHub('home'); setView('dashboard'); }} icon={<Layout size={20} />} label="Home" />
          <MobileNavButton active={hub === 'practice'} onClick={() => { setHub('practice'); setView('vocab'); }} icon={<BookOpen size={20} />} label="Practice" />
          <MobileNavButton active={hub === 'sensei'} onClick={() => { setHub('sensei'); setView('news'); }} icon={<Sparkles size={20} />} label="Sensei" />
          <MobileNavButton active={hub === 'social'} onClick={() => { setHub('social'); setView('community'); }} icon={<Users size={20} />} label="Social" />
          <MobileNavButton active={hub === 'profile'} onClick={() => { setHub('profile'); setView('profile'); }} icon={<UserIcon size={20} />} label="Me" />
        </nav>
      </div>

      <UPIDonationModal 
        isOpen={isUPIModalOpen} 
        onClose={() => setIsUPIModalOpen(false)} 
        upiId={upiId} 
        payeeName={upiName} 
      />
      <AnimatePresence>
        {isComplianceModalOpen && (
          <ComplianceModal 
            isOpen={isComplianceModalOpen} 
            onClose={() => setIsComplianceModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group relative",
        active ? "bg-brand/10 text-brand" : "text-white/40 hover:text-white hover:bg-white/5"
      )}
    >
      <div className={cn(
        "transition-all",
        active ? "text-brand scale-110" : "text-white/40 group-hover:text-white"
      )}>
        {icon}
      </div>
      <span className="hidden lg:block text-xs font-black uppercase tracking-widest">{label}</span>
      {active && (
        <motion.div 
          layoutId="sidebar-active"
          className="absolute left-0 w-1 h-8 bg-brand rounded-r-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function MobileNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 transition-all flex-1 py-1.5 active:scale-95 touch-manipulation",
        active ? "text-brand" : "text-white/40"
      )}
    >
      <div className={cn(
        "p-2.5 rounded-xl transition-all",
        active ? "bg-brand/10 scale-105" : ""
      )}>
        {icon}
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}

function SubNavButton({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-5 md:px-6 py-3 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all relative overflow-hidden group active:scale-95 touch-manipulation",
        active 
          ? "text-white" 
          : "text-white/40 hover:text-white"
      )}
    >
      <span className="relative z-10">{label}</span>
      {active && (
        <motion.div 
          layoutId="subnav-bg"
          className="absolute inset-0 bg-brand shadow-lg shadow-brand/20"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </button>
  );
}

function VocabCard({ item, onClick, onPlay, isSelected, showFurigana }: { item: VocabEntry, onClick: () => void, onPlay: () => void, isSelected: boolean, showFurigana: boolean }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "text-left p-6 rounded-[32px] border transition-all group relative cursor-pointer overflow-hidden",
        isSelected 
          ? "bg-brand border-brand text-white shadow-[0_20px_40px_rgba(112,0,255,0.3)]" 
          : "glass border-white/5 hover:border-white/20 hover:bg-white/10"
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      
      {isSelected && (
        <motion.div 
          layoutId="active-glow"
          className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 blur-3xl rounded-full"
        />
      )}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className="font-jp text-3xl font-black tracking-tighter">{item.word}</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onPlay(); }}
            className={cn(
              "p-2.5 rounded-xl transition-all",
              isSelected ? "bg-white/20 text-white hover:bg-white/30" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"
            )}
          >
            <Volume2 size={16} />
          </button>
          <ChevronRight className={cn("transition-transform duration-500", isSelected ? "text-white/50 rotate-90" : "text-white/20 group-hover:translate-x-1")} size={18} />
        </div>
      </div>
      {showFurigana && <p className={cn("font-jp text-sm mb-1 font-black tracking-widest", isSelected ? "text-white/70" : "text-white/40")}>{item.reading}</p>}
      <p className={cn("font-display text-lg font-black", isSelected ? "text-white" : "text-white/80")}>{item.meaning}</p>
    </motion.div>
  );
}

function UsageBadge({ count }: { count: number }) {
  const limit = 50;
  const remaining = Math.max(0, limit - count);
  const percentage = (count / limit) * 100;

  return (
    <div className="flex items-center gap-3 px-4 py-2 glass rounded-2xl">
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        remaining < 10 ? "bg-amber-500/20 text-amber-400" : "bg-brand/20 text-brand-light"
      )}>
        <Zap size={16} />
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">AI Power</span>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              className={cn("h-full transition-all", remaining < 10 ? "bg-amber-500" : "bg-brand")} 
            />
          </div>
          <span className="text-[10px] font-bold text-white/60">{remaining} left</span>
        </div>
      </div>
    </div>
  );
}

function NewsView({ articles, isLoading, onStartTest, onRefresh, usageCount }: { articles: NewsArticle[], isLoading: boolean, onStartTest: (article: NewsArticle) => void, onRefresh: () => void, usageCount: number }) {
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newArticle, setNewArticle] = useState({ title: '', content: '', difficulty: 'N3', source_url: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnalyze = async (article: NewsArticle) => {
    setSelectedArticle(article);
    setIsAnalyzing(true);
    setAnalysis(null);
    const result = await explainNewsArticle(article.title, article.content);
    setAnalysis(result);
    setIsAnalyzing(false);
    onRefresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) return;
    
    setIsSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newArticle),
      });
      if (response.ok) {
        setNewArticle({ title: '', content: '', difficulty: 'N3', source_url: '' });
        setShowAddForm(false);
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to add news:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/news/sync', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        onRefresh();
      }
    } catch (error) {
      console.error("Failed to sync news:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black tracking-tight">Fresh News <span className="text-white/20">(Simplified)</span></h2>
          <div className="flex items-center gap-4">
            <UsageBadge count={usageCount} />
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="text-[10px] font-black uppercase tracking-widest text-brand-light hover:text-brand disabled:opacity-50 transition-colors"
            >
              {isSyncing ? "Syncing..." : "Sync Latest"}
            </button>
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-[10px] font-black uppercase tracking-widest text-brand-light hover:text-brand transition-colors"
            >
              {showAddForm ? "Cancel" : "+ Add News"}
            </button>
          </div>
        </div>
        
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass-card p-8 space-y-4 mb-8"
            onSubmit={handleSubmit}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Title</label>
                <input 
                  type="text" 
                  required
                  className="w-full glass border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand/50 transition-all"
                  value={newArticle.title}
                  onChange={e => setNewArticle({...newArticle, title: e.target.value})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Difficulty</label>
                <select 
                  className="w-full glass border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand/50 transition-all appearance-none"
                  value={newArticle.difficulty}
                  onChange={e => setNewArticle({...newArticle, difficulty: e.target.value})}
                >
                  <option className="bg-[#0A0E27]">N5</option>
                  <option className="bg-[#0A0E27]">N4</option>
                  <option className="bg-[#0A0E27]">N3</option>
                  <option className="bg-[#0A0E27]">N2</option>
                  <option className="bg-[#0A0E27]">N1</option>
                  <option className="bg-[#0A0E27]">N4-N3</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Source URL (Optional)</label>
              <input 
                type="url" 
                className="w-full glass border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-brand/50 transition-all"
                value={newArticle.source_url}
                onChange={e => setNewArticle({...newArticle, source_url: e.target.value})}
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/20">Content (Japanese)</label>
              <textarea 
                required
                rows={4}
                className="w-full glass border border-white/10 rounded-xl px-4 py-2 text-sm font-jp text-white outline-none focus:border-brand/50 transition-all"
                value={newArticle.content}
                onChange={e => setNewArticle({...newArticle, content: e.target.value})}
              />
            </div>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 brand-gradient text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg shadow-brand/20"
            >
              {isSubmitting ? "Saving..." : "Save Article to Database"}
            </button>
          </motion.form>
        )}
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Sparkles className="text-brand-light animate-pulse mb-4" size={32} />
            <p className="text-sm italic text-white/40">Loading fresh news from the database...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Array.isArray(articles) && articles.map((article, idx) => (
              <button 
                key={idx}
                onClick={() => handleAnalyze(article)}
                className={cn(
                  "w-full text-left p-8 rounded-[32px] border transition-all",
                  selectedArticle?.title === article.title 
                    ? "brand-gradient border-brand shadow-lg shadow-brand/20 text-white" 
                    : "glass border-white/5 hover:border-white/20 text-white/60"
                )}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                    selectedArticle?.title === article.title ? "bg-white/20 text-white" : "glass text-white/40 border border-white/5"
                  )}>
                    {article.difficulty}
                  </span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); speak(article.content); }}
                    className={cn(
                      "p-2 rounded-full transition-all",
                      selectedArticle?.title === article.title ? "hover:bg-white/10 text-white/50 hover:text-white" : "hover:bg-white/5 text-white/20 hover:text-white"
                    )}
                  >
                    <Volume2 size={16} />
                  </button>
                </div>
                <h3 className="font-jp text-2xl font-black mb-4 japanese-text">{article.title}</h3>
                <p className={cn("font-jp leading-relaxed line-clamp-2", selectedArticle?.title === article.title ? "text-white/80" : "text-white/40")}>
                  {article.content}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="lg:col-span-1">
        <div className="sticky top-28">
          <div className="glass-card p-8 min-h-[500px] flex flex-col">
            {selectedArticle ? (
              <div className="flex-1 flex flex-col">
                <h3 className="font-jp text-xl font-black mb-4 japanese-text text-white">{selectedArticle.title}</h3>
                <div className="p-4 glass rounded-2xl mb-6 border border-white/5">
                  <p className="font-jp text-sm leading-relaxed text-white/60 japanese-text">{selectedArticle.content}</p>
                </div>
                
                <div className="flex gap-2 mb-6">
                  <button 
                    onClick={() => onStartTest(selectedArticle)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 brand-gradient text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all shadow-lg shadow-brand/20"
                  >
                    <Trophy size={16} />
                    Start Mock Test
                  </button>
                </div>

                <div className="h-px bg-[#f0f0e8] mb-6" />

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <Sparkles className="text-[#5A5A40] animate-pulse mb-4" size={32} />
                      <p className="text-sm italic text-[#8e8e8e]">Analyzing article structure and vocabulary...</p>
                    </div>
                  ) : analysis ? (
                    <div className="markdown-body">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  ) : (
                    <p className="text-sm text-[#8e8e8e] italic">Rudra is ready to help you understand this news.</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
                <Newspaper className="text-[#8e8e8e] mb-4" size={32} />
                <h3 className="font-serif text-xl mb-2">Select an Article</h3>
                <p className="text-sm text-[#8e8e8e]">Read simplified Japanese news and get AI-powered breakdowns of vocabulary and grammar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MockTestView({ 
  test, 
  isLoading, 
  onBack, 
  user, 
  profile,
  onRefreshStudyData
}: { 
  test: MockTest | null, 
  isLoading: boolean, 
  onBack: () => void, 
  user: User | null, 
  profile: Profile | null,
  onRefreshStudyData: () => void
}) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<'A' | 'B' | 'C' | 'D' | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Sparkles className="text-[#5A5A40] animate-pulse mb-4" size={48} />
        <h2 className="font-serif text-2xl mb-2">Generating Mock Test</h2>
        <p className="text-[#8e8e8e] italic">Analyzing news content and crafting tricky distractors...</p>
      </div>
    );
  }

  if (!test) return null;

  const q = test.questions[currentQuestion];

  const handleAnswer = async (opt: 'A' | 'B' | 'C' | 'D') => {
    if (showExplanation) return;
    setSelectedOption(opt);
    setShowExplanation(true);
    const correct = opt === q.correctAnswer;
    if (correct) setScore(s => s + 1);
    setResults(prev => ({ ...prev, [currentQuestion]: correct }));

    if (user) {
      await logStudentPerformance(user.id, q.topic || 'Mock Test Question', correct, {
        question: q.question,
        selected_option: opt,
        correct_option: q.correctAnswer,
        type: 'exam'
      });
      onRefreshStudyData(); // Refresh weak topic immediately
    }
  };

  const handleFinish = async () => {
    if (!user || !test) return;
    setIsSaving(true);
    const percentage = (score / test.questions.length) * 100;
    
    // Calculate weak areas based on missed questions
    const missedTopics = Array.from(new Set(
      test.questions
        .filter((_, idx) => results[idx] === false)
        .map(q => q.topic)
        .filter(Boolean) as string[]
    ));

    const result: MockExamResult = {
      user_id: user.id,
      exam_year: new Date().getFullYear().toString(),
      score_percentage: percentage,
      weak_areas: missedTopics
    };
    await supabase.from('mock_exam_results').insert(result);
    
    // Update XP
    await supabase.rpc('increment_xp', { amount: Math.floor(score * 10) });
    
    setIsSaving(false);
    onBack();
  };

  const handleNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    } else {
      // End of test
      setShowExplanation(true); // Keep showing last explanation or show final score
    }
  };

  const isFinished = currentQuestion === test.questions.length - 1 && showExplanation;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-3xl mx-auto py-8"
    >
      <div className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="text-sm text-[#8e8e8e] hover:text-[#2c2c2c] flex items-center gap-1">
          ← Back to News
        </button>
        <div className="text-sm font-medium text-[#5A5A40]">
          Question {currentQuestion + 1} of {test.questions.length} • Score: {score}
        </div>
      </div>

      <div className="bg-white rounded-[40px] p-10 shadow-xl border border-[#f0f0e8]">
        <h3 className="font-jp text-2xl font-bold mb-8 leading-relaxed">{q.question}</h3>

        <div className="grid grid-cols-1 gap-4 mb-8">
          {(['A', 'B', 'C', 'D'] as const).map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              disabled={showExplanation}
              className={cn(
                "p-5 rounded-2xl border text-left transition-all flex items-center gap-4",
                showExplanation 
                  ? opt === q.correctAnswer
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                    : opt === selectedOption
                      ? "bg-rose-50 border-rose-200 text-rose-900"
                      : "bg-white border-[#f0f0e8] opacity-50"
                  : "bg-white border-[#f0f0e8] hover:border-[#5A5A40] hover:bg-[#fdfcf9]"
              )}
            >
              <span className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                showExplanation && opt === q.correctAnswer ? "bg-emerald-500 text-white" : "bg-[#f5f5f0] text-[#8e8e8e]"
              )}>
                {opt}
              </span>
              <span className="font-jp text-lg">{q.options[opt]}</span>
            </button>
          ))}
        </div>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6"
            >
              <div className="p-6 bg-[#fdfcf9] rounded-3xl border border-[#e8e4d9]">
                <div className="flex items-center gap-2 mb-3 text-[#5A5A40]">
                  <Sparkles size={18} />
                  <span className="font-serif font-bold italic">Sensei's Explanation</span>
                </div>
                <div className="markdown-body text-sm">
                  <Markdown>{q.explanation}</Markdown>
                </div>
                
                {q.cultureNote && (
                  <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <div className="flex items-center gap-2 mb-2 text-amber-800">
                      <Sparkles size={16} />
                      <span className="text-xs font-bold uppercase tracking-widest">Culture Note</span>
                    </div>
                    <p className="text-sm text-amber-900 leading-relaxed">{q.cultureNote}</p>
                  </div>
                )}
              </div>

              {isFinished ? (
                <div className="text-center py-6">
                  <h4 className="font-serif text-2xl mb-2">Test Complete!</h4>
                  <p className="text-[#8e8e8e] mb-6">Final Score: {score} / {test.questions.length}</p>
                  <button 
                    onClick={handleFinish}
                    disabled={isSaving}
                    className="px-10 py-3 bg-[#5A5A40] text-white rounded-full hover:bg-[#4a4a34] transition-all disabled:opacity-50"
                  >
                    {isSaving ? "Saving Results..." : "Return to News"}
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleNext}
                  className="w-full py-4 bg-[#5A5A40] text-white rounded-2xl font-medium hover:bg-[#4a4a34] transition-all flex items-center justify-center gap-2"
                >
                  Next Question
                  <ChevronRight size={18} />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function CommunityView({ user, profile }: { user: User | null, profile: Profile | null }) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [postType, setPostType] = useState<'discovery' | 'score'>('discovery');
  const [isPosting, setIsPosting] = useState(false);

  const loadPosts = async () => {
    const data = await fetchCommunityPosts();
    setPosts(data);
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const handlePost = async () => {
    if (!user || !profile || !newPost.trim()) return;
    setIsPosting(true);
    await createCommunityPost(user.id, profile.username || user.email || 'Anonymous', newPost, postType);
    setNewPost('');
    await loadPosts();
    setIsPosting(false);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-8 px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tight">Community Board</h2>
          <p className="text-sm text-white/40 font-bold uppercase tracking-widest mt-1">Connect with fellow learners</p>
        </div>
        <div className="flex gap-2 glass p-1 rounded-2xl">
          <button 
            onClick={() => setPostType('discovery')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              postType === 'discovery' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/40 hover:text-white"
            )}
          >
            Cultural Discovery
          </button>
          <button 
            onClick={() => setPostType('score')}
            className={cn(
              "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              postType === 'score' ? "bg-brand text-white shadow-lg shadow-brand/20" : "text-white/40 hover:text-white"
            )}
          >
            High Score
          </button>
        </div>
      </div>

      {user && (
        <div className="glass-card mb-8">
          <textarea 
            placeholder={postType === 'discovery' ? "Share a cultural discovery..." : "Share your achievement!"}
            className="w-full bg-transparent border-none focus:ring-0 text-lg mb-4 resize-none text-white placeholder:text-white/20"
            rows={3}
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          <div className="flex justify-end">
            <button 
              onClick={handlePost}
              disabled={isPosting || !newPost.trim()}
              className="bg-brand text-white px-8 py-3 rounded-2xl hover:bg-brand-light transition-all disabled:opacity-50 text-xs font-black uppercase tracking-widest shadow-lg shadow-brand/20"
            >
              {isPosting ? "Posting..." : "Share with Community"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {posts.length > 0 ? posts.map((post, idx) => (
          <motion.div 
            key={post.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card group"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 brand-gradient rounded-xl flex items-center justify-center text-white font-black">
                  {post.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-sm">{post.username}</p>
                  <p className="text-[9px] text-brand-light font-black uppercase tracking-widest">
                    {post.type === 'discovery' ? 'Cultural Discovery' : 'High Score'}
                  </p>
                </div>
              </div>
              <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">
                {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
              </span>
            </div>
            <p className="text-white/80 leading-relaxed text-sm">{post.content}</p>
            
            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    const text = `Check out this ${post.type === 'discovery' ? 'Cultural Discovery' : 'Achievement'} on JLPT Master AI! "${post.content}"`;
                    const url = window.location.origin;
                    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="p-2 glass rounded-lg text-white/40 hover:text-brand-light transition-all"
                  title="Share on X"
                >
                  <XBrandIcon size={14} />
                </button>
                <button 
                  onClick={() => {
                    const url = window.location.origin;
                    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="p-2 glass rounded-lg text-white/40 hover:text-blue-500 transition-all"
                  title="Share on Facebook"
                >
                  <Facebook size={14} />
                </button>
                <button 
                  onClick={() => {
                    const url = window.location.origin;
                    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                  }}
                  className="p-2 glass rounded-lg text-white/40 hover:text-blue-600 transition-all"
                  title="Share on LinkedIn"
                >
                  <Linkedin size={14} />
                </button>
              </div>
              <button 
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'JLPT Master AI Achievement',
                      text: `Check out this ${post.type === 'discovery' ? 'Cultural Discovery' : 'Achievement'} on JLPT Master AI!`,
                      url: window.location.origin,
                    });
                  } else {
                    navigator.clipboard.writeText(window.location.origin);
                    alert("App link copied to clipboard!");
                  }
                }}
                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all"
              >
                <Share2 size={12} />
                Share Link
              </button>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-24">
            <Users className="mx-auto text-white/10 mb-4" size={48} />
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">No posts yet. Be the first to share!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function QuizView({ vocabData, user, profile, onStartBoss }: { vocabData: VocabEntry[], user: User | null, profile: Profile | null, onStartBoss: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  if (vocabData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <BookOpen className="text-white/20 mb-4" size={48} />
        <h3 className="text-xl font-black mb-2">No Vocabulary for this Level</h3>
        <p className="text-sm text-white/40">Please select a different JLPT level to practice.</p>
      </div>
    );
  }

  const currentWord = vocabData[currentIndex % vocabData.length];

  const handleNext = async (correct: boolean) => {
    if (correct) setScore(s => ({ ...s, correct: s.correct + 1 }));
    setScore(s => ({ ...s, total: s.total + 1 }));
    
    if (user) {
      const log: StudyLog = {
        user_id: user.id,
        topic_tag: `Vocab ${profile?.target_level || 'N5'}`,
        word: currentWord.word,
        is_correct: correct,
        response_time_seconds: 0,
        metadata: { type: 'vocab' }
      };
      await supabase.from('study_logs').insert(log);
      if (correct) {
        await supabase.rpc('increment_xp', { amount: 5 });
      }
    }

    setShowAnswer(false);
    setCurrentIndex((currentIndex + 1) % vocabData.length);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-2xl mx-auto py-12 px-6"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black tracking-tight mb-4">Practice Mode</h2>
        <div className="flex items-center justify-center gap-6 text-xs font-bold uppercase tracking-widest">
          <span className="text-brand-light">Score: {score.correct}/{score.total}</span>
          <span className="text-white/40">Progress: {currentIndex + 1}/{vocabData.length}</span>
          <button 
            onClick={onStartBoss}
            className="flex items-center gap-2 px-4 py-2 glass text-red-400 rounded-full border border-red-500/20 hover:bg-red-500/10 transition-all"
          >
            <Swords size={14} />
            Challenge Boss
          </button>
        </div>
      </div>

      <div className="glass-card p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/5">
          <motion.div 
            className="h-full brand-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / vocabData.length) * 100}%` }}
          />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="py-8"
          >
            <h3 className="font-jp text-8xl font-black mb-12 tracking-tighter">{currentWord.word}</h3>
            
            <AnimatePresence>
              {showAnswer ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <p className="font-jp text-3xl text-brand-light font-bold">{currentWord.reading}</p>
                  <p className="text-3xl font-display font-black text-white">{currentWord.meaning}</p>
                  <div className="flex items-center justify-center gap-4 mt-12">
                    <button 
                      onClick={() => handleNext(false)}
                      className="px-8 py-4 rounded-2xl glass text-white/40 hover:text-white transition-all font-bold"
                    >
                      I missed it
                    </button>
                    <button 
                      onClick={() => handleNext(true)}
                      className="px-8 py-4 rounded-2xl bg-brand text-white hover:bg-brand-light transition-all font-bold shadow-lg shadow-brand/20"
                    >
                      Got it!
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button 
                  onClick={() => setShowAnswer(true)}
                  className="px-12 py-5 rounded-2xl glass text-white font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Show Answer
                </button>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function SettingsView({ 
  theme, 
  onThemeChange, 
  profile, 
  onProfileUpdate, 
  user,
  onOpenCompliance
}: { 
  theme: Theme, 
  onThemeChange: (theme: Theme) => void,
  profile: Profile | null,
  onProfileUpdate: () => void,
  user: User,
  onOpenCompliance: () => void
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Profile>>({});

  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { role, ...saveData } = formData;
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...saveData
        });
      
      if (error) {
        // Fail-safe for missing columns (common in Supabase when schema is out of sync)
        if (error.message.includes("column") && (error.message.includes("first_name") || error.message.includes("last_name"))) {
          console.warn("Detected missing columns in Supabase. Retrying without name fields...");
          const { first_name, last_name, ...fallbackData } = saveData;
          const { error: retryError } = await supabase
            .from('profiles')
            .upsert({
              id: user.id,
              ...fallbackData
            });
          if (retryError) throw retryError;
          alert("Settings saved, but your Name couldn't be updated because the database columns are missing. Please run the SQL migration in your Supabase dashboard.");
        } else {
          throw error;
        }
      } else {
        onProfileUpdate();
        alert("Settings saved successfully!");
      }
    } catch (err: any) {
      alert("Error saving settings: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto py-12 px-6 space-y-8"
    >
      <div className="glass-card p-10">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight">App Settings</h2>
            <p className="text-sm text-white/40 font-bold uppercase tracking-widest">Personalize your experience</p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Theme Selection */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <Palette size={14} />
              Visual Theme
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                { id: 'classic', name: 'Classic', color: 'bg-[#5A5A40]' },
                { id: 'sakura', name: 'Sakura', color: 'bg-[#ffb7c5]' },
                { id: 'zen', name: 'Zen Garden', color: 'bg-[#4a5d4e]' },
                { id: 'cyberpunk', name: 'Cyberpunk', color: 'bg-[#ff0055]' },
                { id: 'midnight', name: 'Midnight', color: 'bg-[#38bdf8]' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => onThemeChange(t.id as Theme)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all",
                    theme === t.id ? "border-brand bg-white/5" : "border-transparent hover:bg-white/5"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-full shadow-inner", t.color)} />
                  <span className="text-xs font-bold">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="h-px bg-white/5" />

          {/* Profile Information */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <UserIcon size={14} />
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Username</label>
                <input 
                  type="text" 
                  className="w-full glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all"
                  value={formData.username || ''}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Target JLPT Level</label>
                <select 
                  className="w-full glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all appearance-none"
                  value={formData.target_level || ''}
                  onChange={e => setFormData({...formData, target_level: e.target.value as any})}
                >
                  <option value="N5">N5 - Beginner</option>
                  <option value="N4">N4 - Elementary</option>
                  <option value="N3">N3 - Intermediate</option>
                  <option value="N2">N2 - Pre-Advanced</option>
                  <option value="N1">N1 - Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">First Name</label>
                <input 
                  type="text" 
                  className="w-full glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all"
                  value={formData.first_name || ''}
                  onChange={e => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-white/60 ml-2">Last Name</label>
                <input 
                  type="text" 
                  className="w-full glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all"
                  value={formData.last_name || ''}
                  onChange={e => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
            </div>
          </section>

          <div className="h-px bg-white/5" />

          {/* Preferences */}
          <section>
            <h3 className="text-xs font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
              <Layout size={14} />
              App Preferences
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-6 glass rounded-[24px]">
                <div>
                  <p className="text-sm font-bold">Auto-show Furigana</p>
                  <p className="text-xs text-white/60 font-bold uppercase tracking-widest mt-1">Display reading aids above Kanji</p>
                </div>
                <div className="w-12 h-6 bg-brand rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                </div>
              </div>
              <div className="flex items-center justify-between p-6 glass rounded-[24px]">
                <div>
                  <p className="text-sm font-bold">Daily Study Reminders</p>
                  <p className="text-xs text-white/60 font-bold uppercase tracking-widest mt-1">Get notified to keep your streak alive</p>
                </div>
                <div className="w-12 h-6 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-4 h-4 bg-white/40 rounded-full" />
                </div>
              </div>
            </div>
          </section>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full py-5 bg-brand text-white rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-brand-light transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20"
          >
            <Save size={18} />
            {loading ? "Saving Changes..." : "Save All Settings"}
          </button>

          <div className="pt-8 border-t border-white/5 flex flex-col items-center gap-6">
            <div className="flex items-center gap-6">
              <button 
                onClick={onOpenCompliance}
                className="text-[10px] text-white/40 hover:text-brand-light underline font-black uppercase tracking-widest"
              >
                Privacy Policy
              </button>
              <button 
                onClick={onOpenCompliance}
                className="text-[10px] text-white/40 hover:text-brand-light underline font-black uppercase tracking-widest"
              >
                Terms of Service
              </button>
            </div>
            
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to delete your account? This action is permanent and will delete all your learning progress.")) {
                  supabase.from('profiles').delete().eq('id', user.id).then(() => {
                    supabase.auth.signOut();
                  });
                }
              }}
              className="w-full py-5 border-2 border-red-500/20 text-red-400 rounded-[24px] text-sm font-black uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
            >
              <AlertCircle size={18} />
              Delete Account & Data
            </button>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          onClick={onOpenCompliance}
          className="bg-white p-6 rounded-3xl border border-[#f0f0e8] flex items-center gap-4 hover:bg-[#f5f5f0] transition-all text-left"
        >
          <Shield className="text-[#5A5A40]" size={20} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Privacy & Terms</p>
            <p className="text-[10px] text-[#8e8e8e]">View our compliance policies</p>
          </div>
        </button>
        <div className="bg-white p-6 rounded-3xl border border-[#f0f0e8] flex items-center gap-4">
          <Info className="text-[#5A5A40]" size={20} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Version</p>
            <p className="text-[10px] text-[#8e8e8e]">v2.4.0 (Stable)</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-[#f0f0e8] flex items-center gap-4">
          <HelpCircle className="text-[#5A5A40]" size={20} />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">Support</p>
            <p className="text-[10px] text-[#8e8e8e]">Contact library4japanese</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ProfileDetail({ label, value, icon }: { label: string, value?: string | null, icon: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[8px] font-bold uppercase tracking-widest text-[#8e8e8e] flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-medium text-[#2c2c2c]">{value || '—'}</p>
    </div>
  );
}

function TutorView({ 
  user, 
  profile, 
  studyLogs, 
  weakTopic,
  usageCount,
  onRefreshUsage
}: { 
  user: User | null, 
  profile: Profile | null,
  studyLogs: StudyLog[],
  weakTopic: string | null,
  usageCount: number,
  onRefreshUsage: () => void
}) {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: `Konnichiwa! I'm your AI Sensei. ${profile ? `I see you're studying for ${profile.target_level}. ` : ''}How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceLang, setVoiceLang] = useState<'ja-JP' | 'en-US'>('ja-JP');
  const [sessionTranscript, setSessionTranscript] = useState('');
  const [baseInput, setBaseInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = voiceLang;

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setSessionTranscript(prev => {
          // This is tricky with continuous. The event results contain the whole session.
          // Let's rebuild the session transcript from the event results.
          let fullSession = '';
          for (let i = 0; i < event.results.length; ++i) {
            fullSession += event.results[i][0].transcript;
          }
          return fullSession;
        });
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError("Microphone access denied. Please check browser permissions and ensure you've allowed microphone access for this site.");
          setTimeout(() => setVoiceError(null), 8000);
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      recognitionRef.current?.stop();
    };
  }, [voiceLang]);

  // Sync session transcript to input
  useEffect(() => {
    if (isListening) {
      setInput(baseInput + (baseInput && sessionTranscript ? ' ' : '') + sessionTranscript);
    }
  }, [sessionTranscript, isListening, baseInput]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      setBaseInput(input);
      setSessionTranscript('');
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (e) {
        console.error('Failed to start recognition:', e);
      }
    }
  };

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Auto-scroll to latest message
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (overrideMsg?: string) => {
    const userMsg = overrideMsg || input;
    if (!userMsg.trim() || isLoading) return;

    if (!overrideMsg) setInput('');
    if (userMsg.trim() && user) {
      logStudentPerformance(user.id, 'AI Chat', true, { type: 'chat', query: userMsg });
    }
    
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    const response = await chatWithTutor(
      userMsg, 
      messages, 
      studyLogs, 
      user?.id, 
      profile?.target_level || 'N5',
      weakTopic
    );
    setMessages(prev => [...prev, { role: 'model', text: response || "I'm sorry, I couldn't process that." }]);
    setIsLoading(false);
    onRefreshUsage();
  };

  const startPractice = () => {
    let prompt = "Sensei, please generate a personalized practice scenario for me.";
    
    if (weakTopic) {
      prompt = `Sensei, I've been struggling with "${weakTopic}". Please generate a personalized practice scenario focusing on this topic.`;
    }
    
    handleSend(prompt);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto h-[calc(100vh-180px)] flex flex-col pt-8 px-6"
    >
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 brand-gradient rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-brand/20">
            志
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight leading-none">AI Sensei</h2>
            <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Online & Ready</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UsageBadge count={usageCount} />
          <button 
            onClick={startPractice}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 glass text-brand-light rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <Sparkles size={14} />
            Practice Mode
          </button>
        </div>
      </div>

      <div className="flex-1 glass-card p-0 overflow-hidden flex flex-col relative">
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "items-start")}
            >
              <div className={cn(
                "px-6 py-4 rounded-[24px] text-sm font-medium leading-relaxed shadow-sm",
                msg.role === 'user' 
                  ? "bg-brand text-white rounded-tr-none shadow-brand/20" 
                  : "glass text-white rounded-tl-none"
              )}>
                <div className="markdown-body">
                  <Markdown>{msg.text}</Markdown>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2 px-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                  {msg.role === 'user' ? 'You' : 'Sensei'}
                </span>
                {msg.role === 'model' && (
                  <button 
                    onClick={() => speak(msg.text)}
                    className="text-white/20 hover:text-brand-light transition-colors"
                  >
                    <Volume2 size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-3 text-white/40 font-bold text-xs animate-pulse">
              <Sparkles size={14} className="animate-spin" />
              Sensei is thinking...
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        <div className="p-6 glass border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask Sensei anything..."
                className="w-full glass border border-white/10 rounded-2xl px-6 py-4 text-sm focus:border-brand/50 outline-none transition-all pr-24"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="flex items-center gap-0.5 glass p-0.5 rounded-lg mr-1">
                  <button 
                    onClick={() => setVoiceLang('ja-JP')}
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all",
                      voiceLang === 'ja-JP' ? "bg-brand text-white" : "text-white/40"
                    )}
                  >
                    JA
                  </button>
                  <button 
                    onClick={() => setVoiceLang('en-US')}
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-[8px] font-black transition-all",
                      voiceLang === 'en-US' ? "bg-brand text-white" : "text-white/40"
                    )}
                  >
                    EN
                  </button>
                </div>
                <button
                  onClick={toggleListening}
                  className={cn(
                    "p-2 rounded-xl transition-all",
                    isListening ? "bg-red-500 text-white animate-pulse" : "text-white/20 hover:text-white"
                  )}
                >
                  {isListening ? <Mic size={18} /> : <MicOff size={18} />}
                </button>
              </div>
            </div>
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20 disabled:opacity-50 active:scale-95 transition-all"
            >
              <ArrowUpRight size={24} />
            </button>
          </div>
          {voiceError && (
            <p className="text-[10px] text-red-400 mt-2 font-black uppercase tracking-widest">{voiceError}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function ReviewView({ user }: { user: User | null }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('srs_data')
        .select('*')
        .eq('user_id', user.id)
        .lte('next_review', new Date().toISOString());
      setReviews(data || []);
      setIsLoading(false);
    };
    fetchReviews();
  }, [user]);

  const speak = (text: string, lang: string = 'ja-JP') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 px-6 pt-8"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-black tracking-tight text-white">Daily Review <span className="text-white/20">(SRS)</span></h2>
        <div className="px-4 py-1.5 glass text-brand-light rounded-full text-xs font-black uppercase tracking-widest border border-brand/20">
          {reviews.length} Items Due
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 text-center italic text-white/40">Loading your reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-6">
          <div className="w-20 h-20 glass text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
            <CheckCircle size={40} />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-white">All caught up!</h3>
            <p className="text-white/60 font-medium">No items due for review right now. Great job!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((item, idx) => (
            <div key={idx} className="glass-card p-6 flex justify-between items-center group hover:border-brand/30 transition-all">
              <div>
                <h4 className="japanese-text text-2xl font-black text-white mb-1">{item.topic_tag}</h4>
                <p className="text-xs text-white/40 font-black uppercase tracking-widest">Next Review: {new Date(item.next_review).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => speak(item.topic_tag)}
                  className="w-12 h-12 glass text-brand-light rounded-xl flex items-center justify-center hover:bg-white/5 transition-all border border-white/10"
                >
                  <Volume2 size={20} />
                </button>
                <button className="w-12 h-12 brand-gradient text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all shadow-lg shadow-brand/20">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
