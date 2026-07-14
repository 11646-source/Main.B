export interface User {
  id: string;
  username: string;
  email: string;
  total_xp: number;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  creator_id: string;
  creator_username: string;
  reward_xp: number;
  participants_count: number;
  duration_days: number;
  created_at: string;
  start_time?: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  enrolled_at: string;
  status: 'ACTIVE' | 'COMPLETED' | 'FAILED';
  progress: number;
}

export interface CheckIn {
  id: string;
  user_challenge_id: string;
  challenge_id: string;
  challenge_title: string;
  user_id: string;
  username: string;
  imageUrl?: string;
  text_proof: string;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'DISPUTED';
}

export interface Verification {
  id: string;
  check_in_id: string;
  voter_id: string;
  voter_username: string;
  vote: 'APPROVE' | 'DISPUTED';
  created_at: string;
}

export interface SystemLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}
