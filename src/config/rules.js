// Single source of truth for scoring. The Go backend must mirror these values.
export const RULES = {
  LEAD_WON: 50,            // portal points for each successful lead
  LEAD_DROPPED: -50,       // portal points for each dropped lead
  LOGIN_BASE: 10,          // points for logging in on any day
  STREAK_BONUS_PER_DAY: 5, // extra points for every consecutive login day
  STREAK_BONUS_CAP: 50,    // the streak bonus stops growing here
};

/** Points awarded for the login on day N of a streak (day 1 = fresh streak). */
export function loginPointsForStreak(streakDay) {
  const day = Math.max(1, streakDay);
  const bonus = Math.min((day - 1) * RULES.STREAK_BONUS_PER_DAY, RULES.STREAK_BONUS_CAP);
  return RULES.LOGIN_BASE + bonus;
}

export const STREAK_MILESTONES = [3, 7, 14, 30];

export const RANGES = [
  { key: 'today', label: 'Today', days: 1 },
  { key: 'week', label: '7 days', days: 7 },
  { key: 'month', label: '30 days', days: 30 },
  { key: 'all', label: 'All time', days: null },
];

export const EVENT_META = {
  LOGIN: { label: 'Daily login', short: 'Login' },
  LEAD_WON: { label: 'Lead won', short: 'Lead' },
  LEAD_DROPPED: { label: 'Lead dropped', short: 'Drop' },
};
