import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Challenge, UserChallenge, CheckIn, Verification, SystemLog } from './types';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const usingSupabase = supabaseUrl.startsWith('https://') &&
  Boolean(supabaseKey) &&
  !supabaseKey.includes('<') &&
  !supabaseKey.includes('your-') &&
  !supabaseKey.includes('MY_');

const createEntityId = () => `mock-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;

class MockDatabaseEngine {
  private users: User[] = [];
  private challenges: Challenge[] = [];
  private userChallenges: (UserChallenge & { challenge?: Challenge })[] = [];
  private checkIns: CheckIn[] = [];
  private verifications: Verification[] = [];
  private logs: SystemLog[] = [];

  constructor() {
    console.warn('Using in-memory mock database engine because Supabase configuration is missing or invalid.');

    const defaultUser: User = {
      id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      username: 'yannick',
      email: 'yannick@gmail.com',
      total_xp: 450
    };

    const secondaryUser: User = {
      id: 'ry845fbf-4076-4767-8919-48227e7ca4b2', // align with server.ts mock users
      username: 'ryan',
      email: 'ryan@gmail.com',
      total_xp: 380
    };

    const tertiaryUser: User = {
      id: 'na945fbf-4076-4767-8919-48227e7ca4b3', // align with server.ts mock users
      username: 'nathanael',
      email: 'nath@gmail.com',
      total_xp: 420
    };

    this.users = [defaultUser, secondaryUser, tertiaryUser];

    this.challenges = [{
      id: 'chal-1',
      title: 'Daily 5AM Workout',
      description: 'Commit to waking up and checking in with a gym workout photo or log by 6:00 AM daily.',
      category: 'Fitness',
      creator_id: defaultUser.id,
      creator_username: defaultUser.username,
      reward_xp: 150,
      participants_count: 3,
      duration_days: 7,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-2',
      title: 'Clean Code: Express APIs',
      description: 'Refactor old endpoints to follow strict type safety and REST standard constraints.',
      category: 'Coding',
      creator_id: secondaryUser.id,
      creator_username: secondaryUser.username,
      reward_xp: 200,
      participants_count: 2,
      duration_days: 5,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-3',
      title: 'Morning Fog 5K Run',
      description: 'Complete a structured 5K outdoor run at dawn and share pacing telemetry screenshot proof.',
      category: 'Cardio',
      creator_id: tertiaryUser.id,
      creator_username: tertiaryUser.username,
      reward_xp: 180,
      participants_count: 3,
      duration_days: 10,
      created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-4',
      title: 'Pure Hydration & Nutrition',
      description: 'Drink at least 3.5 Liters of water and log a balanced organic green meal daily.',
      category: 'Nutrition',
      creator_id: defaultUser.id,
      creator_username: defaultUser.username,
      reward_xp: 120,
      participants_count: 3,
      duration_days: 14,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    }];

    this.userChallenges = [{
      id: 'uc-1',
      user_id: defaultUser.id,
      challenge_id: 'chal-1',
      enrolled_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 2,
      challenge: this.challenges[0]
    }, {
      id: 'uc-3',
      user_id: secondaryUser.id,
      challenge_id: 'chal-1',
      enrolled_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[0]
    }, {
      id: 'uc-4',
      user_id: secondaryUser.id,
      challenge_id: 'chal-2',
      enrolled_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[1]
    }, {
      id: 'uc-5',
      user_id: tertiaryUser.id,
      challenge_id: 'chal-3',
      enrolled_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 3,
      challenge: this.challenges[2]
    }, {
      id: 'uc-6',
      user_id: defaultUser.id,
      challenge_id: 'chal-4',
      enrolled_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[3]
    }];

    this.checkIns = [
      {
        id: 'ci-4',
        user_challenge_id: 'uc-6',
        challenge_id: 'chal-4',
        challenge_title: 'Pure Hydration & Nutrition',
        user_id: defaultUser.id,
        username: defaultUser.username,
        text_proof: 'Logged balanced meal. Avocado bowl with dark leafy greens and exact 3.8L hydration target achieved for today.',
        imageUrl: '/hydration_proof.jpg',
        created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'ci-3',
        user_challenge_id: 'uc-5',
        challenge_id: 'chal-3',
        challenge_title: 'Morning Fog 5K Run',
        user_id: tertiaryUser.id,
        username: tertiaryUser.username,
        text_proof: 'Woke up to foggy streets but crushed the 5K pacing run! Dynamic stride and full endurance locked in.',
        imageUrl: '/running_proof.jpg',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'ci-2',
        user_challenge_id: 'uc-4',
        challenge_id: 'chal-2',
        challenge_title: 'Clean Code: Express APIs',
        user_id: secondaryUser.id,
        username: secondaryUser.username,
        text_proof: 'All old endpoints refactored to follow strict type safety and REST standard constraints.',
        imageUrl: '/coding_proof.jpg',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        status: 'APPROVED'
      },
      {
        id: 'ci-1',
        user_challenge_id: 'uc-1',
        challenge_id: 'chal-1',
        challenge_title: 'Daily 5AM Workout',
        user_id: defaultUser.id,
        username: defaultUser.username,
        text_proof: 'Leg day completed. Felt great. Heavy deadlifts with loaded barbell verified.',
        imageUrl: '/workout_proof.jpg',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        status: 'APPROVED'
      }
    ];

    this.logs = [{
      id: 'log-01',
      action: 'SYSTEM_BOOT',
      timestamp: new Date().toISOString(),
      details: 'Mock database engine initialized for local development.'
    }];
  }

  private findUser(predicate: (user: User) => boolean) {
    return this.users.find(predicate) || null;
  }

  private ensureUserExists(userId: string) {
    const user = this.findUser((u) => u.id === userId);
    if (!user) throw new Error('User not found');
    return user;
  }

  private getChallengeById(challengeId: string) {
    const challenge = this.challenges.find((c) => c.id === challengeId);
    if (!challenge) throw new Error('Challenge not found');
    return challenge;
  }

  public async writeLog(action: string, details: string): Promise<void> {
    this.logs.unshift({
      id: createEntityId(),
      action,
      timestamp: new Date().toISOString(),
      details
    });
  }

  public async registerUser(username: string, email: string, passwordHash: string, bio?: string): Promise<User> {
    const formattedUsername = username.toLowerCase().trim();
    const formattedEmail = email.toLowerCase().trim();

    const existing = this.users.find((user) => user.username === formattedUsername || user.email === formattedEmail);
    if (existing) {
      throw new Error('Username or email already registered');
    }

    const newUser: User = {
      id: createEntityId(),
      username: formattedUsername,
      email: formattedEmail,
      total_xp: 100, // starting bonus
      ...(bio ? { bio } : {})
    };

    this.users.push(newUser);
    await this.writeLog('USER_REGISTERED', `New researcher registration completed: @${newUser.username} joined BETZ engine.`);
    return newUser;
  }

  public async loginUser(usernameOrEmail: string): Promise<User> {
    const searchStr = usernameOrEmail.toLowerCase().trim();
    const user = this.findUser((u) => u.username === searchStr || u.email === searchStr);
    if (!user) {
      throw new Error('Researcher profile not found in transaction registry.');
    }
    await this.writeLog('USER_LOGIN', `@${user.username} successfully authenticated session.`);
    return user;
  }

  public async getFeed(): Promise<(CheckIn & { votes: Verification[] })[]> {
    return this.checkIns.map((checkIn) => ({
      ...checkIn,
      votes: this.verifications.filter((v) => v.check_in_id === checkIn.id)
    }));
  }

  public async getChallenges(): Promise<Challenge[]> {
    return this.challenges;
  }

  public async createChallenge(
    title: string,
    description: string,
    category: string,
    reward_xp: number,
    duration_days: number,
    creatorId: string,
    creatorUsername: string,
    starts_in_hours: number = 1
  ): Promise<Challenge> {
    const startTimeDate = new Date(Date.now() + starts_in_hours * 3600 * 1000).toISOString();

    const challenge: Challenge = {
      id: createEntityId(),
      title,
      description,
      category,
      creator_id: creatorId,
      creator_username: creatorUsername,
      reward_xp,
      participants_count: 1,
      duration_days,
      created_at: new Date().toISOString(),
      start_time: startTimeDate
    };

    this.challenges.push(challenge);

    const enrollment = {
      id: createEntityId(),
      user_id: creatorId,
      challenge_id: challenge.id,
      enrolled_at: new Date().toISOString(),
      status: 'ACTIVE' as const,
      progress: 0,
      challenge
    };

    this.userChallenges.push(enrollment);
    await this.writeLog('CHALLENGE_CREATED', `Challenge "${challenge.title}" launched by @${creatorUsername}. Earn ${challenge.reward_xp} XP!`);
    return challenge;
  }

  public async getLeaderboard(): Promise<User[]> {
    return [...this.users].sort((a, b) => b.total_xp - a.total_xp);
  }

  public async getSystemLogs(): Promise<SystemLog[]> {
    return [...this.logs].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 100);
  }

  public async getSystemState() {
    return {
      users: [...this.users],
      challenges: [...this.challenges],
      user_challenges: [...this.userChallenges],
      check_ins: [...this.checkIns],
      verifications: [...this.verifications]
    };
  }

  public async getUserEnrollments(userId: string): Promise<any[]> {
    return this.userChallenges
      .filter((enrollment) => enrollment.user_id === userId)
      .map((enrollment) => {
        const challenge = this.challenges.find(c => c.id === enrollment.challenge_id);
        return {
          ...enrollment,
          challenge: challenge || null
        };
      });
  }

  public async joinChallenge(userId: string, username: string, challengeId: string): Promise<UserChallenge> {
    const existing = this.userChallenges.find((enrollment) => enrollment.user_id === userId && enrollment.challenge_id === challengeId);
    if (existing) {
      throw new Error('You are already locked into this challenge.');
    }

    const challenge = this.getChallengeById(challengeId);
    challenge.participants_count += 1;

    const enrollment = {
      id: createEntityId(),
      user_id: userId,
      challenge_id: challengeId,
      enrolled_at: new Date().toISOString(),
      status: 'ACTIVE' as const,
      progress: 0,
      challenge
    };

    this.userChallenges.push(enrollment);
    await this.writeLog('USER_ENROLLED', `@${username} joined the task group for "${challenge.title}".`);
    return enrollment;
  }

  public async submitCheckIn(
    userId: string,
    username: string,
    challengeId: string,
    text_proof: string,
    imageUrl?: string
  ): Promise<CheckIn> {
    const challenge = this.getChallengeById(challengeId);
    const enrollment = this.userChallenges.find((uc) => uc.user_id === userId && uc.challenge_id === challengeId);
    if (!enrollment) throw new Error('You must join the challenge before checking in.');

    const checkIn: CheckIn = {
      id: createEntityId(),
      user_challenge_id: enrollment.id,
      challenge_id: challengeId,
      challenge_title: challenge.title,
      user_id: userId,
      username,
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60',
      text_proof,
      created_at: new Date().toISOString(),
      status: 'PENDING'
    };

    this.checkIns.unshift(checkIn);
    await this.writeLog('Check-in submitted', `@${username} submitted daily proof for "${challenge.title}": "${text_proof.slice(0, 40)}..."`);
    return checkIn;
  }

  public async verifyCheckIn(checkInId: string, verifierId: string, voteType: 'APPROVE' | 'DISPUTED') {
    const checkIn = this.checkIns.find((ci) => ci.id === checkInId);
    if (!checkIn) throw new Error('Target Check-In not found');
    if (checkIn.user_id === verifierId) throw new Error('Anti-Cheat Constraint: Forbidden from voting on your own check-ins!');

    const existingVote = this.verifications.find((v) => v.check_in_id === checkInId && v.voter_id === verifierId);
    if (existingVote) throw new Error('You have already casted a verification vote for this submission.');

    const verifier = this.ensureUserExists(verifierId);
    this.verifications.push({
      id: createEntityId(),
      check_in_id: checkInId,
      voter_id: verifierId,
      voter_username: verifier.username,
      vote: voteType,
      created_at: new Date().toISOString()
    });

    const approves = this.verifications.filter((v) => v.check_in_id === checkInId && v.vote === 'APPROVE').length;
    const disputes = this.verifications.filter((v) => v.check_in_id === checkInId && v.vote === 'DISPUTED').length;

    let targetStatus = checkIn.status;
    if (voteType === 'DISPUTED') {
      targetStatus = 'DISPUTED';
    } else if (approves > disputes) {
      targetStatus = 'APPROVED';
    }

    checkIn.status = targetStatus;
    if (checkIn.status === 'APPROVED') {
      const owner = this.ensureUserExists(checkIn.user_id);
      owner.total_xp += 50;
    }
    verifier.total_xp += 10;
    return { success: true, status: targetStatus };
  }

  public async clearLogs(): Promise<void> {
    this.logs = [];
    await this.writeLog('INFO', 'System ledger logs flushed clean.');
  }

  public async getUserById(userId: string): Promise<User | null> {
    return this.findUser((user) => user.id === userId);
  }

  public async resetSandbox(): Promise<void> {
    this.users = [
      {
        id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
        username: 'yannick',
        email: 'yannick@gmail.com',
        total_xp: 450
      },
      {
        id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
        username: 'ryan',
        email: 'ryan@gmail.com',
        total_xp: 380
      },
      {
        id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
        username: 'nathanael',
        email: 'nath@gmail.com',
        total_xp: 420
      }
    ];

    this.challenges = [{
      id: 'chal-1',
      title: 'Daily 5AM Workout',
      description: 'Commit to waking up and checking in with a gym workout photo or log by 6:00 AM daily.',
      category: 'Fitness',
      creator_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      creator_username: 'yannick',
      reward_xp: 150,
      participants_count: 3,
      duration_days: 7,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-2',
      title: 'Clean Code: Express APIs',
      description: 'Refactor old endpoints to follow strict type safety and REST standard constraints.',
      category: 'Coding',
      creator_id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
      creator_username: 'ryan',
      reward_xp: 200,
      participants_count: 2,
      duration_days: 5,
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-3',
      title: 'Morning Fog 5K Run',
      description: 'Complete a structured 5K outdoor run at dawn and share pacing telemetry screenshot proof.',
      category: 'Cardio',
      creator_id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
      creator_username: 'nathanael',
      reward_xp: 180,
      participants_count: 3,
      duration_days: 10,
      created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'chal-4',
      title: 'Pure Hydration & Nutrition',
      description: 'Drink at least 3.5 Liters of water and log a balanced organic green meal daily.',
      category: 'Nutrition',
      creator_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      creator_username: 'yannick',
      reward_xp: 120,
      participants_count: 3,
      duration_days: 14,
      created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    }];

    this.userChallenges = [{
      id: 'uc-1',
      user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      challenge_id: 'chal-1',
      enrolled_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 2,
      challenge: this.challenges[0]
    }, {
      id: 'uc-3',
      user_id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
      challenge_id: 'chal-1',
      enrolled_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[0]
    }, {
      id: 'uc-4',
      user_id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
      challenge_id: 'chal-2',
      enrolled_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[1]
    }, {
      id: 'uc-5',
      user_id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
      challenge_id: 'chal-3',
      enrolled_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 3,
      challenge: this.challenges[2]
    }, {
      id: 'uc-6',
      user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      challenge_id: 'chal-4',
      enrolled_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      progress: 1,
      challenge: this.challenges[3]
    }];

    this.checkIns = [
      {
        id: 'ci-4',
        user_challenge_id: 'uc-6',
        challenge_id: 'chal-4',
        challenge_title: 'Pure Hydration & Nutrition',
        user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
        username: 'yannick',
        text_proof: 'Logged balanced meal. Avocado bowl with dark leafy greens and exact 3.8L hydration target achieved for today.',
        imageUrl: '/hydration_proof.jpg',
        created_at: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'ci-3',
        user_challenge_id: 'uc-5',
        challenge_id: 'chal-3',
        challenge_title: 'Morning Fog 5K Run',
        user_id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
        username: 'nathanael',
        text_proof: 'Woke up to foggy streets but crushed the 5K pacing run! Dynamic stride and full endurance locked in.',
        imageUrl: '/running_proof.jpg',
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        status: 'PENDING'
      },
      {
        id: 'ci-2',
        user_challenge_id: 'uc-4',
        challenge_id: 'chal-2',
        challenge_title: 'Clean Code: Express APIs',
        user_id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
        username: 'ryan',
        text_proof: 'All old endpoints refactored to follow strict type safety and REST standard constraints.',
        imageUrl: '/coding_proof.jpg',
        created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        status: 'APPROVED'
      },
      {
        id: 'ci-1',
        user_challenge_id: 'uc-1',
        challenge_id: 'chal-1',
        challenge_title: 'Daily 5AM Workout',
        user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
        username: 'yannick',
        text_proof: 'Leg day completed. Felt great. Heavy deadlifts with loaded barbell verified.',
        imageUrl: '/workout_proof.jpg',
        created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        status: 'APPROVED'
      }
    ];

    this.verifications = [];
    this.logs = [{
      id: 'log-01',
      action: 'SEEDED_SANDBOX',
      timestamp: new Date().toISOString(),
      details: 'Pristine seed data restored.'
    }];
  }

  public async simulateFail(userId: string, userChallengeId?: string) {
    let uc = null;
    if (userChallengeId) {
      uc = this.userChallenges.find(u => u.id === userChallengeId && u.user_id === userId);
    } else {
      uc = this.userChallenges.find(u => u.user_id === userId && u.status === 'ACTIVE');
    }

    if (!uc) {
      throw new Error("No active challenge found to simulate failure.");
    }

    const chal = this.challenges.find(c => c.id === uc!.challenge_id);
    const user = this.users.find(u => u.id === userId);

    if (uc && chal && user) {
      uc.status = 'FAILED';
      const penalty = Math.min(user.total_xp, 100);
      user.total_xp -= penalty;
      
      await this.writeLog('CHALLENGE_FAILED', `💀 ALARM: @${user.username} lost the challenge "${chal.title}"! Failed to log daily check-in. -${penalty} Staked XP has been slashed!`);
      
      return { 
        success: true, 
        message: `Simulated failure for "${chal.title}".`,
        penalty
      };
    }
    throw new Error("Could not process simulation.");
  }

  public async simulateReminder(userId: string) {
    const uc = this.userChallenges.find(u => u.user_id === userId && u.status === 'ACTIVE');
    const user = this.users.find(u => u.id === userId);

    if (!uc) {
      throw new Error("No active challenge found to remind.");
    }

    const chal = this.challenges.find(c => c.id === uc.challenge_id);
    if (chal && user) {
      await this.writeLog('ALARM_REMINDER', `⏰ ALARM: @${user.username} has an outstanding checkpoint to complete for "${chal.title}"! Due in 2 hours.`);
      return {
        success: true,
        message: `Alarm reminder broadcasted for "${chal.title}".`,
        challengeTitle: chal.title
      };
    }
    throw new Error("Could not process reminder simulation.");
  }

  public async simulateStart(userId: string) {
    const user = this.users.find(u => u.id === userId);
    const chal = this.challenges[this.challenges.length - 1] || this.challenges[0];

    if (chal && user) {
      chal.start_time = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      await this.writeLog('ALARM_START_SOON', `⏰ UPCOMING ALARM: "${chal.title}" starts in 45 minutes! Challenger @${user.username}, make sure you are ready to log proof!`);
      return {
        success: true,
        message: `Starting soon alarm broadcasted for "${chal.title}".`,
        challengeTitle: chal.title
      };
    }
    throw new Error("Could not process starting simulation.");
  }

  public async addMatchedChallengerAndChallenge(challengerUser: User, newChallenge: Challenge, userId?: string) {
    this.users.push(challengerUser);
    this.challenges.push(newChallenge);

    this.userChallenges.push({
      id: 'uc-' + Math.random().toString(36).substring(2, 10),
      user_id: challengerUser.id,
      challenge_id: newChallenge.id,
      enrolled_at: new Date().toISOString(),
      status: 'ACTIVE',
      progress: 0,
      challenge: newChallenge
    });

    if (userId) {
      this.userChallenges.push({
        id: 'uc-' + Math.random().toString(36).substring(2, 10),
        user_id: userId,
        challenge_id: newChallenge.id,
        enrolled_at: new Date().toISOString(),
        status: 'ACTIVE',
        progress: 0,
        challenge: newChallenge
      });
    }

    await this.writeLog('FRIEND_RESEARCH_CHALLENGE', `Matchmaker created a new challenge: "${newChallenge.title}" with category ${newChallenge.category}.`);
    await this.writeLog('FRIEND_MATCHED', `New friend matched: @${challengerUser.username}!`);
    await this.writeLog('USER_ENROLLED', `@${challengerUser.username} and you joined the task group for "${newChallenge.title}".`);
  }
}

export class SupabaseEngine {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  // System Log Writer
  public async writeLog(action: string, details: string): Promise<void> {
    await this.supabase
      .from('logs')
      .insert([{ action, details }]);
  }

  // User Registration Example
  public async registerUser(username: string, email: string, passwordHash: string, bio?: string): Promise<User> {
    const formattedUsername = username.toLowerCase().trim();
    const formattedEmail = email.toLowerCase().trim();

    // Check Duplicate
    const { data: existingUser } = await this.supabase
      .from('users')
      .select('*')
      .or(`username.eq.${formattedUsername},email.eq.${formattedEmail}`)
      .maybeSingle();

    if (existingUser) {
      throw new Error('Username or email already registered');
    }

    // Insert User
    const { data: newUser, error } = await this.supabase
      .from('users')
      .insert([{
        username: formattedUsername,
        email: formattedEmail,
        password_hash: passwordHash,
        total_xp: 100, // starting bonus
        ...(bio ? { bio } : {})
      }])
      .select()
      .single();

    if (error) throw error;

    await this.writeLog('USER_REGISTERED', `New researcher registration completed: @${newUser.username} joined BETZ engine.`);
    return newUser as User;
  }

  // Voting Loop Check-In Verification
  public async verifyCheckIn(checkInId: string, verifierId: string, voteType: 'APPROVE' | 'DISPUTED') {
    // 1. Fetch current Check-In status
    const { data: checkIn, error: ciError } = await this.supabase
      .from('check_ins')
      .select('*')
      .eq('id', checkInId)
      .single();

    if (ciError || !checkIn) throw new Error('Target Check-In not found');
    if (checkIn.user_id === verifierId) {
      throw new Error('Anti-Cheat Constraint: Forbidden from voting on your own check-ins!');
    }

    // 2. Cast Verification Vote
    const voter = await this.getUserById(verifierId);
    const { error: voteError } = await this.supabase
      .from('verifications')
      .insert([{ 
        check_in_id: checkInId, 
        voter_id: verifierId, 
        voter_username: voter?.username || 'unknown',
        vote: voteType 
      }]);

    if (voteError && voteError.code === '23505') { // Postgres Unique Constraint violation code
      throw new Error('You have already casted a verification vote for this submission.');
    }

    // 3. Count Votes
    const { data: votes } = await this.supabase
      .from('verifications')
      .select('vote')
      .eq('check_in_id', checkInId);

    const approves = votes?.filter(v => v.vote === 'APPROVE').length || 0;
    const disputes = votes?.filter(v => v.vote === 'DISPUTED').length || 0;

    let targetStatus = checkIn.status;
    if (voteType === 'DISPUTED') {
      targetStatus = 'DISPUTED';
    } else if (approves > disputes) {
      targetStatus = 'APPROVED';
    }

    // Update Check-In Status
    await this.supabase.from('check_ins').update({ status: targetStatus }).eq('id', checkInId);

    // 4. Streak & XP Evaluation
    let streakIncremented = false;
    let xpAward = 0;

    if (checkIn.status !== 'APPROVED' && targetStatus === 'APPROVED') {
      // Award owner XP (+50 XP)
      const owner = await this.getUserById(checkIn.user_id);
      if (owner) {
        await this.supabase.from('users').update({ total_xp: owner.total_xp + 50 }).eq('id', checkIn.user_id);
      }
      streakIncremented = true;
      xpAward = 50;
    }

    // Award helper participating XP to the verifier (+10 XP)
    if (voter) {
      await this.supabase.from('users').update({ total_xp: voter.total_xp + 10 }).eq('id', verifierId);
    }

    return { success: true, status: targetStatus, streak_incremented: streakIncremented, awarded_xp: xpAward };
  }

  // --- NEW CRUD METHODS FOR FULL MIGRATION ---

  public async loginUser(usernameOrEmail: string): Promise<User> {
    const searchStr = usernameOrEmail.toLowerCase().trim();
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .or(`username.eq.${searchStr},email.eq.${searchStr}`)
      .maybeSingle();

    if (error || !data) {
      throw new Error('Researcher profile not found in transaction registry.');
    }
    await this.writeLog('USER_LOGIN', `@${data.username} successfully authenticated session.`);
    return data as User;
  }

  public async getFeed(): Promise<(CheckIn & { votes: Verification[] })[]> {
    const { data: checkIns, error: ciError } = await this.supabase
      .from('check_ins')
      .select('*')
      .order('created_at', { ascending: false });

    if (ciError) throw ciError;

    const { data: verifications, error: vError } = await this.supabase
      .from('verifications')
      .select('*');

    if (vError) throw vError;

    return checkIns.map(ci => ({
      ...ci,
      votes: verifications.filter(v => v.check_in_id === ci.id)
    }));
  }

  public async getChallenges(): Promise<Challenge[]> {
    const { data, error } = await this.supabase
      .from('challenges')
      .select('*');
    if (error) throw error;
    return data as Challenge[];
  }

  public async createChallenge(
    title: string,
    description: string,
    category: string,
    reward_xp: number,
    duration_days: number,
    creatorId: string,
    creatorUsername: string,
    starts_in_hours: number = 1
  ): Promise<Challenge> {
    const startTimeDate = new Date(Date.now() + starts_in_hours * 3600 * 1000).toISOString();

    const { data: challenge, error: chalError } = await this.supabase
      .from('challenges')
      .insert([{
        title,
        description,
        category,
        reward_xp,
        duration_days,
        creator_id: creatorId,
        creator_username: creatorUsername,
        start_time: startTimeDate,
        participants_count: 1
      }])
      .select()
      .single();

    if (chalError) throw chalError;

    const { error: enrollError } = await this.supabase
      .from('user_challenges')
      .insert([{
        user_id: creatorId,
        challenge_id: challenge.id,
        status: 'ACTIVE',
        progress: 0
      }]);

    if (enrollError) throw enrollError;

    await this.writeLog('CHALLENGE_CREATED', `"${challenge.title}" launched by @${creatorUsername}. Earn ${challenge.reward_xp} XP!`);
    return challenge as Challenge;
  }

  public async joinChallenge(userId: string, username: string, challengeId: string): Promise<UserChallenge> {
    // Check if already enrolled
    const { data: existing } = await this.supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (existing) {
      throw new Error('You are already locked into this challenge.');
    }

    const { data: enrollment, error } = await this.supabase
      .from('user_challenges')
      .insert([{
        user_id: userId,
        challenge_id: challengeId,
        status: 'ACTIVE',
        progress: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Increment participants_count
    const { data: chal } = await this.supabase.from('challenges').select('participants_count, title').eq('id', challengeId).single();
    if (chal) {
      await this.supabase.from('challenges').update({ participants_count: chal.participants_count + 1 }).eq('id', challengeId);
      await this.writeLog('USER_ENROLLED', `@${username} joined the task group for "${chal.title}".`);
    }

    return enrollment as UserChallenge;
  }

  public async getUserEnrollments(userId: string): Promise<UserChallenge[]> {
    const { data, error } = await this.supabase
      .from('user_challenges')
      .select('*, challenge:challenges(*)')
      .eq('user_id', userId);
      
    if (error) throw error;
    return data;
  }

  public async submitCheckIn(
    userId: string,
    username: string,
    challengeId: string,
    text_proof: string,
    imageUrl?: string
  ): Promise<CheckIn> {
    const { data: chal } = await this.supabase.from('challenges').select('title').eq('id', challengeId).single();
    if (!chal) throw new Error('Challenge not found');

    const { data: uc } = await this.supabase
      .from('user_challenges')
      .select('id')
      .eq('user_id', userId)
      .eq('challenge_id', challengeId)
      .maybeSingle();

    if (!uc) throw new Error('You must join the challenge before checking in.');

    const { data: checkIn, error } = await this.supabase
      .from('check_ins')
      .insert([{
        user_challenge_id: uc.id,
        challenge_id: challengeId,
        challenge_title: chal.title,
        user_id: userId,
        username: username,
        text_proof: text_proof,
        "imageUrl": imageUrl || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60',
        status: 'PENDING'
      }])
      .select()
      .single();

    if (error) throw error;

    await this.writeLog('Check-in submitted', `@${username} submitted daily proof for "${chal.title}": "${text_proof.slice(0, 40)}..."`);
    return checkIn as CheckIn;
  }

  public async getLeaderboard(): Promise<User[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .order('total_xp', { ascending: false });
    if (error) throw error;
    return data as User[];
  }

  public async getSystemLogs(): Promise<SystemLog[]> {
    const { data, error } = await this.supabase
      .from('logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);
    if (error) throw error;
    return data as SystemLog[];
  }

  public async getSystemState() {
    const [users, challenges, user_challenges, check_ins, verifications] = await Promise.all([
      this.supabase.from('users').select('*').order('created_at', { ascending: true }),
      this.supabase.from('challenges').select('*').order('created_at', { ascending: true }),
      this.supabase.from('user_challenges').select('*').order('enrolled_at', { ascending: true }),
      this.supabase.from('check_ins').select('*').order('created_at', { ascending: true }),
      this.supabase.from('verifications').select('*').order('created_at', { ascending: true })
    ]);

    return {
      users: users.data || [],
      challenges: challenges.data || [],
      user_challenges: user_challenges.data || [],
      check_ins: check_ins.data || [],
      verifications: verifications.data || []
    };
  }

  public async clearLogs(): Promise<void> {
    await this.supabase.from('logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.writeLog('INFO', 'System ledger logs flushed clean.');
  }

  public async getUserById(userId: string): Promise<User | null> {
    const { data } = await this.supabase.from('users').select('*').eq('id', userId).maybeSingle();
    return data as User | null;
  }

  public async resetSandbox(): Promise<void> {
    // delete all
    await this.supabase.from('verifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('check_ins').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('user_challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('challenges').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await this.supabase.from('logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // insert default users
    const defaultUsers = [
      {
        id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
        username: 'yannick',
        email: 'yannick@gmail.com',
        total_xp: 450
      },
      {
        id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
        username: 'ryan',
        email: 'ryan@gmail.com',
        total_xp: 380
      },
      {
        id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
        username: 'nathanael',
        email: 'nath@gmail.com',
        total_xp: 420
      }
    ];
    await this.supabase.from('users').insert(defaultUsers);

    // insert challenge
    const defaultChallenge = {
      id: 'chal-1',
      title: 'Daily 5AM Workout',
      description: 'Commit to waking up and checking in with a gym workout photo or log by 6:00 AM daily.',
      category: 'Fitness',
      creator_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      creator_username: 'yannick',
      reward_xp: 150,
      participants_count: 3,
      duration_days: 7,
      created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
      start_time: new Date(Date.now() - 3600000).toISOString()
    };
    await this.supabase.from('challenges').insert([defaultChallenge]);

    // enroll
    const enrollments = [{
      id: 'uc-1',
      user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      challenge_id: 'chal-1',
      status: 'ACTIVE',
      progress: 2
    }, {
      id: 'uc-3',
      user_id: 'ry845fbf-4076-4767-8919-48227e7ca4b2',
      challenge_id: 'chal-1',
      status: 'ACTIVE',
      progress: 1
    }, {
      id: 'uc-6',
      user_id: 'na945fbf-4076-4767-8919-48227e7ca4b3',
      challenge_id: 'chal-1',
      status: 'ACTIVE',
      progress: 3
    }];
    await this.supabase.from('user_challenges').insert(enrollments);

    // checkin
    const defaultCheckin = {
      id: 'ci-1',
      user_challenge_id: 'uc-1',
      challenge_id: 'chal-1',
      challenge_title: 'Daily 5AM Workout',
      user_id: 'yc745fbf-4076-4767-8919-48227e7ca4b1',
      username: 'yannick',
      text_proof: 'Leg day completed. Felt great. Woke up at 4:55 AM.',
      imageUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500&auto=format&fit=crop&q=60',
      created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      status: 'APPROVED'
    };
    await this.supabase.from('check_ins').insert([defaultCheckin]);

    await this.writeLog('SEEDED_SANDBOX', 'Pristine seed data restored.');
  }

  public async simulateFail(userId: string, userChallengeId?: string) {
    let query = this.supabase.from('user_challenges').select('*').eq('user_id', userId);
    if (userChallengeId) {
      query = query.eq('id', userChallengeId);
    } else {
      query = query.eq('status', 'ACTIVE');
    }
    const { data: ucs } = await query;
    const uc = ucs?.[0];
    if (!uc) {
      throw new Error("No active challenge found to simulate failure.");
    }

    const { data: chal } = await this.supabase.from('challenges').select('title').eq('id', uc.challenge_id).single();
    const { data: user } = await this.supabase.from('users').select('*').eq('id', userId).single();

    if (uc && chal && user) {
      await this.supabase.from('user_challenges').update({ status: 'FAILED' }).eq('id', uc.id);
      const penalty = Math.min(user.total_xp, 100);
      await this.supabase.from('users').update({ total_xp: user.total_xp - penalty }).eq('id', userId);
      
      await this.writeLog('CHALLENGE_FAILED', `💀 ALARM: @${user.username} lost the challenge "${chal.title}"! Failed to log daily check-in. -${penalty} Staked XP has been slashed!`);
      
      return { 
        success: true, 
        message: `Simulated failure for "${chal.title}".`,
        penalty
      };
    }
    throw new Error("Could not process simulation.");
  }

  public async simulateReminder(userId: string) {
    const { data: uc } = await this.supabase.from('user_challenges').select('challenge_id').eq('user_id', userId).eq('status', 'ACTIVE').maybeSingle();
    const { data: user } = await this.supabase.from('users').select('username').eq('id', userId).single();

    if (!uc) {
      throw new Error("No active challenge found to remind.");
    }

    const { data: chal } = await this.supabase.from('challenges').select('title').eq('id', uc.challenge_id).single();
    if (chal && user) {
      await this.writeLog('ALARM_REMINDER', `⏰ ALARM: @${user.username} has an outstanding checkpoint to complete for "${chal.title}"! Due in 2 hours.`);
      return {
        success: true,
        message: `Alarm reminder broadcasted for "${chal.title}".`,
        challengeTitle: chal.title
      };
    }
    throw new Error("Could not process reminder simulation.");
  }

  public async simulateStart(userId: string) {
    const { data: user } = await this.supabase.from('users').select('username').eq('id', userId).single();
    const { data: chals } = await this.supabase.from('challenges').select('*').order('created_at', { ascending: false });
    const chal = chals?.[0];

    if (chal && user) {
      const startTime = new Date(Date.now() + 45 * 60 * 1000).toISOString();
      await this.supabase.from('challenges').update({ start_time: startTime }).eq('id', chal.id);
      await this.writeLog('ALARM_START_SOON', `⏰ UPCOMING ALARM: "${chal.title}" starts in 45 minutes! Challenger @${user.username}, make sure you are ready to log proof!`);
      return {
        success: true,
        message: `Starting soon alarm broadcasted for "${chal.title}".`,
        challengeTitle: chal.title
      };
    }
    throw new Error("Could not process starting simulation.");
  }

  public async addMatchedChallengerAndChallenge(challengerUser: User, newChallenge: Challenge, userId?: string) {
    await this.supabase.from('users').insert([challengerUser]);
    await this.supabase.from('challenges').insert([{
      id: newChallenge.id,
      title: newChallenge.title,
      description: newChallenge.description,
      category: newChallenge.category,
      creator_id: newChallenge.creator_id,
      creator_username: newChallenge.creator_username,
      reward_xp: newChallenge.reward_xp,
      participants_count: newChallenge.participants_count,
      duration_days: newChallenge.duration_days,
      start_time: newChallenge.start_time
    }]);

    await this.supabase.from('user_challenges').insert([{
      user_id: challengerUser.id,
      challenge_id: newChallenge.id,
      status: 'ACTIVE',
      progress: 0
    }]);

    if (userId) {
      await this.supabase.from('user_challenges').insert([{
        user_id: userId,
        challenge_id: newChallenge.id,
        status: 'ACTIVE',
        progress: 0
      }]);
    }

    await this.writeLog('FRIEND_RESEARCH_CHALLENGE', `Matchmaker created a new challenge: "${newChallenge.title}" with category ${newChallenge.category}.`);
    await this.writeLog('FRIEND_MATCHED', `New friend matched: @${challengerUser.username}!`);
    await this.writeLog('USER_ENROLLED', `@${challengerUser.username} and you joined the task group for "${newChallenge.title}".`);
  }
}

export const dbEngine = usingSupabase ? new SupabaseEngine() : new MockDatabaseEngine();
