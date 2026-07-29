import { ArrowLeft, Bug, ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import ObstacleRunnerScene from "./scene/ObstacleRunnerScene";
import { RUNNER_CONFIG } from "./scene/runnerConfig";
import "./obstacle-runner.css";

const initialRunnerState = () => ({
  distance: 0,
  lane: 1,
  targetLane: 1,
  x: RUNNER_CONFIG.lanes[1],
  y: 0,
  z: 0,
  speed: RUNNER_CONFIG.movement.baseSpeed,
  paused: true,
  debug: false,
  action: "Run",
  requestedAction: null,
  airborne: false,
  verticalVelocity: 0,
  colliderHeight: RUNNER_CONFIG.character.collider.height,
});

export default function ObstacleRunnerGame({ onBackToHub }) {
  const runnerStateRef = useRef(initialRunnerState());
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(true);
  const [debug, setDebug] = useState(false);
  const [hud, setHud] = useState({ distance: 0, speed: RUNNER_CONFIG.movement.baseSpeed, lane: 1, activeSegments: RUNNER_CONFIG.track.activeSegments });
  const [characterInfo, setCharacterInfo] = useState(null);

  const inputApi = useMemo(() => ({
    moveLane(direction) {
      const state = runnerStateRef.current;
      const nextLane = Math.max(0, Math.min(RUNNER_CONFIG.lanes.length - 1, state.targetLane + direction));
      state.targetLane = nextLane;
      setHud((current) => ({ ...current, lane: nextLane }));
    },
    start() {
      runnerStateRef.current.paused = false;
      setStarted(true);
      setPaused(false);
    },
    pause() {
      runnerStateRef.current.paused = true;
      setPaused(true);
    },
    resume() {
      runnerStateRef.current.paused = false;
      setPaused(false);
    },
    restart() {
      runnerStateRef.current = initialRunnerState();
      runnerStateRef.current.paused = false;
      runnerStateRef.current.debug = debug;
      setStarted(true);
      setPaused(false);
      setHud({ distance: 0, speed: RUNNER_CONFIG.movement.baseSpeed, lane: 1, activeSegments: RUNNER_CONFIG.track.activeSegments });
    },
    toggleDebug() {
      const next = !runnerStateRef.current.debug;
      runnerStateRef.current.debug = next;
      setDebug(next);
    },
    action(actionName) {
      runnerStateRef.current.requestedAction = actionName;
    },
  }), [debug]);

  const handleTick = (nextHud) => {
    setHud((current) => {
      if (
        Math.abs(current.distance - nextHud.distance) < 3 &&
        Math.abs(current.speed - nextHud.speed) < 0.05 &&
        current.lane === nextHud.lane &&
        current.activeSegments === nextHud.activeSegments
      ) {
        return current;
      }
      return nextHud;
    });
  };

  return (
    <section className="or-game" aria-label="Obstacle Runner track prototype">
      <ObstacleRunnerScene runnerStateRef={runnerStateRef} onHudTick={handleTick} onCharacterAssetInfo={setCharacterInfo} />

      <div className="or-track-hud">
        <button type="button" className="or-hud-button" onClick={onBackToHub} aria-label="Back to games">
          <ArrowLeft size={19} /> Games
        </button>
        <div>
          <span>Distance</span>
          <strong>{Math.floor(hud.distance)}m</strong>
        </div>
        <div>
          <span>Speed</span>
          <strong>{hud.speed.toFixed(1)}</strong>
        </div>
        <div>
          <span>Lane</span>
          <strong>{["Left", "Centre", "Right"][hud.lane]}</strong>
        </div>
        <button type="button" className={`or-hud-button ${debug ? "active" : ""}`} onClick={inputApi.toggleDebug}>
          <Bug size={18} /> Debug
        </button>
        <button type="button" className="or-hud-button" onClick={paused ? inputApi.resume : inputApi.pause}>
          {paused ? <Play size={18} /> : <Pause size={18} />} {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {characterInfo?.missingAnimations ? (
        <div className="or-character-warning">
          Imported runner has no animation clips yet. The model is loaded; Run, Jump, Slide, and Stumble clips are still required.
        </div>
      ) : null}

      <div className="or-runner-controls" aria-label="Lane controls">
        <button type="button" onClick={() => inputApi.moveLane(-1)} aria-label="Move left">
          <ChevronLeft size={42} />
        </button>
        <button type="button" onClick={() => inputApi.action("Jump")} aria-label="Jump">
          Jump
        </button>
        <button type="button" onClick={inputApi.restart} aria-label="Restart run">
          <RotateCcw size={30} />
        </button>
        <button type="button" onClick={() => inputApi.action("Slide")} aria-label="Slide">
          Slide
        </button>
        <button type="button" onClick={() => inputApi.moveLane(1)} aria-label="Move right">
          <ChevronRight size={42} />
        </button>
      </div>

      {!started ? (
        <div className="or-track-menu">
          <div>
            <span>Obstacle Runner Phase 1</span>
            <h1>Three-Lane Jungle Track</h1>
            <p>Continuous grounded running track with modular recycled sections. Maths questions, coins, and obstacles are intentionally off for this phase.</p>
            <button type="button" onClick={inputApi.start}><Play size={20} /> Start Track Test</button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
