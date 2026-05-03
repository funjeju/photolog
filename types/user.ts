import { Timestamp } from 'firebase/firestore';

export type UserPlan = 'free' | 'pro' | 'business';

export type UserUsage = {
  blogPostsThisMonth: number;
  diaryEntriesThisMonth: number;
  videosThisMonth: number;
  monthResetAt: Timestamp;
};

export type UserPreferences = {
  defaultMode: 'blog' | 'diary';
  defaultTone: string;
  locale: 'ko' | 'en';
};

export type User = {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  provider: 'google' | 'email';
  createdAt: Timestamp;
  plan: UserPlan;
  usage: UserUsage;
  preferences?: UserPreferences;
};

export const PLAN_LIMITS: Record<UserPlan, { posts: number; videos: number }> = {
  free:     { posts: 5,          videos: 1 },
  pro:      { posts: 999,        videos: 30 },
  business: { posts: 999,        videos: 100 },
};
