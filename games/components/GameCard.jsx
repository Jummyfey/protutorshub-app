import { ArrowRight, Lock, Sparkles } from "lucide-react";

export default function GameCard({ game, onPlay }) {
  const available = game.status === "Available";

  return (
    <article className={`game-card ${available ? "available" : "locked"}`}>
      <div className="game-card-art">
        <span className="game-card-orbit" />
        <Sparkles size={24} />
      </div>
      <div className="game-card-copy">
        <span className="game-card-status">{game.status}</span>
        <h2>{game.title}</h2>
        <p>{game.description}</p>
      </div>
      <button className={available ? "game-play-button" : "game-soon-button"} onClick={onPlay} disabled={!available}>
        {available ? "Play Now" : "Coming Soon"}
        {available ? <ArrowRight size={18} /> : <Lock size={16} />}
      </button>
    </article>
  );
}