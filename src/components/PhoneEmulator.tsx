import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, CheckCircle, Clock, Trophy, Award, LogIn, LogOut, 
  Check, X, ShieldCheck, PlusCircle, Activity, Calendar, UserPlus, 
  ChevronRight, Send, User, Target, Layers, Search,
  Bell, AlertTriangle, Volume2, VolumeX, Info
} from 'lucide-react';
import BetzLogo from './BetzLogo';
import { Challenge, CheckIn, Verification } from '../types';

// Synthesize sound effects using Web Audio API to bypass asset dependency
const playAlarmSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc1 = audioCtx.createOscillator();
    const osc2 = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'sine';
    
    osc1.frequency.setValueAtTime(320, audioCtx.currentTime);
    osc2.frequency.setValueAtTime(480, audioCtx.currentTime);
    
    osc1.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.5);
    osc2.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.5);
    
    // Increased gain to make it robustly audible
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.6);
    
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc1.start();
    osc2.start();
    osc1.stop(audioCtx.currentTime + 0.6);
    osc2.stop(audioCtx.currentTime + 0.6);
  } catch (err) {
    console.warn('Audio Context blocked or unsupported:', err);
  }
};

const playReminderSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
    
    // Increased gain for audibility
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (err) {
    console.warn('Audio Context blocked or unsupported:', err);
  }
};

const playWarningSound = () => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    const now = audioCtx.currentTime;
    
    // First high beep - using triangle waves for richer harmonics and loudness
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.35, now); // Increased gain from 0.06 to 0.35
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);
    
    // Second higher beep (staggered slightly for dual tone/chime warning effect)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880.00, now + 0.15); // A5
    gain2.gain.setValueAtTime(0.35, now + 0.15); // Increased gain from 0.06 to 0.35
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (err) {
    console.warn('Audio Context blocked or unsupported:', err);
  }
};

interface PhoneEmulatorProps {
  currentUser: {
    id: string;
    username: string;
    email: string;
    total_xp: number;
  } | null;
  challenges: Challenge[];
  feed: (CheckIn & { votes: Verification[] })[];
  userChallenges: any[];
  leaderboard: any[];
  onRegister: (form: any) => Promise<void>;
  onLogin: (form: any) => Promise<void>;
  onJoinChallenge: (challengeId: string) => Promise<void>;
  onCreateChallenge: (form: any) => Promise<void>;
  onSubmitCheckin: (challengeId: string, form: any) => Promise<void>;
  onCastVote: (checkInId: string, voteType: 'APPROVE' | 'DISPUTED') => Promise<void>;
  onLogout: () => void;
}

