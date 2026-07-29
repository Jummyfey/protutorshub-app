import { ArrowRight, Lock } from "lucide-react";

function GameCardArt({ type = "arcade" }) {
  if (type === "racing") {
    return (
      <div className="game-card-scene game-card-scene-racing" aria-hidden="true">
        <div className="race-board">12 + 8 = ?</div>
        <div className="race-track" />
        <div className="race-car">
          <span />
          <i />
        </div>
        <b className="race-trophy" />
        <em />
      </div>
    );
  }

  if (type === "runner") {
    return (
      <div className="game-card-scene game-card-scene-runner" aria-hidden="true">
        <div className="runner-child" />
        <span className="runner-gate">-7</span>
        <span className="runner-gate plus">+5</span>
        <span className="runner-gate minus">-12</span>
        <i />
      </div>
    );
  }

  if (type === "fraction") {
    return (
      <div className="game-card-scene game-card-scene-fraction" aria-hidden="true">
        <div className="pie-plate">
          <span>1/4</span>
          <span>1/4</span>
          <span>1/4</span>
          <span>1/4</span>
        </div>
        <div className="fraction-slice-piece">
          <b>1/2</b>
          <b>1/4</b>
        </div>
      </div>
    );
  }

  if (type === "restaurant") {
    return (
      <div className="game-card-scene game-card-scene-restaurant" aria-hidden="true">
        <div className="restaurant-board">15 + 7 = ? <b>= 22.</b></div>
        <div className="food-counter">
          <span className="food-burger"><i /><b>12</b></span>
          <span className="food-fries"><i /><b>8</b></span>
          <span className="food-cup"><i /><b>15</b></span>
          <span className="food-cake"><i /><b>9</b></span>
        </div>
      </div>
    );
  }

  return <div className="game-card-scene game-card-scene-arcade" aria-hidden="true" />;
}

export default function GameCard({ game, onPlay }) {
  const available = game.status === "Available";

  return (
    <article className={`game-card ${available ? "available" : "locked"}`}>
      <GameCardArt type={game.art} />
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
