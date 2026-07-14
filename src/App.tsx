import React, { useState, useEffect, useCallback, useRef } from 'react';
import { User, Challenge, CheckIn, Verification, SystemLog, UserChallenge } from './types';

export interface LeaderboardEntry {
  id: string;
  username: string;
  total_xp: number;
}
import { Cpu, LogOut } from 'lucide-react';
import EBLogo from './components/BetzLogo';
import PhoneEmulator from './components/PhoneEmulator';
import SandboxCockpit from './components/SandboxCockpit';

export default function App() {
  // Global React States
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    email: string;
    total_xp: number;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [feed, setFeed] = useState<(CheckIn & { votes: Verification[] })[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [dbState, setDbState] = useState<{
    users: User[];
    challenges: Challenge[];
    user_challenges: UserChallenge[];
    check_ins: CheckIn[];
    verifications: Verification[];
  }>({
    users: [],
    challenges: [],
    user_challenges: [],
    check_ins: [],
    verifications: []
  });

  const currentUserIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    currentUserIdRef.current = currentUser?.id || null;
  }, [currentUser?.id]);

  // Local storage initialization
  useEffect(() => {
    const savedUser = localStorage.getItem('betz_user');
    const savedToken = localStorage.getItem('betz_token');
    const explicitlyLoggedOut = localStorage.getItem('betz_logged_out') === 'true';

    if (savedUser && savedToken) {
      setCurrentUser(JSON.parse(savedUser));
      setToken(savedToken);
    } else if (!explicitlyLoggedOut) {
      // Default auto-login as first researcher (Yannick) to lower entrance friction on very first land
      const defaultMockUser = {
        id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
        username: 'yannick',
        email: 'yannick@gmail.com',
        total_xp: 450
      };
      setCurrentUser(defaultMockUser);
      setToken(`mock-jwt-token-for-${defaultMockUser.id}`);
      localStorage.setItem('betz_user', JSON.stringify(defaultMockUser));
      localStorage.setItem('betz_token', `mock-jwt-token-for-${defaultMockUser.id}`);
    }
  }, []);

  // Fetch active user's specialized enrollments
  const fetchUserEnrollments = useCallback(async () => {
    const userId = currentUserIdRef.current;
    if (!userId) {
      setUserChallenges([]);
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}/challenges`);
      if (res.ok) {
        const data = await res.json();
        setUserChallenges(data);
      }
    } catch (e) {
      console.error('Error fetching user challenges', e);
    }
  }, []);

  // Fetch functions
  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch generic feed
      const feedRes = await fetch('/api/feed');
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setFeed(feedData);
      }

      // 2. Fetch challenges
      const chalRes = await fetch('/api/challenges');
      if (chalRes.ok) {
        const chalData = await chalRes.json();
        setChallenges(chalData);
      }

      // 3. Fetch leaderboards
      const leadRes = await fetch('/api/leaderboard');
      if (leadRes.ok) {
        const leadData = await leadRes.json();
        setLeaderboard(leadData);
      }

      // 4. Fetch system logs
      const logRes = await fetch('/api/system/logs');
      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData);
      }

      // 5. Fetch full database schemas state
      const stateRes = await fetch('/api/system/state');
      if (stateRes.ok) {
        const stateData = await stateRes.json();
        setDbState(stateData);

        // Update active logged in user's state from fresh database values
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          const freshUser = stateData.users.find((u: User) => u.id === prevUser.id);
          if (freshUser) {
            const updated = {
              id: freshUser.id,
              username: freshUser.username,
              email: freshUser.email,
              total_xp: freshUser.total_xp
            };
            // Safely guard against stale async closures after logout
            if (localStorage.getItem('betz_user')) {
              localStorage.setItem('betz_user', JSON.stringify(updated));
            }
            return updated;
          }
          return prevUser;
        });
      }
      
      // Update enrollments concurrently if logged in
      if (currentUserIdRef.current) {
        await fetchUserEnrollments();
      }
    } catch (e) {
      console.error('Error polling background systems', e);
    }
  }, [fetchUserEnrollments]);

  // Pull triggers periodically
  useEffect(() => {
    fetchData();
    // Using a more reasonable polling interval (3 seconds) to reduce backend pressure
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Auth Handlers
  const handleRegister = async (form: Record<string, any>) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    localStorage.removeItem('betz_logged_out');
    setCurrentUser(data.user);
    setToken(data.token);
    localStorage.setItem('betz_user', JSON.stringify(data.user));
    localStorage.setItem('betz_token', data.token);
    fetchData();
  };

  const handleLogin = async (form: Record<string, any>) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login checkout rejected');
    }
    localStorage.removeItem('betz_logged_out');
    setCurrentUser(data.user);
    setToken(data.token);
    localStorage.setItem('betz_user', JSON.stringify(data.user));
    localStorage.setItem('betz_token', data.token);
    fetchData();
  };

  const handleLogout = () => {
    localStorage.setItem('betz_logged_out', 'true');
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('betz_user');
    localStorage.removeItem('betz_token');
  };

  // Sandbox Switch Client identity
  const handleQuickSwitchUser = async (username: string) => {
    try {
      // TODO: DEV ONLY - Remove hardcoded impersonation password in production
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail: username, password: '123456' })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem('betz_logged_out');
        setCurrentUser(data.user);
        setToken(data.token);
        localStorage.setItem('betz_user', JSON.stringify(data.user));
        localStorage.setItem('betz_token', data.token);
      }
    } catch (e) {
      console.error('Switch failed', e);
    }
  };

  // Challenge joins
  const handleJoinChallenge = async (challengeId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/challenges/${challengeId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({})
      });
      if (res.ok) {
        await fetchData();
        await fetchUserEnrollments();
      } else {
        const err = await res.json();
        alert(err.error || 'Join error');
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Challenge creations
  const handleCreateChallenge = async (form: Record<string, any>) => {
    if (!token) return;
    const res = await fetch('/api/challenges', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Deployment error');
    }
    await fetchData();
    await fetchUserEnrollments();
  };

  // Checkin creations
  const handleSubmitCheckin = async (challengeId: string, form: Record<string, any>) => {
    if (!token) return;
    const res = await fetch(`/api/challenges/${challengeId}/checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token
      },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Check-In transmission rejected');
    }
    await fetchData();
    await fetchUserEnrollments();
  };

  // Voting actions
  const handleCastVote = async (checkInId: string, voteType: 'APPROVE' | 'DISPUTED') => {
    if (!token) return;
    try {
      const res = await fetch(`/api/checkins/${checkInId}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ vote: voteType })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Vote registration error');
      } else {
        await fetchData();
        await fetchUserEnrollments();
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  // Sandbox action triggers
  const handleTriggerClockReset = async () => {
    try {
      const res = await fetch('/api/system/reset-engine', { method: 'POST' });
      if (res.ok) {
        await fetchData();
        await fetchUserEnrollments();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResetSandbox = async () => {
    if (confirm('Re-seed Sandbox database back to pristine Yannick, Ryan & Nathanaël defaults?')) {
      try {
        const res = await fetch('/api/system/reset-sandbox', { method: 'POST' });
        if (res.ok) {
          await fetchData();
          await fetchUserEnrollments();
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleClearLogs = async () => {
    try {
      await fetch('/api/system/clear-logs', { method: 'POST' });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div 
      className="text-slate-100 min-h-screen font-sans antialiased flex flex-col justify-between relative bg-slate-950 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: 'url("/wallpaper.jpg")' }}
    >
      {/* Semi-transparent dark overlay for elegant contrast and glassmorphism support */}
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs pointer-events-none z-0" />
      
      {/* Sandbox Top Branded Masthead */}
      <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-md border-b border-indigo-500/20 shadow-lg z-10 text-white relative">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-600 rounded-xl shadow-md flex items-center justify-center">
                <EBLogo className="w-5 h-5 text-white" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-white leading-none">BETZ</h1>
                  <span className="text-[11px] bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-2.5 py-0.5 rounded font-mono font-medium">
                    Gamified Social Challenge App
                  </span>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-widest mt-1">Team: Yannick Sookree • Ryan Adams Bundhoo • Nathanaël Perraud • Alexandre Francois</p>
              </div>
            </div>
          </div>

          {/* Academic and project details */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 p-2 bg-slate-900/60 backdrop-blur-sm rounded-xl border border-indigo-500/20 text-right md:-mr-2 font-mono text-[11px] text-slate-300">
            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-800 border border-indigo-500/30 shadow-md px-3 py-1 rounded-xl text-left">
                <div className="h-6 w-6 bg-indigo-600 rounded-full text-white font-bold flex items-center justify-center text-[10px] uppercase font-sans shrink-0 ring-2 ring-indigo-100">
                  {currentUser.username[0].toUpperCase()}
                </div>
                <div className="leading-none shrink-0">
                  <span className="text-slate-400 block text-[7px] uppercase tracking-wider font-extrabold">Active</span>
                  <span className="text-indigo-400 font-bold font-sans text-[11px]">@{currentUser.username}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 rounded-lg text-indigo-300 hover:text-indigo-200 text-[10px] font-sans font-bold cursor-pointer transition-all flex items-center gap-1 shadow-sm"
                >
                  <LogOut className="w-3 h-3 text-indigo-400" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main landing page with Phone simulator and Sandbox cockpit side-by-side */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 py-6 md:py-8 flex flex-col lg:flex-row gap-8 items-start justify-center relative z-10">
        {/* Left hand side: Phone Emulator */}
        <div className="flex-shrink-0 mx-auto lg:sticky lg:top-4">
          <PhoneEmulator
            currentUser={currentUser}
            challenges={challenges}
            feed={feed}
            userChallenges={userChallenges}
            leaderboard={leaderboard}
            onRegister={handleRegister}
            onLogin={handleLogin}
            onJoinChallenge={handleJoinChallenge}
            onCreateChallenge={handleCreateChallenge}
            onSubmitCheckin={handleSubmitCheckin}
            onCastVote={handleCastVote}
            onLogout={handleLogout}
          />
        </div>

        {/* Right hand side: Developer Sandbox Dashboard */}
        <div className="flex-1 w-full min-w-0">
          <SandboxCockpit
            logs={logs}
            dbState={dbState}
            onTriggerClockReset={handleTriggerClockReset}
            onResetSandbox={handleResetSandbox}
            onClearLogs={handleClearLogs}
            onUserSelected={handleQuickSwitchUser}
            activeUsername={currentUser?.username || ''}
          />
        </div>
      </main>

      {/* Footer Bar */}
      <footer className="h-10 bg-slate-950/90 text-slate-400 text-[10px] flex items-center px-8 justify-between mt-auto relative z-10 border-t border-slate-900">
        <div className="flex gap-4">
          <span>© 2026 BETZ</span>
          <span className="opacity-50 font-mono">v2.4.0-stable</span>
        </div>
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> API GATEWAY: ONLINE</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> DB CLUSTER: SYNCED</span>
        </div>
      </footer>

    </div>
  );
}