export default function PhoneEmulator({
  currentUser,
  challenges,
  feed,
  userChallenges,
  leaderboard,
  onRegister,
  onLogin,
  onJoinChallenge,
  onCreateChallenge,
  onSubmitCheckin,
  onCastVote,
  onLogout
}: PhoneEmulatorProps) {
  // Mobile UI screens: 'FEED', 'DISCOVER', 'CREATE', 'LEADERBOARD', 'PROFILE', 'AUTH_LOGIN', 'AUTH_REGISTER'
  const [activeTab, setActiveTab] = useState<'FEED' | 'DISCOVER' | 'CREATE' | 'LEADERBOARD' | 'PROFILE'>('FEED');
  const [feedVideoMuted, setFeedVideoMuted] = useState(true);
  const [discoverVideoMuted, setDiscoverVideoMuted] = useState(true);
  
  // Alarms and Warning States
  const [showAlarmsDrawer, setShowAlarmsDrawer] = useState(false);
  const [activeBanner, setActiveBanner] = useState<{ id?: string; type: 'REMINDER' | 'LOST' | 'STARTING'; title: string; msg: string } | null>(null);
  const [alarms, setAlarms] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [dismissedAlarms, setDismissedAlarms] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('betz_dismissed_alarms');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dismissAlarm = (alarmId: string) => {
    setDismissedAlarms(prev => {
      const next = [...prev, alarmId];
      try {
        localStorage.setItem('betz_dismissed_alarms', JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Ticking currentTime interval to evaluate alarms automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 5000); // Check every 5 seconds for robust automatic alarms
    return () => clearInterval(timer);
  }, []);

  // Toast Notifications States
  const [toasts, setToasts] = useState<any[]>([]);
  const [knownChallengeIds, setKnownChallengeIds] = useState<string[]>([]);
  const [knownUserChallengeIds, setKnownUserChallengeIds] = useState<string[]>([]);
  const [isToastInitialized, setIsToastInitialized] = useState(false);

  // Reset tracking on user switch
  useEffect(() => {
    setIsToastInitialized(false);
    setKnownChallengeIds([]);
    setKnownUserChallengeIds([]);
    setDismissedAlarms([]);
    try {
      localStorage.removeItem('betz_dismissed_alarms');
    } catch (e) {}
  }, [currentUser?.id]);

  // Track new challenges and user enrollment notifications
  useEffect(() => {
    if (!currentUser) return;

    if (!isToastInitialized) {
      if (challenges.length > 0 || userChallenges.length > 0) {
        setKnownChallengeIds(challenges.map(c => c.id));
        setKnownUserChallengeIds(userChallenges.map(uc => uc.id));
        setIsToastInitialized(true);
      }
      return;
    }

    // 1. Check for new global challenges
    const newGlobal = challenges.filter(c => !knownChallengeIds.includes(c.id));
    if (newGlobal.length > 0) {
      const addedToasts = newGlobal.map(c => ({
        id: `global-${c.id}-${Date.now()}`,
        type: 'global_challenge',
        title: '📢 New Challenge Broadcasted!',
        message: `"${c.title}" is now active in the Lobby! Tap to view/stake.`,
        linkToTab: 'DISCOVER' as const
      }));
      setToasts(prev => [...prev, ...addedToasts]);
      playReminderSound();
      setKnownChallengeIds(challenges.map(c => c.id));
    }

    // 2. Check for new enrolled challenges for the user
    const newUserChal = userChallenges.filter(uc => !knownUserChallengeIds.includes(uc.id));
    if (newUserChal.length > 0) {
      const addedToasts = newUserChal.map(uc => {
        const chalTitle = uc.challenge?.title || 'Habit Staking';
        return {
          id: `enrolled-${uc.id}-${Date.now()}`,
          type: 'enrolled_challenge',
          title: '🏆 New Challenge Assigned!',
          message: `You got enrolled in "${chalTitle}"! Tap to open check-in feed.`,
          linkToTab: 'FEED' as const
        };
      });
      setToasts(prev => [...prev, ...addedToasts]);
      playAlarmSound();
      setKnownUserChallengeIds(userChallenges.map(uc => uc.id));
    }
  }, [challenges, userChallenges, isToastInitialized, currentUser, knownChallengeIds, knownUserChallengeIds]);

  // Auto-remove toasts after 8 seconds
  useEffect(() => {
    if (toasts.length > 0) {
      const timer = setTimeout(() => {
        setToasts(prev => prev.slice(1));
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [toasts]);

  // Generate real-time alarms from user enrollment states
  useEffect(() => {
    if (!currentUser) {
      setAlarms([]);
      return;
    }

    const newAlarms: any[] = [];

    userChallenges.forEach(uc => {
      const chalTitle = uc.challenge?.title || 'Habit Staking';
      if (uc.status === 'FAILED') {
        newAlarms.push({
          id: `fail-${uc.id}`,
          type: 'LOST',
          title: 'CHALLENGE LOST! 💀',
          message: `You failed to complete daily check-ins for "${chalTitle}". Staked XP was slashed.`,
          timestamp: uc.enrolled_at,
          severity: 'high'
        });
      } else if (uc.status === 'ACTIVE') {
        newAlarms.push({
          id: `remind-${uc.id}`,
          type: 'REMINDER',
          title: 'CHALLENGE PENDING! ⏰',
          message: `Do not forget to log daily proof for "${chalTitle}" to avoid losing stakes!`,
          timestamp: new Date().toISOString(),
          severity: 'medium'
        });
      }
    });

    // Check if any registry challenge starts in less than 1 hour (65 minutes)
    challenges.forEach(chal => {
      if (chal.start_time) {
        const startMs = new Date(chal.start_time).getTime();
        const nowMs = currentTime;
        const diffMs = startMs - nowMs;
        const diffMins = diffMs / (60 * 1000);

        if (diffMins > 0 && diffMins <= 65) {
          const formattedMins = Math.round(diffMins);
          newAlarms.push({
            id: `start-soon-${chal.id}`,
            type: 'STARTING',
            title: 'STARTING SOON! ⏰',
            message: `⚠️ ALARM: "${chal.title}" is starting in exactly ${formattedMins} minutes! Get ready to perform your tasks.`,
            timestamp: chal.start_time,
            severity: 'medium'
          });
        }
      }
    });

    setAlarms(newAlarms);
  }, [userChallenges, challenges, currentUser, currentTime]);

  // Automatically trigger sound and full-screen overlay when a new starting-soon warning alarm is active
  useEffect(() => {
    const startingAlarms = alarms.filter(a => a.type === 'STARTING' && !dismissedAlarms.includes(a.id));
    if (startingAlarms.length > 0) {
      const activeAlarm = startingAlarms[0];
      if (!activeBanner || activeBanner.id !== activeAlarm.id) {
        setActiveBanner({
          id: activeAlarm.id,
          type: 'STARTING',
          title: activeAlarm.title,
          msg: activeAlarm.message
        });
      }
    } else {
      if (activeBanner?.type === 'STARTING') {
        setActiveBanner(null);
      }
    }
  }, [alarms, dismissedAlarms, activeBanner]);

  // Continuous loop trigger when the starting warning overlay is active (Continuous Ringtone)
  useEffect(() => {
    if (activeBanner?.type !== 'STARTING') return;

    let audioCtx: AudioContext | null = null;
    let intervalId: any = null;

    try {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      let toggle = false;
      const playTone = () => {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
          audioCtx.resume().catch(() => {});
        }
        const now = audioCtx.currentTime;
        
        // Setup two oscillators for a rich, dual-tone alarm ringtone
        const o1 = audioCtx.createOscillator();
        const o2 = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        
        o1.type = 'sine';
        o2.type = 'triangle';
        
        // Alternating high/low siren notes to sound like an urgent alarm ringtone
        const freq = toggle ? 587.33 : 880.00; // Alternates D5 / A5
        toggle = !toggle;
        
        o1.frequency.setValueAtTime(freq, now);
        o2.frequency.setValueAtTime(freq * 1.5, now); // Perfect fifth harmony for depth
        
        g.gain.setValueAtTime(0.0, now);
        g.gain.linearRampToValueAtTime(0.32, now + 0.05); // Increased gain from 0.06 to 0.32 for clear audibility
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        
        o1.connect(g);
        o2.connect(g);
        g.connect(audioCtx.destination);
        
        o1.start(now);
        o2.start(now);
        o1.stop(now + 0.5);
        o2.stop(now + 0.5);
      };

      // Play immediately
      playTone();
      // Repeat rapidly (every 600ms) for a continuous, urgent, rhythmic alarm sound!
      intervalId = setInterval(playTone, 600);

    } catch (e) {
      console.warn('Continuous ringtone audio error:', e);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (audioCtx) {
        audioCtx.close().catch(() => {});
      }
    };
  }, [activeBanner]);
  
  // Auth state inputs
  const [loginForm, setLoginForm] = useState({ usernameOrEmail: '', password: '123456' });
  const [registerForm, setRegisterForm] = useState({ username: '', email: '', password: '123456' });
  const [authError, setAuthError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Challenge detail state
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  
  // Submit check-in state
  const [submittingCheckinFor, setSubmittingCheckinFor] = useState<Challenge | null>(null);
  const [checkinForm, setCheckinForm] = useState({ text_proof: '', imageUrl: '' });
  const [checkinError, setCheckinError] = useState('');

  // Create challenge state
  const [newChalForm, setNewChalForm] = useState({
    title: '',
    description: '',
    category: 'Fitness',
    reward_xp: 150,
    duration_days: 7,
    starts_in_hours: 1
  });
  const [createSuccess, setCreateSuccess] = useState(false);
  const [createError, setCreateError] = useState('');

  // AI Research Challenger States
  const [createMode, setCreateMode] = useState<'MANUAL' | 'RESEARCH'>('MANUAL');
  const [researchTopic, setResearchTopic] = useState('');
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState('');
  const [researchSuccess, setResearchSuccess] = useState<{ challenge: any, challenger: any, bio: string } | null>(null);

  const handleResearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!researchTopic.trim()) return;
    setResearchLoading(true);
    setResearchError('');
    setResearchSuccess(null);
    try {
      const res = await fetch('/api/system/research-challenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: researchTopic.trim(),
          userId: currentUser?.id
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to research topic');
      }
      const data = await res.json();
      setResearchSuccess(data);
      setResearchTopic('');
      playReminderSound();
      
      // Auto redirect back to Discover after showing details
      setTimeout(() => {
        setResearchSuccess(null);
        setActiveTab('DISCOVER');
      }, 5000);
    } catch (err: any) {
      setResearchError(err.message || 'System error compiling AI research');
    } finally {
      setResearchLoading(false);
    }
  };

  // Handle Auth actions
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await onLogin(loginForm);
    } catch (err: any) {
      setAuthError(err.message || 'Login credentials incorrect');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await onRegister(registerForm);
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed');
    }
  };

  // Submit check-in action
  const handleCheckInSubmitAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckinError('');
    if (!submittingCheckinFor) return;
    try {
      // Pick random aesthetic images according to category
      let image = checkinForm.imageUrl;
      if (!image) {
        if (submittingCheckinFor.category === 'Fitness') {
          image = 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400';
        } else if (submittingCheckinFor.category === 'Coding') {
          image = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400';
        } else {
          image = 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400';
        }
      }
      await onSubmitCheckin(submittingCheckinFor.id, {
        text_proof: checkinForm.text_proof,
        imageUrl: image
      });
      setSubmittingCheckinFor(null);
      setCheckinForm({ text_proof: '', imageUrl: '' });
      setActiveTab('FEED');
    } catch (err: any) {
      setCheckinError(err.message || 'Transmission failed');
    }
  };

  // Submit custom Challenge creation
  const handleChallengeCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess(false);
    try {
      await onCreateChallenge(newChalForm);
      setCreateSuccess(true);
      setNewChalForm({
        title: '',
        description: '',
        category: 'Fitness',
        reward_xp: 150,
        duration_days: 7,
        starts_in_hours: 1
      });
      setTimeout(() => {
        setCreateSuccess(false);
        setActiveTab('DISCOVER');
      }, 1500);
    } catch (err: any) {
      setCreateError(err.message || 'Failed to deploy challenge');
    }
  };

  return (
    <div className="w-full max-w-[1000px] h-[900px] bg-[#0F172A] rounded-2xl border border-slate-800 shadow-2xl relative flex flex-col overflow-hidden select-none">
      
      {/* Floating In-App Toast Notifications Overlay Stack */}
      <div className="absolute top-[64px] left-4 right-4 z-50 pointer-events-none space-y-3">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              onClick={() => {
                if (toast.linkToTab) {
                  setActiveTab(toast.linkToTab);
                }
                setToasts(prev => prev.filter(t => t.id !== toast.id));
              }}
              className="pointer-events-auto bg-slate-900/95 border border-indigo-500/30 backdrop-blur-md rounded-2xl p-4 shadow-xl shadow-slate-950/50 flex gap-3 cursor-pointer hover:bg-slate-850 transition-all group"
            >
              <div className="flex-shrink-0 flex items-center justify-center">
                {toast.type === 'enrolled_challenge' ? (
                  <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                    <Trophy className="w-4.5 h-4.5 animate-bounce" />
                  </div>
                ) : (
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400">
                    <Bell className="w-4.5 h-4.5 text-amber-400 animate-pulse" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-200 group-hover:text-white flex justify-between items-center font-mono">
                  <span>{toast.title}</span>
                  <span className="text-[10px] text-slate-500 font-normal">now</span>
                </div>
                <p className="text-xs text-slate-400 leading-snug mt-1 font-sans break-words pr-2">
                  {toast.message}
                </p>
                <div className="text-[10px] font-mono font-medium text-indigo-400 mt-1.5 flex items-center gap-0.5 group-hover:text-indigo-300">
                  <span>Tap to view</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setToasts(prev => prev.filter(t => t.id !== toast.id));
                }}
                className="flex-shrink-0 text-slate-500 hover:text-slate-300 self-start p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Screen Header / Status Bar */}
      <header className="pt-4.5 px-6 pb-2.5 bg-[#1E293B] border-b border-[#334155] flex justify-between items-center text-slate-300 font-mono text-sm z-20">
        <span className="font-semibold text-slate-100">09:41</span>
        <div className="flex items-center gap-3">
          {currentUser && (
            <button 
              onClick={() => {
                setShowAlarmsDrawer(!showAlarmsDrawer);
                if (alarms.some(a => a.type === 'STARTING')) {
                  playWarningSound();
                } else {
                  playReminderSound();
                }
              }}
              className="relative p-1.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 rounded-md transition-all flex items-center justify-center cursor-pointer"
              title="Alarms & Notifications"
            >
              <Bell className={`w-4 h-4 ${alarms.length > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              {alarms.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-[8px] w-3.5 h-3.5 font-bold flex items-center justify-center animate-pulse">
                  {alarms.length}
                </span>
              )}
            </button>
          )}
          <span className="w-4 h-2.5 bg-[#10B981] rounded-sm inline-block"></span>
          <span className="text-xs font-bold text-emerald-400">5G</span>
          <BetzLogo className="w-4 h-4 text-amber-400 animate-pulse" />
        </div>
      </header>

      {/* Primary Simulator Screen Body */}
      <div className="flex-1 bg-[#0F172A] overflow-y-auto overflow-x-hidden p-6 pb-24 custom-scrollbar text-slate-100">
        
        {/* If user is not authenticated, show Auth Screens */}
        {!currentUser ? (
          <div className="py-12 flex flex-col justify-center min-h-[600px] max-w-md mx-auto">
            <div className="text-center mb-10">
              <div className="inline-flex p-4.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20 mb-4 animate-pulse">
                <BetzLogo className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tight text-white uppercase font-mono">Access betz app</h2>
              <p className="text-sm text-slate-400 mt-2 font-medium">Social habits staking & verification engine</p>
            </div>

            <AnimatePresence mode="wait">
              {!isRegistering ? (
                <motion.form 
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handleLoginSubmit} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400">Username or Email</label>
                    <input 
                      type="text"
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 font-medium shadow-sm"
                      placeholder="e.g. yannick"
                      value={loginForm.usernameOrEmail}
                      onChange={e => setLoginForm({...loginForm, usernameOrEmail: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400">Password</label>
                    <input 
                      type="password"
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                      value={loginForm.password}
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                      required
                    />
                    <span className="text-xs text-slate-500 mt-2 block font-mono">Default sandbox key: <strong className="text-amber-400">123456</strong></span>
                  </div>

                  {authError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                      {authError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogIn className="w-5 h-5" />
                    Enter Protocol
                  </button>

                  <div className="text-center pt-6 border-t border-slate-800/60">
                    <button 
                      type="button" 
                      onClick={() => { setIsRegistering(true); setAuthError(''); }}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-bold tracking-wide transition-colors"
                    >
                      Create new researcher ledger
                    </button>
                  </div>
                </motion.form>
              ) : (
                <motion.form 
                  key="register-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleRegisterSubmit} 
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400">Select Username</label>
                    <input 
                      type="text"
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 font-medium shadow-sm"
                      placeholder="e.g. nathanael"
                      value={registerForm.username}
                      onChange={e => setRegisterForm({...registerForm, username: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400">Email Address</label>
                    <input 
                      type="email"
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 font-medium shadow-sm"
                      placeholder="nath@gmail.com"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-widest font-bold text-slate-400">Password</label>
                    <input 
                      type="password"
                      className="w-full bg-[#1E293B] border border-slate-700 rounded-xl px-4 py-3.5 text-base text-white focus:outline-none focus:border-indigo-500 shadow-sm"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                      required
                    />
                  </div>

                  {authError && (
                    <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                      {authError}
                    </div>
                  )}

                  <button 
                    type="submit" 
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-4 text-sm font-bold uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-5 h-5" />
                    Register Credentials
                  </button>

                  <div className="text-center pt-6 border-t border-slate-800/60">
                    <button 
                      type="button" 
                      onClick={() => { setIsRegistering(false); setAuthError(''); }}
                      className="text-indigo-400 hover:text-indigo-300 text-sm font-bold tracking-wide transition-colors"
                    >
                      Login with existing profile
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div>
            
            {/* Logged in Welcome bar & quick profile stats */}
            <div className="flex justify-between items-center bg-[#1E293B] p-5 rounded-2xl mb-6 border border-slate-800 shadow-md">
              <div className="flex items-center gap-3.5">
                <span className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <User className="w-5 h-5" />
                </span>
                <div>
                  <span className="text-xs text-slate-400 block font-mono tracking-wider">ACTIVE OPERATOR</span>
                  <span className="text-base font-extrabold font-mono text-indigo-300">@{currentUser.username}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block font-mono font-bold tracking-wider">STAKED</span>
                <span className="text-lg font-black text-amber-400 flex items-center justify-end gap-1">
                  <Sparkles className="w-5 h-5 text-amber-400 fill-current" />
                  {currentUser.total_xp} XP
                </span>
              </div>
            </div>

            {/* TAB SCREENS */}
            <AnimatePresence mode="wait">
              
              {/* 1. FEED SCREEN */}
              {activeTab === 'FEED' && (
                <motion.div 
                  key="feed-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2.5">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider font-mono">Verification Feed</h3>
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full font-mono">{feed.length} checkins</span>
                  </div>

                  {/* ACTIVE LIVE TRAINING ADVERT VIDEO HERO CARD */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden relative shadow-lg group">
                    <div className="relative h-72 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                      <video 
                        id="feed-promo-video"
                        src="https://assets.mixkit.co/videos/preview/mixkit-developer-working-on-code-on-a-computer-screen-40484-large.mp4"
                        autoPlay 
                        muted={feedVideoMuted} 
                        loop 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                      
                      {/* Interactive live indicator */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-indigo-600/95 text-white font-mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase select-none shadow-md">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        FEATURED CAMPAIGN
                      </div>

                      {/* Sound Controller Button overlay on video */}
                      <button
                        type="button"
                        onClick={() => setFeedVideoMuted(!feedVideoMuted)}
                        className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-950/95 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80 flex items-center gap-1.5 shadow-lg cursor-pointer transition-all text-[10px] font-mono font-bold uppercase select-none z-10"
                        title={feedVideoMuted ? "Unmute coding ambient sound" : "Mute audio"}
                      >
                        {feedVideoMuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>UNMUTE</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            <span className="text-emerald-400">SOUND ON</span>
                          </>
                        )}
                      </button>

                      {/* Video Title Overlays */}
                      <div className="absolute bottom-5 left-5 right-5 text-left">
                        <span className="text-xs text-amber-400 font-mono font-extrabold uppercase tracking-widest block">DEVELOPER STAKING</span>
                        <h4 className="text-lg font-black text-white uppercase leading-tight mt-1">100 Days of Code Challenge</h4>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1.5">
                          Commit your daily GitHub hashes. Log clean code screenshot proof to satisfy our AI peer-review consensus ledger!
                        </p>
                      </div>
                    </div>
                  </div>

                  {feed.length === 0 ? (
                    <div className="text-center py-16 bg-[#1E293B]/40 rounded-2xl border border-dashed border-slate-800">
                      <p className="text-sm text-slate-500 font-mono">No checkpoint proofs logged on chain yet.</p>
                    </div>
                  ) : (
                    feed.map((post) => {
                      // Count votes
                      const approves = post.votes.filter(v => v.vote === 'APPROVE').length;
                      const disputes = post.votes.filter(v => v.vote === 'DISPUTED').length;
                      const userVoted = post.votes.find(v => v.voter_id === currentUser.id);

                      return (
                        <div key={post.id} className="bg-[#1E293B] rounded-2xl overflow-hidden border border-slate-800/80 hover:border-slate-700 transition-all shadow-lg">
                          
                          {/* Feed post header */}
                          <div className="p-4.5 pb-3 flex justify-between items-center bg-[#1E293B]/60 border-b border-slate-800/40">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                              <span className="text-sm font-bold font-mono">@{post.username}</span>
                            </div>
                            <span className="text-[10px] text-indigo-300 bg-indigo-950/80 px-2.5 py-1 rounded-md font-mono border border-indigo-900/40 uppercase font-bold tracking-wider">
                              {post.challenge_title.slice(0, 30)}{post.challenge_title.length > 30 ? '...' : ''}
                            </span>
                          </div>

                          {/* Image or Video proof if exists */}
                          {post.imageUrl && (
                            <div className="w-full h-72 relative bg-slate-950">
                              {post.imageUrl.toLowerCase().endsWith('.mp4') || post.imageUrl.toLowerCase().includes('video') ? (
                                <video 
                                  src={post.imageUrl} 
                                  autoPlay 
                                  muted 
                                  loop 
                                  playsInline
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <img 
                                  src={post.imageUrl} 
                                  alt="Checkpoint proof" 
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              )}
                              
                              {/* Status badge */}
                              <div className="absolute top-3.5 right-3.5">
                                {post.status === 'APPROVED' ? (
                                  <span className="flex items-center gap-1.5 bg-emerald-950/95 text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/30 shadow-lg">
                                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                                    VERIFIED
                                  </span>
                                ) : post.status === 'DISPUTED' ? (
                                  <span className="flex items-center gap-1.5 bg-rose-950/95 text-rose-400 text-xs font-bold px-3 py-1.5 rounded-full border border-rose-500/30 shadow-lg">
                                    <X className="w-4 h-4 text-rose-400" />
                                    DISPUTED
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1.5 bg-amber-950/95 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/30 shadow-lg">
                                    <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                                    PENDING ({approves}/2)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Proof content */}
                          <div className="p-4.5 space-y-4">
                            <p className="text-sm text-slate-200 leading-relaxed font-sans italic">
                              "{post.text_proof}"
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                              <div className="flex items-center gap-2 font-mono">
                                <span className="text-emerald-400 font-bold">✓ {approves} APPROVED</span>
                                <span className="text-slate-600">•</span>
                                <span className="text-rose-400 font-bold">✗ {disputes} DISPUTED</span>
                              </div>
                              <span className="text-xs font-mono opacity-80">
                                {new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* VOTING OPTIONS (Hide for self checkins) */}
                            {post.user_id === currentUser.id ? (
                              <div className="pt-2 text-center text-xs font-mono text-slate-500 bg-slate-900/40 py-2 rounded-xl border border-slate-800/40">
                                Your own submission
                              </div>
                            ) : (
                              <div className="pt-2 grid grid-cols-2 gap-3">
                                <button
                                  onClick={() => onCastVote(post.id, 'APPROVE')}
                                  disabled={userVoted?.vote === 'APPROVE'}
                                  className={`py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    userVoted?.vote === 'APPROVE'
                                      ? 'bg-emerald-950/40 text-emerald-500/60 border border-emerald-900/20'
                                      : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer'
                                  }`}
                                >
                                  <Check className="w-4 h-4" />
                                  Approve Proof
                                </button>
                                <button
                                  onClick={() => onCastVote(post.id, 'DISPUTED')}
                                  disabled={userVoted?.vote === 'DISPUTED'}
                                  className={`py-2 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all ${
                                    userVoted?.vote === 'DISPUTED'
                                      ? 'bg-rose-950/40 text-rose-500/60 border border-rose-900/20'
                                      : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer'
                                  }`}
                                >
                                  <X className="w-4 h-4" />
                                  Dispute Proof
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </motion.div>
              )}

              {/* 2. DISCOVER SCREEN */}
              {activeTab === 'DISCOVER' && (
                <motion.div 
                  key="discover-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2.5">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider font-mono">Challenge Registry</h3>
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full font-mono">{challenges.length} active</span>
                  </div>

                  {/* ACTIVE LIVE TRAINING ADVERT VIDEO HERO CARD - SECOND PAGE CAMPAIGN */}
                  <div className="bg-slate-950 border border-slate-800/80 rounded-2xl overflow-hidden relative shadow-lg group">
                    <div className="relative h-64 w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                      <video 
                        id="discover-promo-video"
                        src="https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crossfit-training-with-ropes-40033-large.mp4"
                        autoPlay 
                        muted={discoverVideoMuted} 
                        loop 
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-700"
                      />
                      {/* Gradient overlay for rich styling and text contrast */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />
                      
                      {/* Dynamic active target badge */}
                      <div className="absolute top-4 left-4 flex items-center gap-2 bg-indigo-600/95 text-white font-mono text-[10px] font-black tracking-widest px-3 py-1.5 rounded-lg uppercase select-none shadow-md">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        LIVE TARGET WORKOUT
                      </div>

                      {/* Sound Controller overlay */}
                      <button
                        type="button"
                        onClick={() => setDiscoverVideoMuted(!discoverVideoMuted)}
                        className="absolute top-4 right-4 p-2.5 rounded-xl bg-slate-950/95 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800/80 flex items-center gap-1.5 shadow-lg cursor-pointer transition-all text-[10px] font-mono font-bold uppercase select-none z-10"
                        title={discoverVideoMuted ? "Unmute campaign training music" : "Mute audio"}
                      >
                        {discoverVideoMuted ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                            <span>UNMUTE</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                            <span className="text-emerald-400 font-bold">SOUND ON</span>
                          </>
                        )}
                      </button>

                      {/* Training Info Overlay */}
                      <div className="absolute bottom-5 left-5 right-5 text-left">
                        <span className="text-xs text-amber-400 font-mono font-black uppercase tracking-widest block">DAY 10/31: SHOWING UP DAILY!</span>
                        <h4 className="text-base font-black text-white uppercase leading-tight mt-1">Relentless Crossfit Challenge</h4>
                        <p className="text-sm text-slate-300 leading-relaxed mt-1.5 font-sans">
                          Lock in your stakes below and execute your daily battle rope checkpoint.
                        </p>
                      </div>
                    </div>
                  </div>

                  {challenges.map((chal) => {
                    // Check if already enrolled in this
                    const isEnrolled = userChallenges.some(uc => uc.challenge_id === chal.id);
                    const enrollment = userChallenges.find(uc => uc.challenge_id === chal.id);

                    return (
                      <div 
                        key={chal.id} 
                        className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5.5 space-y-4 hover:border-indigo-500/50 transition-all cursor-pointer shadow-md"
                        onClick={() => setSelectedChallenge(selectedChallenge?.id === chal.id ? null : chal)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-900/50 px-3 py-1 rounded-md font-mono font-bold uppercase tracking-wider">
                              {chal.category}
                            </span>
                            <h4 className="text-base font-extrabold text-white mt-2.5">{chal.title}</h4>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-mono block tracking-wider">REWARD</span>
                            <span className="text-sm font-black text-amber-400 font-mono flex items-center justify-end gap-0.5">
                              +{chal.reward_xp} XP
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-300 leading-relaxed font-sans">
                          {chal.description}
                        </p>

                        <div className="flex justify-between items-center pt-3 border-t border-slate-800/50 text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-indigo-400" />
                            <span>{chal.duration_days} days limit</span>
                          </div>
                          <span className="text-indigo-300 font-bold">{chal.participants_count} locked in</span>
                        </div>

                        {/* Expandable Action drawer */}
                        {selectedChallenge?.id === chal.id && (
                          <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="pt-4 border-t border-slate-800/50 flex flex-col gap-3"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="text-xs font-mono text-slate-400">
                              Launched by: <span className="text-slate-200">@{chal.creator_username}</span>
                            </div>
                            
                            {isEnrolled ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-900/60 p-3 rounded-xl">
                                  <span>Enrollment Status:</span>
                                  <span className="text-emerald-400 font-bold">{enrollment?.status}</span>
                                </div>
                                <button
                                  onClick={() => { setSubmittingCheckinFor(chal); setCheckinForm({ text_proof: '', imageUrl: '' }); }}
                                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Check className="w-4 h-4" />
                                  Log Progress Check-in
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => onJoinChallenge(chal.id)}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-2.5 text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <Target className="w-4 h-4" />
                                Accept Bet (Stakes Staked)
                              </button>
                            )}
                          </motion.div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {/* 3. CREATE SCREEN */}
              {activeTab === 'CREATE' && (
                <motion.div 
                  key="create-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-1">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider font-mono">Deploy New Challenge</h3>
                    <div className="text-xs bg-indigo-500/10 text-indigo-300 font-mono px-3 py-1 rounded-full border border-indigo-500/20">
                      BETZ Lab
                    </div>
                  </div>

                  {/* Mode Toggle Selector */}
                  <div className="flex bg-[#1E293B] p-1.5 rounded-2xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setCreateMode('MANUAL')}
                      className={`flex-1 text-center py-2.5 text-xs font-mono font-bold rounded-xl transition-all cursor-pointer ${
                        createMode === 'MANUAL'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Manual Setup
                    </button>
                    <button
                      type="button"
                      onClick={() => setCreateMode('RESEARCH')}
                      className={`flex-1 text-center py-2.5 text-xs font-mono font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        createMode === 'RESEARCH'
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 text-amber-300 animate-pulse" />
                      Find Friend Lab
                    </button>
                  </div>
                  
                  {createMode === 'RESEARCH' ? (
                    <div className="space-y-4">
                      {researchSuccess ? (
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-emerald-950/40 border border-emerald-500/20 p-6 rounded-2xl space-y-4.5 text-center"
                        >
                          <div className="inline-flex p-4.5 bg-emerald-500/10 rounded-full text-emerald-400 mb-1">
                            <CheckCircle className="w-10 h-10 animate-bounce" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-emerald-300 font-mono">Matched Successfully!</h4>
                            <p className="text-xs text-emerald-400/80 mt-1">Staking contract created with your new friend.</p>
                          </div>

                          <div className="bg-slate-900/60 p-4.5 rounded-xl border border-emerald-500/10 text-left space-y-2.5">
                            <div className="text-sm font-bold text-white font-mono flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                              <span>{researchSuccess.challenge.title}</span>
                            </div>
                            <p className="text-xs text-slate-300">{researchSuccess.challenge.description}</p>
                            <div className="flex gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                              <span>Reward: <strong className="text-amber-400">{researchSuccess.challenge.reward_xp} XP</strong></span>
                              <span>•</span>
                              <span>Duration: <strong className="text-slate-200">{researchSuccess.challenge.duration_days} Days</strong></span>
                            </div>
                          </div>

                          <div className="bg-slate-900/40 p-4.5 rounded-xl border border-indigo-500/10 text-left">
                            <div className="text-[11px] uppercase font-mono tracking-wider text-indigo-400 font-bold mb-1">Accountability Friend</div>
                            <div className="text-sm font-bold text-slate-200 font-mono">@{researchSuccess.challenger.username}</div>
                            <p className="text-xs text-slate-400 italic mt-0.5">"{researchSuccess.bio}"</p>
                          </div>

                          <div className="text-xs text-slate-500 font-mono animate-pulse">
                            Returning to Lobby in 5 seconds...
                          </div>
                        </motion.div>
                      ) : (
                        <form onSubmit={handleResearchSubmit} className="space-y-5 bg-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-md">
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-indigo-300 font-mono flex items-center gap-2">
                              <UserPlus className="w-5 h-5 text-amber-400" />
                              Match with a New Friend
                            </h4>
                            <p className="text-xs text-slate-400 leading-relaxed">
                              Enter any interest, habit, or goal (e.g. "Morning jogging", "Swift coding", "Cold exposure"). Our matchmaking system will research and find a new accountability friend who shares this focus, design a custom staking contract, and instantly enroll you both!
                            </p>
                          </div>

                          <div className="space-y-2.5">
                            <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400">Find Friend</label>
                            <div className="relative">
                              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                              <input 
                                type="text"
                                className="w-full bg-[#0F172A] border border-slate-700 rounded-full pl-10 pr-28 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 font-mono"
                                placeholder="e.g. cold plunge or morning yoga"
                                value={researchTopic}
                                onChange={e => setResearchTopic(e.target.value)}
                                maxLength={40}
                                required
                                disabled={researchLoading}
                              />
                              <button
                                type="submit"
                                disabled={researchLoading || !researchTopic.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-[11px] font-mono font-bold rounded-full transition-all cursor-pointer"
                              >
                                {researchLoading ? 'Searching...' : 'Search'}
                              </button>
                            </div>
                          </div>

                          {researchError && (
                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                              {researchError}
                            </div>
                          )}

                          <button
                            type="submit"
                            disabled={researchLoading || !researchTopic.trim()}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl py-3.5 text-sm font-mono font-bold shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {researchLoading ? (
                              <>
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                                Finding Friend & Contract...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4.5 h-4.5 text-amber-300 animate-pulse" />
                                Find Friend & Start Challenge
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleChallengeCreateSubmit} className="space-y-5 bg-[#1E293B] p-6 rounded-2xl border border-slate-800 shadow-md">
                      <div>
                        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Challenge Title</label>
                        <input 
                          type="text"
                          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                          placeholder="e.g. Daily LeetCode Challenge"
                          value={newChalForm.title}
                          onChange={e => setNewChalForm({...newChalForm, title: e.target.value})}
                          maxLength={50}
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Staking Description</label>
                        <textarea 
                          className="w-full h-24 bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none"
                          placeholder="Detail exactly what researchers must log to prove completion."
                          value={newChalForm.description}
                          onChange={e => setNewChalForm({...newChalForm, description: e.target.value})}
                          maxLength={180}
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Category</label>
                          <select
                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                            value={newChalForm.category}
                            onChange={e => setNewChalForm({...newChalForm, category: e.target.value})}
                          >
                            <option value="Fitness">Fitness</option>
                            <option value="Coding">Coding</option>
                            <option value="Research">Research</option>
                            <option value="Nutrition">Nutrition</option>
                            <option value="Mental">Mental</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Staked Reward</label>
                          <select
                            className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                            value={newChalForm.reward_xp}
                            onChange={e => setNewChalForm({...newChalForm, reward_xp: Number(e.target.value)})}
                          >
                            <option value={100}>100 XP</option>
                            <option value={150}>150 XP</option>
                            <option value={200}>200 XP</option>
                            <option value={300}>300 XP</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Duration Days</label>
                        <select
                          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                          value={newChalForm.duration_days}
                          onChange={e => setNewChalForm({...newChalForm, duration_days: Number(e.target.value)})}
                        >
                          <option value={3}>3 Days Stakes</option>
                          <option value={5}>5 Days Stakes</option>
                          <option value={7}>7 Days Stakes</option>
                          <option value={10}>10 Days Stakes</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs uppercase tracking-wider font-semibold text-slate-400 mb-2">Starts In</label>
                        <select
                          className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                          value={newChalForm.starts_in_hours}
                          onChange={e => setNewChalForm({...newChalForm, starts_in_hours: Number(e.target.value)})}
                        >
                          <option value={1}>1 Hour (Triggers Warning Alarm)</option>
                          <option value={2}>2 Hours</option>
                          <option value={12}>12 Hours</option>
                          <option value={24}>24 Hours</option>
                          <option value={0}>Starts Immediately</option>
                        </select>
                      </div>

                      {createError && (
                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-mono">
                          {createError}
                        </div>
                      )}

                      {createSuccess && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-mono">
                          Challenge broadcasted!
                        </div>
                      )}

                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3.5 text-sm font-mono font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-4.5 h-4.5" />
                        Commit Staking Ledger
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* 4. LEADERBOARD SCREEN */}
              {activeTab === 'LEADERBOARD' && (
                <motion.div 
                  key="leaderboard-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2.5">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider font-mono">Researcher Leaderboard</h3>
                    <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full font-mono">Ranked by Staked XP</span>
                  </div>

                  <div className="bg-[#1E293B] rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60 shadow-md">
                    {leaderboard.map((user, idx) => {
                      const isSelf = user.id === currentUser.id;
                      return (
                        <div 
                          key={user.id} 
                          className={`p-4.5 flex justify-between items-center transition-all ${
                            isSelf ? 'bg-indigo-600/10' : 'hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <span className={`w-8 h-8 rounded-lg text-sm font-bold font-mono flex items-center justify-center ${
                              idx === 0 ? 'bg-amber-500 text-slate-950 shadow shadow-amber-500/30' :
                              idx === 1 ? 'bg-slate-300 text-slate-950' :
                              idx === 2 ? 'bg-amber-700 text-white' :
                              'bg-slate-800 text-slate-400'
                            }`}>
                              {idx + 1}
                            </span>
                            <div>
                              <span className="text-sm font-bold font-mono block text-white">
                                @{user.username} {isSelf && <span className="text-[10px] text-indigo-400 font-semibold font-mono">(YOU)</span>}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block uppercase">
                                ID: {user.id.slice(0, 8)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <span className="text-sm font-black text-amber-400 font-mono flex items-center gap-1 justify-end">
                              <Sparkles className="w-4 h-4 text-amber-400 fill-current" />
                              {user.total_xp}
                            </span>
                            <span className="text-[10px] text-slate-500 block font-mono">XP LEDGERED</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* 5. PROFILE / MY WORK SCREEN */}
              {activeTab === 'PROFILE' && (
                <motion.div 
                  key="profile-screen"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between pb-2.5">
                    <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider font-mono">My Accountability Lock-Ins</h3>
                    <button 
                      onClick={onLogout}
                      className="text-xs text-slate-300 bg-slate-800 border border-slate-700 px-3.5 py-1.5 rounded-xl font-mono hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      Sign Out
                    </button>
                  </div>

                  {userChallenges.length === 0 ? (
                    <div className="text-center py-14 bg-[#1E293B]/40 rounded-2xl border border-dashed border-slate-800 space-y-4.5">
                      <p className="text-sm text-slate-500 font-mono">You aren't locked into any active stakes right now.</p>
                      <button
                        onClick={() => setActiveTab('DISCOVER')}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                      >
                        Find Stakes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4.5">
                      {userChallenges.map((uc) => {
                        const chal = uc.challenge;
                        if (!chal) return null;
                        
                        return (
                          <div key={uc.id} className="bg-[#1E293B] border border-slate-800 rounded-2xl p-5.5 space-y-4 shadow-md">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-2.5 py-1 rounded font-mono font-semibold uppercase">
                                  {chal.category}
                                </span>
                                <h4 className="text-base font-extrabold text-white mt-2.5">{chal.title}</h4>
                              </div>
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded ${
                                uc.status === 'COMPLETED' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-900' :
                                'bg-indigo-950/60 text-indigo-400 border border-indigo-900'
                              }`}>
                                {uc.status}
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                                <span>Check-Ins Accomplished</span>
                                <span className="text-white font-bold">{uc.progress} / {chal.duration_days} days</span>
                              </div>
                              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(100, (uc.progress / chal.duration_days) * 100)}%` }}
                                />
                              </div>
                            </div>

                            {/* Trigger checkin form */}
                            {uc.status === 'ACTIVE' && (
                              <button
                                onClick={() => { setSubmittingCheckinFor(chal); setCheckinForm({ text_proof: '', imageUrl: '' }); }}
                                className="w-full bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 rounded-xl py-2.5 text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                              >
                                <PlusCircle className="w-4.5 h-4.5" />
                                Post Check-In Proof
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}

            </AnimatePresence>

          </div>
        )}

      </div>

      {/* --- FLOATING SUBMIT CHECK-IN POPUP PANEL --- */}
      <AnimatePresence>
        {submittingCheckinFor && (
          <motion.div 
            initial={{ opacity: 0, y: 120 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 120 }}
            className="absolute bottom-0 inset-x-0 bg-[#1E293B] border-t border-slate-700 rounded-t-3xl p-5 space-y-4 z-40 text-slate-100 shadow-2xl"
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[9px] uppercase font-bold text-indigo-400 font-mono">SUBMITTING PROOF</span>
                <h4 className="text-xs font-bold text-white mt-0.5">{submittingCheckinFor.title}</h4>
              </div>
              <button 
                onClick={() => setSubmittingCheckinFor(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCheckInSubmitAction} className="space-y-3.5">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400 mb-1">Text Proof / Summary</label>
                <textarea 
                  className="w-full h-20 bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500 resize-none"
                  placeholder="Detail exactly what you did as proof (e.g., 'Jogged 5km in 24 mins. Checked heart rate.')"
                  value={checkinForm.text_proof}
                  onChange={e => setCheckinForm({...checkinForm, text_proof: e.target.value})}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] uppercase tracking-wider font-semibold text-slate-400">Custom Image or Video Proof URL (Optional)</label>
                  <button 
                    type="button"
                    onClick={() => setCheckinForm({
                      text_proof: "Completed Day 10/31 showing up daily standard ropes training. Absolutely crushed it!",
                      imageUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crossfit-training-with-ropes-40033-large.mp4"
                    })}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-bold underline font-mono cursor-pointer"
                  >
                    Prefill Battle Ropes Video Ad
                  </button>
                </div>
                <input 
                  type="url"
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-slate-500"
                  placeholder="Paste an image or vertical MP4 video URL"
                  value={checkinForm.imageUrl}
                  onChange={e => setCheckinForm({...checkinForm, imageUrl: e.target.value})}
                />
              </div>

              {checkinError && (
                <div className="p-2 bg-rose-500/15 border border-rose-500/20 rounded-lg text-rose-400 text-[10px] font-mono">
                  {checkinError}
                </div>
              )}

              <button 
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-xs font-mono font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                Broadcast Proof to Consensus
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING ALARMS & NOTIFICATION DRAWER --- */}
      <AnimatePresence>
        {showAlarmsDrawer && (
          <motion.div 
            initial={{ opacity: 0, y: -200 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -200 }}
            className="absolute top-[52px] inset-x-0 bg-[#1E293B] border-b border-slate-700 rounded-b-3xl p-5 space-y-4 z-40 text-slate-100 shadow-2xl max-h-[500px] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">Protocol Alarm Center</h4>
              </div>
              <button 
                onClick={() => setShowAlarmsDrawer(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Live Alarm Actions */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-2.5">
              <span className="text-[9px] uppercase font-bold text-slate-400 block font-mono">Simulate Edge States</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/system/simulate-reminder', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser?.id })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        playReminderSound();
                        setActiveBanner({
                          type: 'REMINDER',
                          title: '⏰ REMINDER ALARM TRIGGERED',
                          msg: `Outstanding checkpoint pending for active challenge. Do not forget to check in!`
                        });
                      } else {
                        alert(data.error || 'Simulation error');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-lg py-1.5 px-2 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Test Reminder
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/system/simulate-fail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser?.id })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        playAlarmSound();
                        setActiveBanner({
                          type: 'LOST',
                          title: '💀 CHALLENGE LOST ALARM',
                          msg: `Alarm: You missed your daily check-in. Staked XP slashed! You lost the challenge.`
                        });
                      } else {
                        alert(data.error || 'No active challenge found to fail.');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-lg py-1.5 px-2 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
                  Test Failure
                </button>

                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/system/simulate-start', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId: currentUser?.id })
                      });
                      const data = await res.json();
                      if (res.ok) {
                        playWarningSound();
                        setActiveBanner({
                          type: 'STARTING',
                          title: '⏰ UPCOMING CHALLENGE ALARM',
                          msg: `Alarm: An upcoming staking challenge starts in exactly 1 hour! Get ready to perform your logged activities.`
                        });
                      } else {
                        alert(data.error || 'Simulation error');
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="col-span-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg py-1.5 px-2 text-[10px] font-mono font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Bell className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
                  Test Challenge Start Alarm (1 Hour)
                </button>
              </div>
            </div>

            {/* Alarms Feed List */}
            <div className="space-y-3.5">
              <span className="text-[9px] uppercase font-bold text-indigo-400 block font-mono">Current Active Alarms ({alarms.length})</span>
              
              {alarms.length === 0 ? (
                <div className="text-center py-6 bg-slate-900/30 rounded-xl border border-dashed border-slate-800 text-slate-500 text-[10px] font-mono">
                  No active protocol warnings.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  {alarms.map((alarm) => (
                    <div 
                      key={alarm.id} 
                      className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${
                        alarm.type === 'LOST' 
                          ? 'bg-rose-950/40 border-rose-900 text-rose-100' 
                          : 'bg-amber-950/30 border-amber-900 text-amber-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono tracking-wide uppercase flex items-center gap-1">
                          {alarm.type === 'LOST' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 fill-current animate-pulse" />
                          ) : (
                            <Bell className="w-3.5 h-3.5 text-amber-400 fill-current" />
                          )}
                          {alarm.title}
                        </span>
                        <span className="text-[8px] opacity-60 font-mono">Active</span>
                      </div>
                      <p className="text-[10px] opacity-90 leading-normal">{alarm.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* --- DRAMATIC FULL SCREEN ALARM BANNER OVERLAY --- */}
      <AnimatePresence>
        {activeBanner && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-[#020617]/95 z-50 flex flex-col justify-center items-center p-6 text-center select-none"
          >
            {activeBanner.type === 'LOST' ? (
              <div className="space-y-6">
                <div className="inline-flex p-4 bg-rose-500/20 border border-rose-500 rounded-full animate-bounce">
                  <AlertTriangle className="w-12 h-12 text-rose-500 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-mono text-rose-500 tracking-wider">CHALLENGE LOST ALARM</h3>
                  <p className="text-xs text-rose-400 font-mono uppercase">consensus staking check-in missed</p>
                </div>
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl max-w-[280px]">
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {activeBanner.msg}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setActiveBanner(null)}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                  >
                    Acknowledge Slashed Penalty
                  </button>
                </div>
              </div>
            ) : activeBanner.type === 'STARTING' ? (
              <div className="space-y-6">
                <div className="inline-flex p-4 bg-indigo-500/20 border border-indigo-500 rounded-full animate-bounce">
                  <Bell className="w-12 h-12 text-indigo-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-mono text-indigo-400 tracking-wider">CHALLENGE START ALARM</h3>
                  <p className="text-xs text-indigo-400 font-mono uppercase">starting in 1 hour</p>
                </div>
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl max-w-[420px]">
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {activeBanner.msg}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      if (activeBanner.id) {
                        dismissAlarm(activeBanner.id);
                      }
                      setActiveBanner(null);
                    }}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 cursor-pointer flex items-center justify-center gap-1.5 mx-auto"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    Stop Alarm & Dismiss
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="inline-flex p-4 bg-amber-500/20 border border-amber-500 rounded-full animate-pulse">
                  <Bell className="w-12 h-12 text-amber-400 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black font-mono text-amber-400 tracking-wider">REMINDER WARNING</h3>
                  <p className="text-xs text-amber-400 font-mono uppercase">active stakes pending check-in</p>
                </div>
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl max-w-[420px]">
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">
                    {activeBanner.msg}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => setActiveBanner(null)}
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono text-xs font-bold rounded-xl transition-all shadow-lg shadow-amber-500/30 cursor-pointer"
                  >
                    Lock In Daily Proof Now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Bottom Tab Navigation Bar (Only if logged in) */}
      {currentUser && (
        <nav className="absolute bottom-0 inset-x-0 h-20 bg-[#1E293B] border-t border-[#334155] px-6 flex items-center justify-between z-30 shadow-2xl">
          
          <button 
            onClick={() => { setActiveTab('FEED'); setSelectedChallenge(null); setSubmittingCheckinFor(null); }}
            className={`flex flex-col items-center justify-center flex-1 transition-all cursor-pointer py-1.5 ${
              activeTab === 'FEED' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-mono tracking-wide uppercase">Feed</span>
          </button>

          <button 
            onClick={() => { setActiveTab('DISCOVER'); setSelectedChallenge(null); setSubmittingCheckinFor(null); }}
            className={`flex flex-col items-center justify-center flex-1 transition-all cursor-pointer py-1.5 ${
              activeTab === 'DISCOVER' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Target className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-mono tracking-wide uppercase">Stakes</span>
          </button>

          <button 
            onClick={() => { setActiveTab('CREATE'); setSelectedChallenge(null); setSubmittingCheckinFor(null); }}
            className={`flex flex-col items-center justify-center flex-1 transition-all cursor-pointer py-1.5 ${
              activeTab === 'CREATE' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusCircle className="w-6.5 h-6.5 text-indigo-500 hover:scale-110 active:scale-95 mb-1" />
            <span className="text-[10px] font-mono tracking-wide uppercase">Deploy</span>
          </button>

          <button 
            onClick={() => { setActiveTab('LEADERBOARD'); setSelectedChallenge(null); setSubmittingCheckinFor(null); }}
            className={`flex flex-col items-center justify-center flex-1 transition-all cursor-pointer py-1.5 ${
              activeTab === 'LEADERBOARD' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trophy className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-mono tracking-wide uppercase">Ranks</span>
          </button>

          <button 
            onClick={() => { setActiveTab('PROFILE'); setSelectedChallenge(null); setSubmittingCheckinFor(null); }}
            className={`flex flex-col items-center justify-center flex-1 transition-all cursor-pointer py-1.5 ${
              activeTab === 'PROFILE' ? 'text-indigo-400 font-bold scale-105' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5.5 h-5.5 mb-1" />
            <span className="text-[10px] font-mono tracking-wide uppercase">Mine</span>
          </button>

        </nav>
      )}

    </div>
  );
}
