import { Suspense, createElement, lazy, useEffect, useState } from "react";
import { ArrowRight, Crown, Gamepad2, Gem, Sparkles, Star, Trophy, WalletCards } from "lucide-react";
import GameCard from "./components/GameCard";
import { futureGames } from "./future-games/futureGames";
import { GAME_IDS } from "./shared/types/gameTypes";
import { hasFullGameAccess, loadGameProfile } from "./shared/hooks/useGameProgress";
import "./games.css";

const loadMathRacingLeague = () => import("./math-racing-league/MathRacingLeague");
const loadObstacleRunnerGame = () => import("./obstacle-runner/ObstacleRunnerGame");
const loadFractionSliceGame = () => import("./fraction-slice/FractionSliceGame");
const loadRestaurantManagerGame = () => import("./restaurant-manager/RestaurantManagerGame");
const MathRacingLeague = lazy(loadMathRacingLeague);
const ObstacleRunnerGame = lazy(loadObstacleRunnerGame);
const FractionSliceGame = lazy(loadFractionSliceGame);
const RestaurantManagerGame = lazy(loadRestaurantManagerGame);

const availableGames = [
  {
    id: GAME_IDS.mathRacingLeague,
    title: "Math Racing League",
    status: "Available",
    description: "Race against AI opponents by solving maths challenges.",
    art: "racing",
  },
  {
    id: GAME_IDS.obstacleRunner,
    title: "Obstacle Runner",
    status: "Available",
    description: "Run across three lanes, solve maths questions, dodge obstacles, and collect rewards.",
    art: "runner",
  },
  {
    id: GAME_IDS.fractionSlice,
    title: "Fraction Slice",
    status: "Available",
    description: "Slice pizza, cake, fruit, and chocolate to show fractions correctly.",
    art: "fraction",
  },
  {
    id: "restaurant-basic-1",
    title: "Restaurant Challenge",
    status: "Coming Soon",
    description: "Basic 1 learners will serve simple orders by counting and matching numbers.",
    classLevels: ["basic-1"],
    art: "restaurant",
  },
  {
    id: "restaurant-basic-2",
    title: "Restaurant Challenge",
    status: "Coming Soon",
    description: "Basic 2 learners will serve orders using addition, subtraction and money basics.",
    classLevels: ["basic-2"],
    art: "restaurant",
  },
  {
    id: "restaurant-basic-3",
    title: "Restaurant Challenge",
    status: "Coming Soon",
    description: "Basic 3 learners will serve orders using place value, fractions and simple money tasks.",
    classLevels: ["basic-3"],
    art: "restaurant",
  },
  {
    id: GAME_IDS.restaurantManager,
    title: "Restaurant Challenge",
    status: "Available",
    description: "Run a restaurant by solving money, multiplication, division, estimation and BODMAS tasks for Basic 4 to Basic 6.",
    classLevels: ["basic-4", "basic-5", "basic-6"],
    art: "restaurant",
  },
  ...futureGames,
];

function getInitialActiveGame() {
  if (typeof window === "undefined") return null;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!isLocalHost) return null;

  const searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has("fraction-slice-serving") || searchParams.has("fraction-slice")) return GAME_IDS.fractionSlice;
  if (searchParams.has("runner-track") || searchParams.has("runner-glb")) return GAME_IDS.obstacleRunner;
  if (searchParams.has("restaurant-manager") || searchParams.has("restaurant-preview")) return GAME_IDS.restaurantManager;
  return null;
}

function canShowGameForClass(game, classLevel) {
  if (!game.classLevels?.length) return true;
  if (!classLevel) return true;
  return game.classLevels.includes(classLevel);
}

