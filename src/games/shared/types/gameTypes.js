export const GAME_IDS = {
  mathRacingLeague: "math-racing-league",
  buildCity: "build-a-city",
  obstacleRunner: "obstacle-runner",
  fractionSlice: "fraction-slice",
  restaurantManager: "restaurant-manager",
};

export const DIFFICULTIES = ["Easy", "Medium", "Difficult"];

export const LEAGUES = [
  {
    id: "bronze",
    name: "Bronze League",
    focus: "Addition, subtraction, multiplication, and place value.",
    accent: "#d08a2e",
    sky: "#7dd3fc",
    unlocks: "silver",
  },
  {
    id: "silver",
    name: "Silver League",
    focus: "Mixed operations, rounding, factors, and multiples.",
    accent: "#aeb8c5",
    sky: "#9ad3ff",
    unlocks: "gold",
  },
  {
    id: "gold",
    name: "Gold League",
    focus: "Fractions, decimals, percentages, and word problems.",
    accent: "#f0b84e",
    sky: "#8edbff",
    unlocks: "champion",
  },
  {
    id: "champion",
    name: "Champion League",
    focus: "Exam-style mixed reasoning and challenge questions.",
    accent: "#9f7aea",
    sky: "#b4a7ff",
    unlocks: null,
  },
];

export const DEFAULT_PLAYER_PROFILE = {
  name: "Pro Racer",
  xp: 0,
  coins: 20,
  gems: 0,
  startingCoinsGranted: true,
  rewardedAdsWatched: 0,
  coinPurchases: [],
  achievements: [],
  unlockedLeagues: ["bronze"],
  progress: {},
  leaderboards: {},
};
