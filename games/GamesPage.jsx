import { Suspense, createElement, lazy, useEffect, useState } from "react";
import { Gamepad2, Gem, Star, Trophy, WalletCards } from "lucide-react";
import GameCard from "./components/GameCard";
import { futureGames } from "./future-games/futureGames";
import { GAME_IDS } from "./shared/types/gameTypes";
import { hasFullGameAccess, loadGameProfile } from "./shared/hooks/useGameProgress";
import "./games.css";

const loadMathRacingLeague = () => import("./math-racing-league/MathRacingLeague");
const MathRacingLeague = lazy(loadMathRacingLeague);

const availableGames = [
  {
    id: GAME_IDS.mathRacingLeague,
    title: "Math Racing League",
    status: "Available",
    description: "Race against AI opponents by solving maths challenges.",
  },
  ...futureGames,
];

export default function GamesPage({ HeaderComponent, onBack, onPrevious, userPackage = "free" }) {
  const [activeGame, setActiveGame] = useState(null);
  const [profile, setProfile] = useState(() => loadGameProfile());
  const fullAccess = hasFullGameAccess(userPackage);

  useEffect(() => {
    const preload = () => loadMathRacingLeague();
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

  return (
    <main className="games-page">
      {createElement(HeaderComponent, { title: "Games", onBack, onPrevious })}

      <section className="games-hero">
        <div>
          <span className="games-eyebrow"><Gamepad2 size={18} /> Learning Arcade</span>
          <h1>Games</h1>
          <p>Pick an educational game, earn rewards, and build skill through play.</p>
        </div>
        <div className="games-profile-strip">
          <span><WalletCards size={18} /> {profile.coins} Coins</span>
          <span><Gem size={18} /> {profile.gems} Gems</span>
          <span><Star size={18} /> {profile.xp} XP</span>
          <span><Trophy size={18} /> {profile.achievements?.length || 0} Achievements</span>
        </div>
      </section>

      <section className="games-access-strip">
        <strong>{fullAccess ? `${userPackage} access` : "Free arcade access"}</strong>
        <span>
          {fullAccess
            ? "All racing leagues are playable without coins, ads, or extra fees."
            : "Use coins to enter races, or ask a parent for a coin pack when coins run low."}
        </span>
      </section>

      <section className="games-grid">
        {availableGames.map((game) => (
          <GameCard
            key={game.id}
            game={game}
            onPlay={() => setActiveGame(game.id)}
          />
        ))}
      </section>
    </main>
  );
}
