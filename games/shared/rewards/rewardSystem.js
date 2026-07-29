const RACE_COIN_REWARDS = {
  bronze: {
    Easy: { 1: 6, 2: 3 },
    Medium: { 1: 10, 2: 5 },
    Difficult: { 1: 16, 2: 8 },
  },
  silver: {
    Easy: { 1: 8, 2: 4 },
    Medium: { 1: 13, 2: 7 },
    Difficult: { 1: 20, 2: 10 },
  },
  gold: {
    Easy: { 1: 11, 2: 6 },
    Medium: { 1: 17, 2: 9 },
    Difficult: { 1: 27, 2: 13 },
  },
  champion: {
    Easy: { 1: 16, 2: 8 },
    Medium: { 1: 24, 2: 12 },
    Difficult: { 1: 36, 2: 18 },
  },
};

export function calculateRaceRewards(result) {
  const positionBonus = Math.max(0, 5 - result.finalPosition) * 12;
  const accuracyBonus = Math.round(result.accuracy * 0.5);
  const streakBonus = Math.min(40, result.bestStreak * 4);
  const missedAnswers =
    result.missedAnswers ??
    ((result.wrongAnswers || 0) + (result.unansweredAnswers || 0));
  const missedPenalty = Math.min(35, missedAnswers * 2);
  const xpEarned = Math.max(0, 35 + positionBonus + accuracyBonus + streakBonus - missedPenalty);
  const placementCoins = RACE_COIN_REWARDS[result.leagueId]?.[result.difficulty]?.[result.finalPosition] || 0;
  const coinsEarned = placementCoins;
  const gemsEarned = result.finalPosition === 1 ? 3 : result.finalPosition <= 3 ? 1 : 0;

  return { xpEarned, coinsEarned, gemsEarned };
}

export function getNewAchievements(profile, result) {
  const achievements = new Set(profile.achievements || []);
  const additions = [];

  const maybeAdd = (id, label) => {
    if (!achievements.has(id)) {
      achievements.add(id);
      additions.push({ id, label });
    }
  };

  if (result.finalPosition === 1) maybeAdd("first-win", "First Place Finish");
  if (result.bestStreak >= 5) maybeAdd("nitro-streak", "Nitro Streak");
  if (result.accuracy >= 90) maybeAdd("sharp-driver", "Sharp Driver");
  if (result.questionsAnswered >= 12) maybeAdd("rapid-solver", "Rapid Solver");

  return { achievements: Array.from(achievements), additions };
}
