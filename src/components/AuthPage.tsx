import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  KeyRound, 
  UserPlus, 
  ShieldCheck, 
  Sparkles, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Users, 
  Trophy, 
  Coins,
  Volume2,
  VolumeX
} from 'lucide-react';
import BetzLogo from './BetzLogo';

interface AuthPageProps {
  onLogin: (form: any) => Promise<void>;
  onRegister: (form: any) => Promise<void>;
}

export default function AuthPage({ onLogin, onRegister }: AuthPageProps) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');
  const [videoMuted, setVideoMuted] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Forms states
  const [signInForm, setSignInForm] = useState({
    usernameOrEmail: '',
    password: '',
  });

  const [signUpForm, setSignUpForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInForm.usernameOrEmail || !signInForm.password) {
      setErrorMsg('Please populate all credential fields.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await onLogin({
        usernameOrEmail: signInForm.usernameOrEmail.trim(),
        password: signInForm.password,
      });
      setSuccessMsg('Successfully authenticated! Initializing ledger...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login credentials rejected. Try "123456" as password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    
    // Validation
    if (!signUpForm.username || !signUpForm.email || !signUpForm.password) {
      setErrorMsg('All registration fields are required.');
      return;
    }

    if (signUpForm.username.length < 3) {
      setErrorMsg('Username must be at least 3 characters.');
      return;
    }

    if (!signUpForm.email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    if (signUpForm.password.length < 6) {
      setErrorMsg('Security key must be at least 6 characters.');
      return;
    }

    if (signUpForm.password !== signUpForm.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await onRegister({
        username: signUpForm.username.trim().toLowerCase(),
        email: signUpForm.email.trim().toLowerCase(),
        password: signUpForm.password,
      });
      setSuccessMsg('Profile registered successfully! Logging you in...');
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Username or email might be taken.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to quickly log in with team credentials
  const handleQuickDemoLogin = async (username: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await onLogin({
        usernameOrEmail: username,
        password: '123456',
      });
      setSuccessMsg(`Welcome back, @${username}! Synchronizing project state...`);
    } catch (err: any) {
      setErrorMsg(`Demo login failed for @${username}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-page-root" className="min-h-[580px] bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 max-w-5xl w-full mx-auto">
      
      {/* Column 1: Informative / Value Proposition (Left Panel) */}
      <div className="lg:col-span-5 bg-slate-950 p-8 flex flex-col justify-between text-slate-200 relative overflow-hidden">
        {/* Full-screen looping background campaign video */}
        <video 
          src="https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crossfit-training-with-ropes-40033-large.mp4"
          autoPlay 
          muted={videoMuted} 
          loop 
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-[0.25] hover:opacity-[0.38] transition-opacity duration-1000 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/85 via-slate-900/60 to-slate-950/90 pointer-events-none" />

        {/* Background ambient lighting */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-8">
          {/* Brand header */}
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/30 flex items-center justify-center">
                <BetzLogo className="w-5 h-5 text-white" />
              </span>
              <div>
                <span className="text-[10px] text-indigo-400 font-mono font-semibold tracking-wider block uppercase">Gamified Social Challenge App</span>
                <h2 className="text-base font-black tracking-tight text-white leading-none">Betz</h2>
              </div>
            </div>

            {/* Video sound controller toggle button */}
            <button
              onClick={() => setVideoMuted(!videoMuted)}
              className="p-1.5 px-2.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 flex items-center gap-1.5 transition-all cursor-pointer text-[9px] font-mono font-bold select-none shadow-md"
              title={videoMuted ? "Unmute campaign music" : "Mute video audio"}
            >
              {videoMuted ? (
                <>
                  <VolumeX className="w-3 h-3 text-indigo-400 animate-pulse" />
                  <span>UNMUTE AD</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3 h-3 text-emerald-400 animate-bounce" />
                  <span className="text-emerald-400">SOUND ON</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold tracking-tight text-white">Stake. Verify. Repeat.</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              BETZ is a peer-to-peer verification engine designed to lock in healthy routines. 
              Stake XP tokens, log check-in proof, and participate in peer-voting. Slashing guarantees discipline.
            </p>
          </div>

          {/* Value points */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3 items-start">
              <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/15 mt-0.5">
                <Coins className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-sans">Stake XP Pools</h4>
                <p className="text-[11px] text-slate-400">Put your reputation and XP on the line to lock in daily routines.</p>
              </div>
            </div>
            
            <div className="flex gap-3 items-start">
              <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/15 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-sans">Peer Verification Log</h4>
                <p className="text-[11px] text-slate-400">Upload real-time logs and verify friends' progress via double-blind voting.</p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <div className="p-1.5 bg-amber-500/10 rounded-lg text-amber-400 border border-amber-500/15 mt-0.5">
                <Trophy className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-200 font-sans">Autonomous Warning Alarms</h4>
                <p className="text-[11px] text-slate-400">Receive persistent siren alarms 1 hour before stakes launch so you never fail.</p>
              </div>
            </div>
          </div>

          {/* Live App Advertisement Video Banner */}
          <div id="app-promo-banner" className="bg-slate-950/40 border border-slate-800/60 rounded-2xl p-3.5 relative overflow-hidden shadow-inner">
            <span className="absolute top-2 right-2 z-10 bg-indigo-600 text-white font-mono text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-full uppercase">
              Promo Video
            </span>
            <div className="flex gap-3.5 items-center">
              {/* Vertical Video mockup frame */}
              <div className="w-16 h-28 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800/80 flex-shrink-0 shadow-lg flex items-center justify-center">
                <video 
                  src="https://assets.mixkit.co/videos/preview/mixkit-woman-doing-crossfit-training-with-ropes-40033-large.mp4"
                  autoPlay 
                  muted 
                  loop 
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                />
                {/* Simulated vertical video overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-1.5 left-1 right-1 text-[7px] text-white font-black tracking-tighter leading-none text-center uppercase font-mono">
                  DAY 10/31
                </div>
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <span className="text-[9px] text-indigo-400 font-mono font-bold uppercase tracking-wider block">SHOWING UP DAILY</span>
                <h4 className="text-xs font-black text-white truncate">Battle Ropes</h4>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Our battle ropes training campaign representing verified discipline.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-[9px] text-indigo-300 font-mono">
                  <span className="bg-indigo-900/40 px-1 py-0.5 rounded border border-indigo-500/20">Staked: 500 XP</span>
                  <span className="text-emerald-400 font-bold">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project details / footer */}
        <div className="relative pt-8 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>PROJECT CHARTER v2.4</span>
          <span className="text-indigo-400/80 font-bold uppercase">C27/C28 SECURE</span>
        </div>
      </div>

      {/* Column 2: Form Controls (Right Panel) */}
      <div className="lg:col-span-7 p-8 flex flex-col justify-center bg-slate-50/50">
        
        {/* Toggle tabs */}
        <div className="bg-slate-200/60 p-1 rounded-2xl flex gap-1 mb-6 max-w-sm w-full mx-auto">
          <button
            onClick={() => {
              setActiveTab('signin');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signin' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
            Sign In
          </button>
          <button
            onClick={() => {
              setActiveTab('signup');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'signup' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-indigo-500" />
            Create Account
          </button>
        </div>

        <div className="max-w-md w-full mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'signin' ? (
              <motion.div
                key="signin-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="text-center lg:text-left mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Welcome Back to BETZ</h3>
                  <p className="text-xs text-slate-500">Log in to check your active stakes and audit logs.</p>
                </div>

                <form onSubmit={handleSignInSubmit} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Username or Email</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm placeholder-slate-400 transition-all"
                      placeholder="e.g. yannick"
                      value={signInForm.usernameOrEmail}
                      onChange={e => setSignInForm({ ...signInForm, usernameOrEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400">Security Key</label>
                      <span className="text-[10px] text-slate-400 font-mono">Sandbox default: 123456</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="w-full bg-white border border-slate-200 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
                        placeholder="••••••••"
                        value={signInForm.password}
                        onChange={e => setSignInForm({ ...signInForm, password: e.target.value })}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-600 text-xs flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-600 text-xs flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white rounded-xl py-2.5 text-xs font-bold shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-5"
                  >
                    {loading ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        Access
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="signup-panel"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="text-center lg:text-left mb-2">
                  <h3 className="text-lg font-bold text-slate-900">Create Staker Profile</h3>
                  <p className="text-xs text-slate-500">Register a new profile to start committing accountability stakes.</p>
                </div>

                <form onSubmit={handleSignUpSubmit} className="space-y-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Staker Username</label>
                    <input
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm placeholder-slate-400 transition-all"
                      placeholder="e.g. ryan_adams"
                      value={signUpForm.username}
                      onChange={e => setSignUpForm({ ...signUpForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Email Address</label>
                    <input
                      type="email"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm placeholder-slate-400 transition-all"
                      placeholder="e.g. ryan@gmail.com"
                      value={signUpForm.email}
                      onChange={e => setSignUpForm({ ...signUpForm, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Password</label>
                      <input
                        type="password"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
                        placeholder="••••••••"
                        value={signUpForm.password}
                        onChange={e => setSignUpForm({ ...signUpForm, password: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">Confirm</label>
                      <input
                        type="password"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-indigo-500 shadow-sm transition-all"
                        placeholder="••••••••"
                        value={signUpForm.confirmPassword}
                        onChange={e => setSignUpForm({ ...signUpForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl text-rose-600 text-xs flex gap-2 items-start">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-600 text-xs flex gap-2 items-start">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{successMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-55 text-white rounded-xl py-2.5 text-xs font-bold shadow-md shadow-indigo-600/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                  >
                    {loading ? (
                      <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Create and Enter Workspace
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick-select team demo login section */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Team Demo Quick-Login (1-Click)</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('yannick')}
                className="bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-slate-700 py-2 rounded-xl text-[10px] font-mono font-bold text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                @yannick
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('ryan')}
                className="bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-slate-700 py-2 rounded-xl text-[10px] font-mono font-bold text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                @ryan
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('nathanael')}
                className="bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 text-slate-700 py-2 rounded-xl text-[10px] font-mono font-bold text-center transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                @nathanael
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
