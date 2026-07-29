import { DEFAULT_PLAYER_PROFILE, LEAGUES } from "../types/gameTypes";
import { calculateRaceRewards, getNewAchievements } from "../rewards/rewardSystem";

const STORAGE_KEY = "proTutorsHub_games_profile";

export const RACE_ENTRY_COSTS = {
  bronze: { Easy: 5, Medium: 8, Difficult: 12 },
  silver: { Easy: 7, Medium: 11, Difficult: 16 },
  gold: { Easy: 10, Medium: 15, Difficult: 22 },
  champion: { Easy: 14, Medium: 20, Difficult: 30 },
};

export const REWARDED_AD_COIN_REWARD = 10;

export const COIN_PACKS = [
  { id: "starter", label: "Starter Pack", coins: 100, amount: 500 },
  { id: "value", label: "Value Pack", coins: 230, amount: 1000 },
  { id: "family", label: "Family Pack", coins: 520, amount: 2000 },
];

export function hasFullGameAccess(userPackage = "free") {
  return userPackage === "standard" || userPackage === "elite";
}

function safeParseProfile(raw) {
  if (!raw) return DEFAULT_PLAYER_PROFILE;
  try {
    const parsed = JSON.parse(raw);
    const migrated = { ...DEFAULT_PLAYER_PROFILE, ...parsed };
    if (parsed.startingCoinsGranted !== true) {
      migrated.coins = (parsed.coins || 0) + DEFAULT_PLAYER_PROFILE.coins;
      migrated.startingCoinsGranted = true;
    }
    return migrated;
  } catch {
    return DEFAULT_PLAYER_PROFILE;
  }
}

export function loadGameProfile() {
  if (typeof window === "undefined") return DEFAULT_PLAYER_PROFILE;
  const profile = safeParseProfile(window.localStorage.getItem(STORAGE_KEY));
  saveGameProfile(profile);
  return profile;
}

export function saveGameProfile(profile) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }
  return profile;
}

export function isLeagueUnlocked(profile, leagueId) {
  return (profile.unlockedLeagues || []).includes(leagueId);
}

export function getRaceEntryCost(leagueId = "bronze", difficulty = "Easy") {
  return RACE_ENTRY_COSTS[leagueId]?.[difficulty] ?? RACE_ENTRY_COSTS.bronze.Easy;
}

export function spendRaceEntryCoins(profile, leagueId, difficulty, userPackage = "free") {
  const cost = getRaceEntryCost(leagueId, difficulty);

  if (hasFullGameAccess(userPackage)) {
    return { ok: true, cost: 0, shortage: 0, profile };
  }

  const coins = profile.coins || 0;
  if (coins < cost) {
    return { ok: false, cost, shortage: cost - coins, profile };
  }

  const nextProfile = {
    ...profile,
    coins: coins - cost,
    coinLedger: [
      ...(profile.coinLedger || []),
      {
        id: `race-entry-${Date.now()}`,
        type: "spend",
        source: "race-entry",
        leagueId,
        difficulty,
        coins: -cost,
        createdAt: new Date().toISOString(),
      },
    ].slice(-50),
  };

  return { ok: true, cost, shortage: 0, profile: saveGameProfile(nextProfile) };
}

export function addGameCoins(profile, coins, source, extra = {}) {
  const nextProfile = {
    ...profile,
    coins: (profile.coins || 0) + coins,
    rewardedAdsWatched:
      source === "rewarded-ad" ? (profile.rewardedAdsWatched || 0) + 1 : profile.rewardedAdsWatched || 0,
    coinPurchases:
      source === "coin-pack"
        ? [
            ...(profile.coinPurchases || []),
            {
              id: `coin-pack-${Date.now()}`,
              createdAt: new Date().toISOString(),
              ...extra,
            },
          ].slice(-25)
        : profile.coinPurchases || [],
    coinLedger: [
      ...(profile.coinLedger || []),
      {
        id: `${source}-${Date.now()}`,
        type: "earn",
        source,
        coins,
        createdAt: new Date().toISOString(),
        ...extra,
      },
    ].slice(-50),
  };

  return saveGameProfile(nextProfile);
}

export function recordMathRacingResult(profile, result) {
  const rewards = calculateRaceRewards(result);
  const achievementUpdate = getNewAchievements(profile, result);
  const league = LEAGUES.find((item) => item.id === result.leagueId);
  const progressKey = `${result.leagueId}:${result.difficulty}`;
  const previous = profile.progress?.[progressKey] || {};
  const unlockedLeagues = new Set(profile.unlockedLeagues || ["bronze"]);

  if (result.finalPosition <= 3 && league?.unlocks) {
    unlockedLeagues.add(league.unlocks);
  }

  const nextProfile = {
    ...profile,
    xp: (profile.xp || 0) + rewards.xpEarned,
    coins: (profile.coins || 0) + rewards.coinsEarned,
    gems: (profile.gems || 0) + rewards.gemsEarned,
    coinLedger: rewards.coinsEarned > 0
      ? [
          ...(profile.coinLedger || []),
          {
            id: `race-reward-${Date.now()}`,
            type: "earn",
            source: "race-reward",
            leagueId: result.leagueId,
            difficulty: result.difficulty,
            coins: rewards.coinsEarned,
            createdAt: new Date().toISOString(),
          },
        ].slice(-50)
      : profile.coinLedger || [],
    achievements: achievementUpdate.achievements,
    unlockedLeagues: Array.from(unlockedLeagues),
    progress: {
      ...(profile.progress || {}),
      [progressKey]: {
        bestRank: previous.bestRank ? Math.min(previous.bestRank, result.finalPosition) : result.finalPosition,
        bestDistance: Math.max(previous.bestDistance || 0, Math.round(result.playerDistance)),
        bestAccuracy: Math.max(previous.bestAccuracy || 0, result.accuracy),
        races: (previous.races || 0) + 1,
      },
    },
    leaderboards: {
      ...(profile.leaderboards || {}),
      [progressKey]: result.leaderboard,
    },
  };

  return {
    profile: saveGameProfile(nextProfile),
    rewards,
    achievements: achievementUpdate.additions,
  };
}