export default function GamesPage({ HeaderComponent, onBack, onPrevious, studentSession = null, userPackage = "free" }) {
  const [activeGame, setActiveGame] = useState(() => getInitialActiveGame());
  const [profile, setProfile] = useState(() => loadGameProfile());
  const fullAccess = hasFullGameAccess(userPackage);
  const classLabel = studentSession?.class_level
    ? `Basic ${studentSession.class_level.split("-")[1]}`
    : "Basic 1";
  const visibleGames = availableGames.filter((game) => canShowGameForClass(game, studentSession?.class_level));

  useEffect(() => {
    const preload = () => {
      loadMathRacingLeague();
      loadObstacleRunnerGame();
      loadFractionSliceGame();
      loadRestaurantManagerGame();
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(preload, { timeout: 1000 })
      : window.setTimeout(preload, 250);

    return () => {
      if (window.cancelIdleCallback && typeof idleId === "number") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, []);

  if (activeGame === GAME_IDS.mathRacingLeague) {
    return (
      <main className="games-page mrl-shell">
        <Suspense fallback={<div className="mrl-loading-card">Loading Math Racing League...</div>}>
          <MathRacingLeague
            profile={profile}
            onProfileChange={setProfile}
            userPackage={userPackage}
            onBackToHub={() => setActiveGame(null)}
          />
        </Suspense>
      </main>
    );
  }

  if (activeGame === GAME_IDS.obstacleRunner) {
    return (
      <main className="games-page">
        <Suspense fallback={<div className="mrl-loading-card">Loading Obstacle Runner...</div>}>
          <ObstacleRunnerGame onBackToHub={() => setActiveGame(null)} />
        </Suspense>
      </main>
    );
  }

  if (activeGame === GAME_IDS.fractionSlice) {
    return (
      <main className="games-page">
        <Suspense fallback={<div className="mrl-loading-card">Loading Fraction Slice...</div>}>
          <FractionSliceGame onBackToHub={() => setActiveGame(null)} startPlaying />
        </Suspense>
      </main>
    );
  }

  if (activeGame === GAME_IDS.restaurantManager) {
    return (
      <main className="games-page">
        <Suspense fallback={<div className="mrl-loading-card">Loading Restaurant Manager...</div>}>
          <RestaurantManagerGame
            initialClassLevel={studentSession?.class_level}
            onBackToHub={() => setActiveGame(null)}
          />
        </Suspense>
      </main>
    );
  }

  return (
    <main className="games-page">
      {createElement(HeaderComponent, { title: "Games", onBack, onPrevious })}

      <section className="games-hero">
        <div className="games-hero-copy">
          <span className="games-eyebrow"><Gamepad2 size={18} /> Learning Arcade</span>
          <h1>Games</h1>
          <p>Pick an educational game, earn rewards, and build skills through play.</p>
        </div>
        <div className="games-hero-wave" aria-hidden="true">
          <span className="games-symbol plus">+</span>
          <span className="games-symbol divide">&divide;</span>
          <span className="games-symbol half">1/2</span>
          <span className="games-symbol times">x</span>
          <span className="games-symbol percent">%</span>
        </div>
        <div className="games-profile-strip" aria-label="Game rewards">
          <span><WalletCards size={30} /> <b>{profile.coins}</b> Coins</span>
          <span><Gem size={30} /> <b>{profile.gems}</b> Gems</span>
          <span><Star size={30} /> <b>{profile.xp}</b> XP</span>
          <span><Trophy size={30} /> <b>{profile.achievements?.length || 0}</b> Achievements</span>
        </div>
      </section>

      <section className="games-access-strip">
        <div>
          <Crown size={32} />
        </div>
        <div>
          <strong>{fullAccess ? "Elite Access" : `${classLabel} Arcade Access`}</strong>
          <span>
            {fullAccess
              ? "All racing leagues are playable without coins, ads, or extra fees."
              : "Play available maths games, earn coins and unlock more rewards as you learn."}
          </span>
        </div>
        <Sparkles className="games-access-sparkle" size={26} />
      </section>

      <section className="games-grid">
        {visibleGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={() => setActiveGame(game.launchId || game.id)}
          />
        ))}
      </section>

      <div className="games-more-note">
        <span />
        <Star size={16} />
        <strong>More exciting games coming below!</strong>
        <Star size={16} />
        <span />
        <ArrowRight size={22} />
      </div>
    </main>
  );
}
