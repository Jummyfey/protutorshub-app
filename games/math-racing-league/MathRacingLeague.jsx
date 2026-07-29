import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Gem, Pause, Play, Star, Trophy, WalletCards } from "lucide-react";
import { DIFFICULTIES, LEAGUES } from "../shared/types/gameTypes";
import {
  COIN_PACKS,
  addGameCoins,
  getRaceEntryCost,
  hasFullGameAccess,
  isLeagueUnlocked,
  recordMathRacingResult,
  spendRaceEntryCoins,
} from "../shared/hooks/useGameProgress";
import { verifyFlutterwaveCoinPackPayment } from "../../services/backendSync";
import { generateRaceQuestion, getLeagueById } from "./questionGenerator";
import RaceCanvas from "./components/RaceCanvas";

const loadRace3DScene = () => import("./components/Race3DScene");
const Race3DScene = lazy(loadRace3DScene);

const RACE_DISTANCE = 1000;
const RACE_QUESTION_CONFIG = {
  Easy: { totalQuestions: 30, questionDuration: 4 },
  Medium: { totalQuestions: 24, questionDuration: 5 },
  Difficult: { totalQuestions: 24, questionDuration: 5 },
  Hard: { totalQuestions: 24, questionDuration: 5 },
};
const PLAYER_BASE_SPEED = 32;
const PLAYER_MIN_SPEED = 22;
const PLAYER_MAX_SPEED = 78;
const AI_MIN_SPEED = PLAYER_MIN_SPEED;
const AI_MAX_SPEED = PLAYER_MAX_SPEED;
const FRAME_STEP_SECONDS = 1 / 10;
const AI_STATE_STEP_SECONDS = 1 / 6;
const MAX_FRAME_DELTA = 0.12;
const MAX_TIMER_DELTA = 4;
const CORRECT_PERFORMANCE_SPEED = 0.4;
const CORRECT_MOMENTUM_SPEED = 0.14;
const MISSED_PERFORMANCE_PENALTY = 2.5;
const ANSWER_TIME_SPEED_BONUS_MAX = 0.5;
const FLUTTERWAVE_SCRIPT_SRC = "https://checkout.flutterwave.com/v3.js";
const PAUSED_RACE_STORAGE_KEY = "pth-math-racing-paused-race";
const RACE_MUSIC_STORAGE_KEY = "pth-math-racing-music-enabled";
const AI_RACERS = [
  { id: "ai-speedster", name: "Speedster", color: "#38d9ff", lane: 0, skillRange: [0.65, 0.85], baseSpeed: PLAYER_BASE_SPEED },
  { id: "ai-flash", name: "Flash", color: "#f97316", lane: 2, skillRange: [0.75, 0.9], baseSpeed: PLAYER_BASE_SPEED },
];
const AI_CHALLENGES = [
  {
    id: "friendly",
    label: "Friendly",
    description: "Good for practice races.",
    ranges: {
      "ai-speedster": [0.55, 0.7],
      "ai-flash": [0.65, 0.8],
    },
  },
  {
    id: "balanced",
    label: "Balanced",
    description: "Current competitive range.",
    ranges: {
      "ai-speedster": [0.65, 0.85],
      "ai-flash": [0.75, 0.9],
    },
  },
  {
    id: "champion",
    label: "Champion",
    description: "Sharper AI for strong players.",
    ranges: {
      "ai-speedster": [0.75, 0.9],
      "ai-flash": [0.85, 0.95],
    },
  },
];
const DEFAULT_AI_CHALLENGE_ID = "balanced";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const randomBetween = (min, max) => min + Math.random() * (max - min);

function getAiChallenge(challengeId = DEFAULT_AI_CHALLENGE_ID) {
  return AI_CHALLENGES.find((challenge) => challenge.id === challengeId) || AI_CHALLENGES[1];
}

function formatPercentRange(range) {
  return `${Math.round(range[0] * 100)}-${Math.round(range[1] * 100)}%`;
}

function getRaceQuestionConfig(difficulty = "Medium") {
  return RACE_QUESTION_CONFIG[difficulty] || RACE_QUESTION_CONFIG.Medium;
}

function makePlayerCar() {
  return {
    id: "player",
    name: "You",
    color: "#22c55e",
    lane: 1,
    isPlayer: true,
    distanceTravelled: 0,
  };
}

function makeInitialRace(status = "readying", difficulty = "Medium") {
  const { totalQuestions, questionDuration } = getRaceQuestionConfig(difficulty);
  return {
    status,
    countdown: 5,
    timeLeft: totalQuestions * questionDuration,
    playerDistance: 0,
    speed: PLAYER_BASE_SPEED,
    baseSpeed: PLAYER_BASE_SPEED,
    boostLevel: 0,
    lane: 1,
    score: 0,
    correct: 0,
    answered: 0,
    wrong: 0,
    unanswered: 0,
    missedQuestions: [],
    totalQuestions,
    totalAnswerTime: 0,
    timedAnswers: 0,
    streak: 0,
    bestStreak: 0,
    questionDuration,
    questionTimeLeft: questionDuration,
  };
}

function buildQuestionBatch(leagueId, difficulty, count = getRaceQuestionConfig(difficulty).totalQuestions) {
  return Array.from({ length: count }, () => generateRaceQuestion(leagueId, difficulty));
}

function explainQuestionLogic(prompt, answer) {
  const cleanPrompt = String(prompt || "").replace(/\s+/g, " ").trim();
  const cleanAnswer = String(answer ?? "");
  const pupilsPencils = cleanPrompt.match(/(\d+) pupils each get (\d+) pencils\. There are (\d+) extra pencils/i);
  if (pupilsPencils) {
    const pupils = Number(pupilsPencils[1]);
    const pencilsEach = Number(pupilsPencils[2]);
    const extra = Number(pupilsPencils[3]);
    const sharedPencils = pupils * pencilsEach;
    return `First multiply pupils by pencils each: ${pupils} x ${pencilsEach} = ${sharedPencils}. Then add the extra pencils: ${sharedPencils} + ${extra} = ${cleanAnswer}.`;
  }

  const fractionOf = cleanPrompt.match(/(?:Find )?(\d+)\/(\d+) of (\d+)/i);
  if (fractionOf) {
    const numerator = Number(fractionOf[1]);
    const denominator = Number(fractionOf[2]);
    const whole = Number(fractionOf[3]);
    return `Divide the whole by the denominator, then multiply by the numerator: ${whole} / ${denominator} x ${numerator} = ${cleanAnswer}.`;
  }

  const percentOf = cleanPrompt.match(/(?:Find |Calculate )?(\d+(?:\.\d+)?)% of (\d+)/i);
  if (percentOf) {
    const percent = Number(percentOf[1]);
    const value = Number(percentOf[2]);
    return `Change ${percent}% to ${percent}/100, then multiply: ${value} x ${percent}/100 = ${cleanAnswer}.`;
  }

  const rectanglePerimeter = cleanPrompt.match(/perimeter of a rectangle(?: with length)? (\d+) cm (?:and width|by) (\d+) cm/i);
  if (rectanglePerimeter) {
    const length = Number(rectanglePerimeter[1]);
    const width = Number(rectanglePerimeter[2]);
    return `Add length and width, then double it: 2 x (${length} + ${width}) = ${cleanAnswer}.`;
  }

  const rectangleArea = cleanPrompt.match(/area of a rectangle(?: with length)? (\d+) cm (?:and width|by) (\d+) cm/i);
  if (rectangleArea) {
    const length = Number(rectangleArea[1]);
    const width = Number(rectangleArea[2]);
    return `Multiply length by width: ${length} x ${width} = ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes(" + ___ = ")) {
    return `Find the missing number by subtracting the first number from the total. The missing value is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("What comes next?")) {
    return `Look for the repeated step in the sequence, then add that same step once more. The next value is ${cleanAnswer}.`;
  }

  if (cleanPrompt.startsWith("What is the value of ")) {
    return `Use place value: multiply the digit by its place in the number. That gives ${cleanAnswer}.`;
  }

  if (cleanPrompt.startsWith("Write ") && cleanPrompt.includes(" as a number")) {
    return `Add the expanded parts together to form the standard number: ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("% of ")) {
    return `Convert the percent to a fraction over 100, then multiply by the number. The result is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("perimeter")) {
    return `For a rectangle, perimeter = 2 x (length + width). The perimeter is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("area")) {
    return `For a rectangle, area = length x width. The area is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("average")) {
    return `Add all the values, then divide by how many values there are. The average is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("LCM")) {
    return `List or compare multiples until you find the smallest common multiple. The LCM is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes("HCF")) {
    return `List the common factors and choose the greatest one. The HCF is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes(" x ") || cleanPrompt.includes(" × ")) {
    return `Use multiplication first where needed, then finish the remaining operation. The correct answer is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes(" + ")) {
    return `Add the numbers carefully. The correct answer is ${cleanAnswer}.`;
  }

  if (cleanPrompt.includes(" - ")) {
    return `Subtract the second number from the first. The correct answer is ${cleanAnswer}.`;
  }

  return `Work through the operation in the question step by step. The correct answer is ${cleanAnswer}.`;
}

function makeMissedQuestionReview(question, userAnswer, answerTime, reason) {
  if (!question) return null;
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    prompt: question.prompt,
    userAnswer: userAnswer == null ? "Missed" : String(userAnswer),
    correctAnswer: String(question.answer),
    answerTime,
    reason,
    logic: explainQuestionLogic(question.prompt, question.answer),
  };
}

function getAccuracyScore(correct, totalQuestions) {
  return Math.round((correct / Math.max(1, totalQuestions)) * 100);
}

function getPerformanceSpeed(correctAnswers, missedAnswers, totalAnswerTime, timedAnswers, questionDuration, totalQuestions, minSpeed, maxSpeed) {
  const averageAnswerTime = timedAnswers ? totalAnswerTime / timedAnswers : questionDuration;
  const answerSpeedRatio = clamp((questionDuration - averageAnswerTime) / Math.max(1, questionDuration), 0, 1);
  const answered = correctAnswers + missedAnswers;
  const progressRatio = clamp(answered / Math.max(1, totalQuestions), 0, 1);
  const progressGate = 0.08 + progressRatio ** 4 * 0.92;
  const performanceDelta =
    correctAnswers * CORRECT_PERFORMANCE_SPEED -
    missedAnswers * MISSED_PERFORMANCE_PENALTY +
    correctAnswers * correctAnswers * CORRECT_MOMENTUM_SPEED;
  const speed =
    PLAYER_BASE_SPEED +
    performanceDelta * progressGate +
    answerSpeedRatio * ANSWER_TIME_SPEED_BONUS_MAX;
  return clamp(speed, minSpeed, maxSpeed);
}

function buildAiAnswerPlan(totalQuestions, skill) {
  const targetCorrect = clamp(Math.round(totalQuestions * skill), 0, totalQuestions);
  let correctSoFar = 0;
  return Array.from({ length: totalQuestions }, (_, index) => {
    const expectedCorrectByNow = Math.round(((index + 1) / totalQuestions) * targetCorrect);
    const isCorrect = expectedCorrectByNow > correctSoFar;
    if (isCorrect) correctSoFar += 1;
    return isCorrect;
  });
}

function advanceAiAnswerCycle(car, questionDuration = 5, answerTime = questionDuration) {
  const totalQuestions = car.totalQuestions || getRaceQuestionConfig().totalQuestions;
  const previousCorrect = car.correctAnswers || 0;
  const previousWrong = car.wrongAnswers || 0;
  const previousUnanswered = car.unansweredAnswers || 0;
  const previousAnswered = previousCorrect + previousWrong + previousUnanswered;
  if (previousAnswered >= totalQuestions) {
    return car;
  }

  const answered = previousCorrect + previousWrong + previousUnanswered + 1;
  const resolvedAnswerTime = clamp(answerTime, 0, questionDuration);
  const questionTimeLeft = Math.max(0, questionDuration - resolvedAnswerTime);
  const correct = car.answerPlan?.[previousAnswered] ?? Math.random() < car.raceSkill;
  const correctAnswers = previousCorrect + (correct ? 1 : 0);
  const wrongAnswers = previousWrong + (correct ? 0 : 1);
  const totalAnswerTime = (car.totalAnswerTime || 0) + resolvedAnswerTime;
  const timedAnswers = (car.timedAnswers || 0) + 1;
  const missedAnswers = wrongAnswers + previousUnanswered;
  const speed = getPerformanceSpeed(
    correctAnswers,
    missedAnswers,
    totalAnswerTime,
    timedAnswers,
    questionDuration,
    totalQuestions,
    AI_MIN_SPEED,
    AI_MAX_SPEED
  );
  const speedDelta = speed - car.speed;
  const accuracyScore = getAccuracyScore(correctAnswers, answered);

  console.debug("[MathRacingLeague AI]", {
    name: car.name,
    questionNumber: answered,
    totalQuestions,
    result: correct ? "correct" : "wrong",
    effect: speedDelta >= 0 ? "speed boost" : "slowdown",
    speedChange: Number(speedDelta.toFixed(2)),
    currentSpeed: Number(speed.toFixed(2)),
    currentDistance: Math.round(car.distanceTravelled || 0),
    answerTime: Number(resolvedAnswerTime.toFixed(2)),
    accuracy: accuracyScore,
  });

  return {
    ...car,
    speed,
    correctAnswers,
    wrongAnswers,
    totalAnswerTime,
    timedAnswers,
  };
}

function makeInitialAiCars(difficulty = "Easy", challengeId = DEFAULT_AI_CHALLENGE_ID) {
  const { totalQuestions } = getRaceQuestionConfig(difficulty);
  const challenge = getAiChallenge(challengeId);
  return AI_RACERS.map((car) => {
    const skillRange = challenge.ranges[car.id] || car.skillRange;
    const raceSkill = randomBetween(...skillRange);
    return {
      ...car,
      skillRange,
      raceSkill,
      speed: car.baseSpeed,
      distanceTravelled: 0,
      correctAnswers: 0,
      wrongAnswers: 0,
      unansweredAnswers: 0,
      totalAnswerTime: 0,
      timedAnswers: 0,
      totalQuestions,
      answerPlan: buildAiAnswerPlan(totalQuestions, raceSkill),
    };
  });
}

function formatClock(seconds) {
  const value = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

function formatOrdinal(position) {
  const suffix =
    position % 100 >= 11 && position % 100 <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][position % 10] || "th";
  return `${position}${suffix}`;
}

function loadFlutterwaveInlineScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("Payment is not available here."));
  if (window.FlutterwaveCheckout) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${FLUTTERWAVE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", resolve, { once: true });
      existing.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = FLUTTERWAVE_SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load payment checkout."));
    document.body.appendChild(script);
  });
}

function makeCoinPackTxRef(packId) {
  const randomId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `pth-coins-${packId}-${randomId}`;
}

function formatCoinPackPrice(amount) {
  return `NGN ${amount.toLocaleString()}`;
}

function loadPausedRaceSnapshot() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PAUSED_RACE_STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw);
    if (!snapshot?.selectedLeagueId || !snapshot?.selectedDifficulty || !snapshot?.raceState) return null;
    return snapshot;
  } catch {
    return null;
  }
}

function savePausedRaceSnapshot(snapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PAUSED_RACE_STORAGE_KEY, JSON.stringify({
    ...snapshot,
    savedAt: Date.now(),
  }));
}

function clearPausedRaceSnapshot() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PAUSED_RACE_STORAGE_KEY);
}

function loadRaceMusicPreference() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(RACE_MUSIC_STORAGE_KEY) === "true";
}

function createRaceAudioController() {
  return {
    start: async () => {},
    stop: () => {},
    setIntensity: () => {},
    cueBoost: () => {},
    cueSlowdown: () => {},
    dispose: () => {},
  };
}

function playFinalCountdownBeep(audioContextRef) {
  if (typeof window === "undefined") return;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!audioContextRef.current || audioContextRef.current.state === "closed") {
      audioContextRef.current = new AudioContextClass();
    }

    const context = audioContextRef.current;
    if (context.state === "suspended") {
      context.resume().catch(() => {});
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(920, now);
    oscillator.frequency.exponentialRampToValueAtTime(720, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);

    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.18);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch {
    // The race can continue silently if the browser blocks audio.
  }
}

export default function MathRacingLeague({ profile, onProfileChange, userPackage = "free", onBackToHub }) {
  const [selectedLeagueId, setSelectedLeagueId] = useState(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);
  const [selectedAiChallengeId, setSelectedAiChallengeId] = useState(DEFAULT_AI_CHALLENGE_ID);
  const [raceState, setRaceState] = useState(() => makeInitialRace());
  const [question, setQuestion] = useState(null);
  const [aiCars, setAiCars] = useState(() => makeInitialAiCars());
  const [feedback, setFeedback] = useState(null);
  const [result, setResult] = useState(null);
  const [useFallbackCanvas, setUseFallbackCanvas] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [coinGate, setCoinGate] = useState(null);
  const [coinMessage, setCoinMessage] = useState(null);
  const [paymentBusyPackId, setPaymentBusyPackId] = useState(null);
  const [pausedSnapshot, setPausedSnapshot] = useState(() => loadPausedRaceSnapshot());
  const [musicEnabled, setMusicEnabled] = useState(() => loadRaceMusicPreference());
  const [racePrep, setRacePrep] = useState({
    moduleReady: false,
    questionsReady: false,
    sceneReady: false,
    label: "Choose your league",
  });
  const lastFrameRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const questionTimerRef = useRef(null);
  const answerLockRef = useRef(false);
  const questionQueueRef = useRef([]);
  const currentQuestionRef = useRef(null);
  const raceAudioRef = useRef(null);
  const finalCountdownAudioRef = useRef(null);
  const finalCountdownSecondRef = useRef(null);
  const aiStepAccumulatorRef = useRef(0);
  const aiAnswerTimersRef = useRef([]);
  const fullAccess = hasFullGameAccess(userPackage);

  useEffect(() => {
    currentQuestionRef.current = question;
  }, [question]);

  const selectedLeague = useMemo(
    () => getLeagueById(selectedLeagueId),
    [selectedLeagueId]
  );

  const leaderboard = useMemo(() => {
    const raceTotalQuestions = raceState.totalQuestions || getRaceQuestionConfig(selectedDifficulty).totalQuestions;
    const playerAccuracy = getAccuracyScore(raceState.correct, raceTotalQuestions);
    const player = {
      ...makePlayerCar(),
      lane: raceState.lane,
      distanceTravelled: raceState.playerDistance,
      correctAnswers: raceState.correct,
      wrongAnswers: raceState.wrong || 0,
      unansweredAnswers: raceState.unanswered || 0,
      answered: raceTotalQuestions,
      totalQuestions: raceTotalQuestions,
      accuracyScore: playerAccuracy,
    };
    const racers = aiCars.map((car) => {
      const totalQuestions = car.totalQuestions || raceTotalQuestions;
      const accuracyScore = getAccuracyScore(car.correctAnswers || 0, totalQuestions);
      return {
        ...car,
        distanceTravelled: car.distanceTravelled,
        answered: totalQuestions,
        totalQuestions,
        accuracyScore,
      };
    });
    return [player, ...racers].sort((a, b) => b.distanceTravelled - a.distanceTravelled);
  }, [
    aiCars,
    raceState.correct,
    raceState.lane,
    raceState.playerDistance,
    raceState.totalQuestions,
    raceState.unanswered,
    raceState.wrong,
    selectedDifficulty,
  ]);

  const progressPercent = ((raceState.playerDistance % RACE_DISTANCE) / RACE_DISTANCE) * 100;
  const prepProgress = Math.min(
    100,
    (racePrep.moduleReady ? 28 : 8) +
      (racePrep.questionsReady ? 22 : 0) +
      (racePrep.sceneReady ? 50 : 0)
  );

  useEffect(() => {
    if (!selectedLeagueId || selectedDifficulty) return undefined;

    setRacePrep({
      moduleReady: false,
      questionsReady: false,
      sceneReady: false,
      label: "Preparing 3D race lobby",
    });

    const preload = () => {
      loadRace3DScene().then(() => {
        setRacePrep((current) => ({
          ...current,
          moduleReady: true,
          label: "3D race assets cached",
        }));
      });
    };
    const idleId = window.requestIdleCallback
      ? window.requestIdleCallback(preload, { timeout: 1200 })
      : window.setTimeout(preload, 300);

    return () => {
      if (window.cancelIdleCallback && typeof idleId === "number") {
        window.cancelIdleCallback(idleId);
      } else {
        window.clearTimeout(idleId);
      }
    };
  }, [selectedDifficulty, selectedLeagueId]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    window.localStorage.setItem(RACE_MUSIC_STORAGE_KEY, musicEnabled ? "true" : "false");
    return undefined;
  }, [musicEnabled]);

  useEffect(() => {
    return () => {
      raceAudioRef.current?.dispose();
      raceAudioRef.current = null;
      finalCountdownAudioRef.current?.close?.();
      finalCountdownAudioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audioActive =
      musicEnabled &&
      !isPaused &&
      !result &&
      ["preparing", "countdown", "racing"].includes(raceState.status);

    if (!audioActive) {
      raceAudioRef.current?.stop();
      return undefined;
    }

    if (!raceAudioRef.current) {
      raceAudioRef.current = createRaceAudioController();
    }

    raceAudioRef.current?.start().catch(() => {
      setMusicEnabled(false);
    });

    return undefined;
  }, [isPaused, musicEnabled, raceState.status, result]);

  useEffect(() => {
    raceAudioRef.current?.setIntensity(raceState.speed, raceState.boostLevel);
  }, [raceState.boostLevel, raceState.speed]);

  useEffect(() => {
    const countdownSecond = Math.ceil(raceState.timeLeft);
    const shouldBeep =
      raceState.status === "racing" &&
      !isPaused &&
      !result &&
      countdownSecond > 0 &&
      countdownSecond <= 10;

    if (!shouldBeep) {
      finalCountdownSecondRef.current = null;
      return undefined;
    }

    if (finalCountdownSecondRef.current !== countdownSecond) {
      finalCountdownSecondRef.current = countdownSecond;
      playFinalCountdownBeep(finalCountdownAudioRef);
    }

    return undefined;
  }, [isPaused, raceState.status, raceState.timeLeft, result]);

  const saveCurrentRace = useCallback(() => {
    if (!selectedLeagueId || !selectedDifficulty || result) return null;
    if (
      raceState.status !== "preparing" &&
      raceState.status !== "readying" &&
      raceState.status !== "countdown" &&
      raceState.status !== "racing"
    ) return null;

    const snapshot = {
      selectedLeagueId,
      selectedDifficulty,
      selectedAiChallengeId,
      raceState: {
        ...raceState,
        status: raceState.status === "preparing" || raceState.status === "readying" ? "countdown" : raceState.status,
      },
      aiCars,
      question,
    };

    savePausedRaceSnapshot(snapshot);
    setPausedSnapshot(snapshot);
    return snapshot;
  }, [aiCars, question, raceState, result, selectedAiChallengeId, selectedDifficulty, selectedLeagueId]);

  const resumePausedRace = () => {
    const snapshot = pausedSnapshot || loadPausedRaceSnapshot();
    if (!snapshot) return;
    const questionBatch = buildQuestionBatch(snapshot.selectedLeagueId, snapshot.selectedDifficulty);

    setSelectedLeagueId(snapshot.selectedLeagueId);
    setSelectedDifficulty(snapshot.selectedDifficulty);
    setSelectedAiChallengeId(snapshot.selectedAiChallengeId || DEFAULT_AI_CHALLENGE_ID);
    setRaceState({
      ...makeInitialRace("racing", snapshot.selectedDifficulty),
      ...snapshot.raceState,
    });
    setAiCars(snapshot.aiCars?.length ? snapshot.aiCars : makeInitialAiCars(snapshot.selectedDifficulty, snapshot.selectedAiChallengeId));
    setQuestion(snapshot.question || questionBatch[0]);
    questionQueueRef.current = questionBatch.slice(1);
    setFeedback(null);
    setResult(null);
    setIsPaused(true);
    setUseFallbackCanvas(false);
    setCoinGate(null);
    setCoinMessage(null);
    setRacePrep({
      moduleReady: true,
      questionsReady: true,
      sceneReady: true,
      label: "Paused race restored",
    });
    lastFrameRef.current = null;
    answerLockRef.current = false;
    aiStepAccumulatorRef.current = 0;
  };

  const discardPausedRace = () => {
    clearPausedRaceSnapshot();
    setPausedSnapshot(null);
  };

  const beginRace = (difficulty) => {
    clearPausedRaceSnapshot();
    setPausedSnapshot(null);
    clearAiAnswerTimers();
    const { totalQuestions } = getRaceQuestionConfig(difficulty);
    const questionBatch = buildQuestionBatch(selectedLeagueId, difficulty, totalQuestions);
    questionQueueRef.current = questionBatch.slice(1);
    setSelectedDifficulty(difficulty);
    setRaceState(makeInitialRace("preparing", difficulty));
    setAiCars(makeInitialAiCars(difficulty, selectedAiChallengeId));
    setQuestion(questionBatch[0]);
    setFeedback(null);
    setResult(null);
    setIsPaused(false);
    setUseFallbackCanvas(false);
    setCoinGate(null);
    setCoinMessage(null);
    setRacePrep((current) => ({
      moduleReady: current.moduleReady,
      questionsReady: true,
      sceneReady: false,
      label: current.moduleReady ? "Warming up 3D scene" : "Loading 3D race assets",
    }));
    lastFrameRef.current = null;
    answerLockRef.current = false;
    aiStepAccumulatorRef.current = 0;
  };

  const startRace = (difficulty) => {
    const entry = spendRaceEntryCoins(profile, selectedLeagueId, difficulty, userPackage);

    if (!entry.ok) {
      setCoinGate({
        difficulty,
        cost: entry.cost,
        shortage: entry.shortage,
      });
      setCoinMessage(`You need ${entry.cost} coins to enter ${selectedLeague.name} ${difficulty}.`);
      return;
    }

    if (entry.profile !== profile) {
      onProfileChange(entry.profile);
    }

    beginRace(difficulty);
  };

  const creditCoins = (coins, source, extra) => {
    const nextProfile = addGameCoins(profile, coins, source, extra);
    onProfileChange(nextProfile);
    return nextProfile;
  };

  const startCountdownWhenSceneReady = useCallback(() => {
    setRacePrep((prep) => ({
      ...prep,
      moduleReady: true,
      sceneReady: true,
      label: "Race ready",
    }));
    setRaceState((current) => {
      if (current.status !== "preparing" && current.status !== "readying") return current;
      lastFrameRef.current = null;
      return { ...current, status: "countdown", countdown: 5 };
    });
  }, []);

  const handleSceneError = useCallback(() => {
    setUseFallbackCanvas(true);
  }, []);

  const clearAiAnswerTimers = useCallback(() => {
    aiAnswerTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    aiAnswerTimersRef.current = [];
  }, []);

  const scheduleAiAnswersForQuestion = useCallback((questionDuration) => {
    const maxAnswerTime = Math.min(3, Math.max(1, questionDuration));
    AI_RACERS.forEach((racer) => {
      const answerTime = randomBetween(1, maxAnswerTime);
      const timerId = window.setTimeout(() => {
        setAiCars((currentAi) => currentAi.map((car) => (
          car.id === racer.id ? advanceAiAnswerCycle(car, questionDuration, answerTime) : car
        )));
        aiAnswerTimersRef.current = aiAnswerTimersRef.current.filter((id) => id !== timerId);
      }, answerTime * 1000);
      aiAnswerTimersRef.current.push(timerId);
    });
  }, []);

  const toggleRaceMusic = useCallback(() => {
    setMusicEnabled((current) => {
      const next = !current;
      if (next) {
        if (!raceAudioRef.current) {
          raceAudioRef.current = createRaceAudioController();
        }
        raceAudioRef.current?.start().catch(() => {
          setMusicEnabled(false);
        });
      } else {
        raceAudioRef.current?.stop();
      }
      return next;
    });
  }, []);

  const getNextPreparedQuestion = useCallback(() => questionQueueRef.current.shift() || null, []);

  const scheduleNextQuestion = useCallback(() => {
    if (questionTimerRef.current) {
      window.clearTimeout(questionTimerRef.current);
    }

    answerLockRef.current = true;
    questionTimerRef.current = window.setTimeout(() => {
      const nextQuestion = getNextPreparedQuestion();
      if (nextQuestion) {
        setQuestion(nextQuestion);
        scheduleAiAnswersForQuestion(raceState.questionDuration || getRaceQuestionConfig(selectedDifficulty).questionDuration);
      }
      answerLockRef.current = false;
      questionTimerRef.current = null;
    }, 80);
  }, [getNextPreparedQuestion, raceState.questionDuration, scheduleAiAnswersForQuestion, selectedDifficulty]);

  const buyCoinPack = async (pack) => {
    if (fullAccess || paymentBusyPackId) return;
    const publicKey = import.meta.env.VITE_FLUTTERWAVE_PUBLIC_KEY;

    if (!publicKey) {
      setCoinMessage("Coin pack checkout needs the Flutterwave public key before live payments can run.");
      return;
    }

    setPaymentBusyPackId(pack.id);
    setCoinMessage(null);

    try {
      await loadFlutterwaveInlineScript();
      window.FlutterwaveCheckout({
        public_key: publicKey,
        tx_ref: makeCoinPackTxRef(pack.id),
        amount: pack.amount,
        currency: "NGN",
        payment_options: "card,banktransfer,ussd",
        customer: {
          email: "parent@protutorshub.com",
          name: `${profile.name || "Pro Tutors Hub"} Parent`,
        },
        customizations: {
          title: "Pro Tutors Hub Coins",
          description: `${pack.coins} game coins`,
        },
        callback: async (response) => {
          try {
            if (response?.status !== "successful" && response?.status !== "completed") {
              setCoinMessage("Payment was not completed.");
              return;
            }

            const verification = await verifyFlutterwaveCoinPackPayment({
              transactionId: response.transaction_id,
              txRef: response.tx_ref,
              coinPackId: pack.id,
              expectedAmount: pack.amount,
              expectedCoins: pack.coins,
              currency: "NGN",
            });

            if (!verification?.ok) {
              throw new Error(verification?.message || "Payment could not be verified.");
            }

            creditCoins(verification.coins || pack.coins, "coin-pack", {
              packId: pack.id,
              label: pack.label,
              amount: pack.amount,
              txRef: response.tx_ref,
              transactionId: response.transaction_id,
              backendCoinBalance: verification.coinBalance,
            });
            setCoinMessage(`${pack.label} verified. +${verification.coins || pack.coins} coins added.`);
            setCoinGate(null);
          } catch (error) {
            setCoinMessage(error.message || "Payment could not be verified.");
          } finally {
            setPaymentBusyPackId(null);
          }
        },
        onclose: () => setPaymentBusyPackId(null),
      });
    } catch (error) {
      setPaymentBusyPackId(null);
      setCoinMessage(error.message || "Payment checkout could not start.");
    }
  };

  const finishRace = useCallback((finalRaceState, finalAiCars) => {
    clearAiAnswerTimers();
    const raceTotalQuestions = finalRaceState.totalQuestions || getRaceQuestionConfig(selectedDifficulty).totalQuestions;
    const playerAnswered = Math.max(1, raceTotalQuestions);
    const playerUnanswered = Math.max(0, playerAnswered - (finalRaceState.correct || 0) - (finalRaceState.wrong || 0));
    const playerMissed = (finalRaceState.wrong || 0) + playerUnanswered;
    const playerAccuracy = getAccuracyScore(finalRaceState.correct, playerAnswered);
    const playerAverageAnswerTime = (finalRaceState.totalAnswerTime || 0) / Math.max(1, finalRaceState.timedAnswers || 0);
    const raceDuration = raceTotalQuestions * (finalRaceState.questionDuration || getRaceQuestionConfig(selectedDifficulty).questionDuration);
    const playerFinalDistance = Math.round(finalRaceState.playerDistance || 0);
    const playerAverageSpeed = playerFinalDistance / Math.max(1, raceDuration);
    const finalLeaderboard = [
      {
        ...makePlayerCar(),
        lane: finalRaceState.lane,
        distanceTravelled: playerFinalDistance,
        correctAnswers: finalRaceState.correct,
        wrongAnswers: finalRaceState.wrong || 0,
        unansweredAnswers: playerUnanswered,
        answered: playerAnswered,
        totalQuestions: playerAnswered,
        accuracyScore: playerAccuracy,
        averageAnswerTime: playerAverageAnswerTime,
        averageSpeed: playerAverageSpeed,
      },
      ...finalAiCars.map((car) => {
        const answered = car.totalQuestions || raceTotalQuestions;
        const correctAnswers = Math.min(car.correctAnswers || 0, answered);
        const wrongAnswers = Math.min(car.wrongAnswers || 0, Math.max(0, answered - correctAnswers));
        const unansweredAnswers = Math.max(0, answered - correctAnswers - wrongAnswers);
        const accuracyScore = getAccuracyScore(correctAnswers, answered);
        const averageAnswerTime = (car.totalAnswerTime || 0) / Math.max(1, car.timedAnswers || 0);
        const distanceTravelled = Math.round(car.distanceTravelled || 0);
        const averageSpeed = distanceTravelled / Math.max(1, raceDuration);
        return {
          ...car,
          distanceTravelled,
          correctAnswers,
          wrongAnswers,
          answered,
          totalQuestions: answered,
          accuracyScore,
          unansweredAnswers,
          averageAnswerTime,
          averageSpeed,
        };
      }),
    ].sort((a, b) => {
      if (b.distanceTravelled !== a.distanceTravelled) return b.distanceTravelled - a.distanceTravelled;
      return b.accuracyScore - a.accuracyScore;
    });

    finalLeaderboard
      .filter((car) => !car.isPlayer)
      .forEach((car) => {
        console.debug("[MathRacingLeague AI final]", {
          name: car.name,
          correct: car.correctAnswers || 0,
          wrong: car.wrongAnswers || 0,
          unanswered: car.unansweredAnswers || 0,
          answered: car.answered || 0,
          finalAccuracy: car.accuracyScore,
          finalSpeed: Number((car.speed || 0).toFixed(2)),
          finalDistance: Math.round(car.distanceTravelled || 0),
          averageAnswerTime: Number((car.averageAnswerTime || 0).toFixed(2)),
          averageSpeed: Number((car.averageSpeed || 0).toFixed(2)),
        });
      });

    const finalPosition = finalLeaderboard.findIndex((car) => car.isPlayer) + 1;
    const finalAccuracy = playerAccuracy;

    const raceResult = {
      leagueId: selectedLeagueId,
      difficulty: selectedDifficulty,
      aiChallengeId: selectedAiChallengeId,
      aiChallengeLabel: getAiChallenge(selectedAiChallengeId).label,
      finalPosition,
      playerDistance: playerFinalDistance,
      score: finalRaceState.score,
      accuracy: finalAccuracy,
      averageAnswerTime: playerAverageAnswerTime,
      averageSpeed: playerAverageSpeed,
      bestStreak: finalRaceState.bestStreak,
      questionsAnswered: playerAnswered,
      correctAnswers: finalRaceState.correct,
      wrongAnswers: finalRaceState.wrong || 0,
      unansweredAnswers: playerUnanswered,
      missedAnswers: playerMissed,
      missedQuestions: finalRaceState.missedQuestions || [],
      leaderboard: finalLeaderboard,
    };

    const recorded = recordMathRacingResult(profile, raceResult);
    onProfileChange(recorded.profile);
    clearPausedRaceSnapshot();
    setPausedSnapshot(null);
    questionQueueRef.current = [];
    setResult({ ...raceResult, rewards: recorded.rewards, achievements: recorded.achievements });
    setRaceState((current) => ({ ...current, status: "finished" }));
  }, [clearAiAnswerTimers, onProfileChange, profile, selectedAiChallengeId, selectedDifficulty, selectedLeagueId]);

  const answerQuestion = useCallback((choice) => {
    if (isPaused || raceState.status !== "racing" || !question || answerLockRef.current) return;

    const isCorrect = String(choice) === String(question.answer);
    const totalQuestions = raceState.totalQuestions || getRaceQuestionConfig(selectedDifficulty).totalQuestions;
    const questionDuration = raceState.questionDuration || getRaceQuestionConfig(selectedDifficulty).questionDuration;
    const isFinalQuestion = raceState.answered + 1 >= totalQuestions;
    answerLockRef.current = true;
    setFeedback(isCorrect ? "correct" : "wrong");
    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }
    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback(null);
      feedbackTimerRef.current = null;
    }, 600);

    setRaceState((current) => {
      const streak = isCorrect ? current.streak + 1 : 0;
      const answered = current.answered + 1;
      const correct = current.correct + (isCorrect ? 1 : 0);
      const wrong = (current.wrong || 0) + (isCorrect ? 0 : 1);
      const answerDuration = current.questionDuration || questionDuration;
      const answerTimeLeft = current.questionTimeLeft;
      const answerTime = clamp(answerDuration - answerTimeLeft, 0, answerDuration);
      const totalAnswerTime = (current.totalAnswerTime || 0) + answerTime;
      const timedAnswers = (current.timedAnswers || 0) + 1;
      const missedAnswers = wrong + (current.unanswered || 0);
      const speed = getPerformanceSpeed(
        correct,
        missedAnswers,
        totalAnswerTime,
        timedAnswers,
        answerDuration,
        current.totalQuestions || totalQuestions,
        PLAYER_MIN_SPEED,
        PLAYER_MAX_SPEED
      );
      return {
        ...current,
        answered,
        correct,
        wrong,
        missedQuestions: isCorrect
          ? current.missedQuestions || []
          : [
              ...(current.missedQuestions || []),
              makeMissedQuestionReview(question, choice, answerTime, "wrong"),
            ].filter(Boolean),
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
        score: Math.max(0, current.score + (isCorrect ? 100 + streak * 12 : -20)),
        speed,
        boostLevel: isCorrect ? Math.min(3, current.boostLevel + 0.9) : 0,
        questionTimeLeft: answerDuration,
        totalAnswerTime,
        timedAnswers,
        status: answered >= (current.totalQuestions || totalQuestions) ? "finished" : current.status,
      };
    });

    if (!isFinalQuestion) {
      scheduleNextQuestion();
    }
  }, [
    isPaused,
    question,
    raceState.answered,
    raceState.questionDuration,
    raceState.status,
    raceState.totalQuestions,
    scheduleNextQuestion,
    selectedDifficulty,
  ]);

  useEffect(() => {
    return () => {
      clearAiAnswerTimers();
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      if (questionTimerRef.current) {
        window.clearTimeout(questionTimerRef.current);
      }
    };
  }, [clearAiAnswerTimers]);

  useEffect(() => {
    if (
      (raceState.status !== "countdown" && raceState.status !== "racing") ||
      result ||
      isPaused
    ) return undefined;

    let timerId = 0;
    const scheduleStep = () => {
      timerId = window.setTimeout(() => step(performance.now()), FRAME_STEP_SECONDS * 1000);
    };

    const step = (now) => {
      const last = lastFrameRef.current || now;
      const elapsed = Math.max(0, (now - last) / 1000);
      const delta = Math.min(MAX_FRAME_DELTA, elapsed);
      const timerDelta = Math.min(MAX_TIMER_DELTA, elapsed);
      lastFrameRef.current = now;

      if (raceState.status === "countdown") {
        setRaceState((current) => {
          if (current.status !== "countdown") return current;
          const countdown = Math.max(0, current.countdown - timerDelta);
          if (countdown <= 0) {
            lastFrameRef.current = null;
            scheduleAiAnswersForQuestion(current.questionDuration || getRaceQuestionConfig(selectedDifficulty).questionDuration);
            return { ...current, countdown: 0, status: "racing" };
          }
          return { ...current, countdown };
        });

        scheduleStep();
        return;
      }

      aiStepAccumulatorRef.current += delta;
      const aiStepDelta = aiStepAccumulatorRef.current;
      if (aiStepDelta >= AI_STATE_STEP_SECONDS) {
        aiStepAccumulatorRef.current = 0;
        setAiCars((currentAi) => {
          const nextAi = currentAi.map((car) => {
            const speed = clamp(car.speed, AI_MIN_SPEED, AI_MAX_SPEED);

            return {
              ...car,
              speed,
              distanceTravelled: Math.max(0, car.distanceTravelled + speed * aiStepDelta),
            };
          });
          return nextAi;
        });
      }

      setRaceState((current) => {
        if (current.status !== "racing") return current;

        const boostLevel = Math.max(0, current.boostLevel - delta * 1.8);
        const timeLeft = Math.max(0, current.timeLeft - timerDelta);
        let speed = clamp(current.speed, PLAYER_MIN_SPEED, PLAYER_MAX_SPEED);
        const playerDistance = Math.max(0, current.playerDistance + speed * delta);
        const questionTimeLeft = Math.max(0, current.questionTimeLeft - timerDelta);
        const questionDuration = current.questionDuration || getRaceQuestionConfig(selectedDifficulty).questionDuration;
        const totalQuestions = current.totalQuestions || getRaceQuestionConfig(selectedDifficulty).totalQuestions;
        const next = {
          ...current,
          boostLevel,
          speed,
          playerDistance,
          timeLeft,
          questionTimeLeft,
        };

        if (questionTimeLeft <= 0) {
          next.answered += 1;
          next.unanswered = (next.unanswered || 0) + 1;
          next.streak = 0;
          next.score = Math.max(0, next.score - 20);
          next.totalAnswerTime = (next.totalAnswerTime || 0) + questionDuration;
          next.timedAnswers = (next.timedAnswers || 0) + 1;
          next.missedQuestions = [
            ...(next.missedQuestions || []),
            makeMissedQuestionReview(currentQuestionRef.current, null, questionDuration, "missed"),
          ].filter(Boolean);
          speed = getPerformanceSpeed(
            next.correct,
            (next.wrong || 0) + (next.unanswered || 0),
            next.totalAnswerTime,
            next.timedAnswers,
            questionDuration,
            totalQuestions,
            PLAYER_MIN_SPEED,
            PLAYER_MAX_SPEED
          );
          next.speed = speed;
          next.questionTimeLeft = questionDuration;

          if (next.answered >= totalQuestions) {
            next.status = "finished";
          } else {
            const nextQuestion = getNextPreparedQuestion();
            if (nextQuestion) {
              setQuestion(nextQuestion);
              scheduleAiAnswersForQuestion(questionDuration);
            } else {
              next.status = "finished";
            }
          }
        }

        if (timeLeft <= 0) {
          next.status = "finished";
        }

        return next;
      });

      scheduleStep();
    };

    scheduleStep();
    return () => window.clearTimeout(timerId);
  }, [getNextPreparedQuestion, isPaused, raceState.status, result, scheduleAiAnswersForQuestion, selectedDifficulty, selectedLeagueId]);

  useEffect(() => {
    if (raceState.status !== "finished" || result || !selectedDifficulty) return;
    const timer = window.setTimeout(() => finishRace(raceState, aiCars), 0);
    return () => window.clearTimeout(timer);
  }, [aiCars, finishRace, raceState, result, selectedDifficulty]);

  useEffect(() => {
    if (!useFallbackCanvas || (raceState.status !== "preparing" && raceState.status !== "readying")) return undefined;
    const timer = window.setTimeout(startCountdownWhenSceneReady, 120);
    return () => window.clearTimeout(timer);
  }, [raceState.status, startCountdownWhenSceneReady, useFallbackCanvas]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key.toLowerCase() === "p" || event.key === " ") {
        event.preventDefault();
        const canToggle =
          raceState.status === "preparing" ||
          raceState.status === "readying" ||
          raceState.status === "countdown" ||
          raceState.status === "racing";
        if (!canToggle) return;
        if (isPaused) {
          lastFrameRef.current = null;
          setIsPaused(false);
        } else {
          saveCurrentRace();
          setIsPaused(true);
        }
        return;
      }

      if (isPaused || raceState.status !== "racing") return;

      if (event.key === "ArrowLeft") {
        setRaceState((current) => ({ ...current, lane: Math.max(0, current.lane - 1) }));
      }

      if (event.key === "ArrowRight") {
        setRaceState((current) => ({ ...current, lane: Math.min(2, current.lane + 1) }));
      }

      const choiceIndex = Number(event.key) - 1;
      if (choiceIndex >= 0 && choiceIndex < 3 && question?.choices?.[choiceIndex]) {
        answerQuestion(question.choices[choiceIndex]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [answerQuestion, isPaused, question, raceState.status, saveCurrentRace]);

  const moveLane = (direction) => {
    if (isPaused || raceState.status !== "racing") return;
    setRaceState((current) => ({
      ...current,
      lane: Math.max(0, Math.min(2, current.lane + direction)),
    }));
  };

  const togglePause = () => {
    if (
      raceState.status !== "readying" &&
      raceState.status !== "preparing" &&
      raceState.status !== "countdown" &&
      raceState.status !== "racing"
    ) return;
    if (isPaused) {
      lastFrameRef.current = null;
      setIsPaused(false);
      return;
    }
    saveCurrentRace();
    setIsPaused(true);
  };

  const exitToLeaguePicker = () => {
    clearAiAnswerTimers();
    if (
      raceState.status === "preparing" ||
      raceState.status === "readying" ||
      raceState.status === "countdown" ||
      raceState.status === "racing"
    ) {
      saveCurrentRace();
    }
    questionQueueRef.current = [];
    setSelectedLeagueId(null);
    setSelectedDifficulty(null);
    setResult(null);
    setIsPaused(false);
    setRaceState(makeInitialRace());
    setRacePrep({
      moduleReady: false,
      questionsReady: false,
      sceneReady: false,
      label: "Choose your league",
    });
  };

  const backToMenu = () => {
    clearAiAnswerTimers();
    questionQueueRef.current = [];
    setSelectedLeagueId(null);
    setSelectedDifficulty(null);
    setResult(null);
    setIsPaused(false);
    setRaceState(makeInitialRace());
    setRacePrep({
      moduleReady: false,
      questionsReady: false,
      sceneReady: false,
      label: "Choose your league",
    });
  };

  if (!selectedLeagueId) {
    return (
      <section className="mrl-menu">
        <button className="mrl-back" type="button" onClick={onBackToHub}>
          <ArrowLeft size={18} /> Back to Games
        </button>

        <div className="mrl-title-block">
          <span><Trophy size={18} /> Math Racing League</span>
          <h1>Pick your league</h1>
          <p>Win podium finishes to unlock higher leagues and build your racer profile.</p>
        </div>

        {pausedSnapshot && (
          <div className="mrl-resume-card">
            <div>
              <span>Paused race</span>
              <strong>
                {getLeagueById(pausedSnapshot.selectedLeagueId)?.name || "Math Racing League"} - {pausedSnapshot.selectedDifficulty}
              </strong>
              <p>{Math.round((((pausedSnapshot.raceState?.playerDistance || 0) % RACE_DISTANCE) / RACE_DISTANCE) * 100)}% current lap</p>
            </div>
            <div>
              <button type="button" onClick={resumePausedRace}><Play size={18} /> Resume</button>
              <button type="button" onClick={discardPausedRace}>Discard</button>
            </div>
          </div>
        )}

        <div className="mrl-league-grid">
          {LEAGUES.map((league) => {
            const unlocked = fullAccess || isLeagueUnlocked(profile, league.id);
            const progress = profile.progress?.[`${league.id}:Easy`];
            return (
              <button
                key={league.id}
                type="button"
                className="mrl-league-card"
                style={{ "--league-accent": league.accent }}
                disabled={!unlocked}
                onClick={() => setSelectedLeagueId(league.id)}
              >
                <span>{unlocked ? "Unlocked" : "Locked"}</span>
                <h2>{league.name}</h2>
                <p>{league.focus}</p>
                <strong>{progress ? `Best rank ${progress.bestRank}` : "New season"}</strong>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (!selectedDifficulty) {
    return (
      <section className="mrl-menu">
        <div className="mrl-menu-actions">
          <button className="mrl-back" type="button" onClick={backToMenu}>
            <ArrowLeft size={18} /> Leagues
          </button>
          <button className="mrl-back" type="button" onClick={exitToLeaguePicker}>
            Exit
          </button>
        </div>

        <div className="mrl-title-block">
          <span>{selectedLeague.name}</span>
          <h1>Choose difficulty</h1>
          <p>{selectedLeague.focus}</p>
        </div>

        <div className="mrl-coin-summary">
          <div>
            <span><WalletCards size={16} /> {profile.coins} coins</span>
            <strong>{fullAccess ? `${userPackage} plan: full game access` : "Free plan: coins are used to enter races"}</strong>
            <p>
              {fullAccess
                ? "No race entry cost and no extra coin purchase required."
                : "Ask a parent to buy a coin pack when race coins run low."}
            </p>
          </div>
          {!fullAccess && (
            <div className="mrl-free-access-tools">
              <div className="mrl-parent-pack-panel" aria-label="Parent coin packs">
                <div>
                  <span className="mrl-parent-pack-kicker">Parent packs</span>
                  <strong>Starter Pack is available for Free play</strong>
                  <p>Parents can top up the game wallet when race coins run low.</p>
                </div>

                <div className="mrl-coin-pack-grid">
                  {COIN_PACKS.map((pack) => (
                    <button
                      key={pack.id}
                      type="button"
                      onClick={() => buyCoinPack(pack)}
                      disabled={paymentBusyPackId === pack.id}
                    >
                      <strong>{pack.label}</strong>
                      <span>{pack.coins} coins</span>
                      <em>{formatCoinPackPrice(pack.amount)}</em>
                    </button>
                  ))}
                </div>
              </div>
              {coinMessage && <p className="mrl-coin-message">{coinMessage}</p>}
            </div>
          )}
        </div>

        <div className="mrl-ai-challenge-panel">
          <strong>Choose AI accuracy</strong>
          <div>
            {AI_CHALLENGES.map((challenge) => (
              <button
                key={challenge.id}
                type="button"
                className={selectedAiChallengeId === challenge.id ? "active" : ""}
                onClick={() => setSelectedAiChallengeId(challenge.id)}
              >
                <b>{challenge.label}</b>
                <span>{challenge.description}</span>
                <small>
                  Flash {formatPercentRange(challenge.ranges["ai-flash"])} | Speedster {formatPercentRange(challenge.ranges["ai-speedster"])}
                </small>
              </button>
            ))}
          </div>
        </div>

        <div className="mrl-difficulty-grid">
          {DIFFICULTIES.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className="mrl-difficulty-card"
              onClick={() => startRace(difficulty)}
            >
              <h2>{difficulty}</h2>
              <p>{difficulty === "Easy" ? "Steady pace" : difficulty === "Medium" ? "Sharper rivals" : "Championship speed"}</p>
              <strong>
                {fullAccess ? "Included" : `${getRaceEntryCost(selectedLeagueId, difficulty)} coins to race`}
              </strong>
            </button>
          ))}
        </div>

        {coinGate && (
          <div className="mrl-coin-modal" role="dialog" aria-modal="true" aria-labelledby="mrl-coin-title">
            <div className="mrl-coin-card">
              <button
                className="mrl-coin-close"
                type="button"
                aria-label="Close coin options"
                onClick={() => setCoinGate(null)}
              >
                x
              </button>
              <span className="games-eyebrow"><WalletCards size={18} /> Coins needed</span>
              <h2 id="mrl-coin-title">{coinGate.difficulty} costs {coinGate.cost} coins</h2>
              <p>You are short by {coinGate.shortage} coins. Ask a parent for a coin pack to continue.</p>

              <div className="mrl-coin-pack-grid">
                {COIN_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => buyCoinPack(pack)}
                    disabled={paymentBusyPackId === pack.id}
                  >
                    <strong>{pack.label}</strong>
                    <span>{pack.coins} coins</span>
                    <em>{formatCoinPackPrice(pack.amount)}</em>
                  </button>
                ))}
              </div>

              {coinMessage && <p className="mrl-coin-message">{coinMessage}</p>}
            </div>
          </div>
        )}

      </section>
    );
  }

  if (result) {
    return (
      <section className="mrl-results">
        <div className="mrl-results-card">
          <span className="games-eyebrow"><Trophy size={18} /> Race complete</span>
          <h1>{result.finalPosition === 1 ? "You won" : `Position ${formatOrdinal(result.finalPosition)}`}</h1>
          <p className="mrl-result-context">AI accuracy: {result.aiChallengeLabel || getAiChallenge(result.aiChallengeId).label}</p>
          <div className="mrl-results-grid">
            <div><span>Score</span><strong>{result.score}</strong></div>
            <div><span>Correct</span><strong>{result.correctAnswers}</strong></div>
            <div><span>Accuracy</span><strong>{result.accuracy}%</strong></div>
            <div><span>Avg time</span><strong>{(result.averageAnswerTime || 0).toFixed(1)}s</strong></div>
            <div><span>Avg speed</span><strong>{(result.averageSpeed || 0).toFixed(1)} m/s</strong></div>
            <div><span>Distance</span><strong>{Math.round(result.playerDistance)}m</strong></div>
          </div>

          <div className="mrl-results-grid">
            <div><span>XP</span><strong>+{result.rewards.xpEarned}</strong></div>
            <div><span>Coins</span><strong>+{result.rewards.coinsEarned}</strong></div>
            <div><span>Gems</span><strong>+{result.rewards.gemsEarned}</strong></div>
            <div><span>Best streak</span><strong>{result.bestStreak}</strong></div>
            <div><span>Missed</span><strong>{result.missedAnswers ?? ((result.wrongAnswers || 0) + (result.unansweredAnswers || 0))}</strong></div>
          </div>

          {result.achievements.length > 0 && (
            <div className="mrl-achievements">
              {result.achievements.map((achievement) => (
                <span key={achievement.id}><Trophy size={16} /> {achievement.label}</span>
              ))}
            </div>
          )}

          <div className="mrl-final-standings">
            <strong>Final positions</strong>
            {result.leaderboard.map((car, index) => (
              <span key={car.id} className={car.isPlayer ? "player" : ""}>
                <b>{formatOrdinal(index + 1)}</b>
                <em>{car.name}</em>
                <small>{car.correctAnswers || 0} correct</small>
                <small>{(car.wrongAnswers || 0) + (car.unansweredAnswers || 0)} missed</small>
                <small>{car.answered || 0} total</small>
                <small>{car.accuracyScore || 0}%</small>
                <small>{(car.averageAnswerTime || 0).toFixed(1)}s avg</small>
                <small>{(car.averageSpeed || 0).toFixed(1)} m/s</small>
                <small>{Math.round(car.distanceTravelled)}m</small>
              </span>
            ))}
          </div>

          {result.missedQuestions?.length > 0 && (
            <div className="mrl-missed-review">
              <strong>Questions to review</strong>
              {result.missedQuestions.map((item, index) => (
                <article key={item.id || `${item.prompt}-${index}`}>
                  <b>{index + 1}. {item.prompt}</b>
                  <div>
                    <span>Your answer: {item.userAnswer}</span>
                    <span>Correct answer: {item.correctAnswer}</span>
                    <span>{item.reason === "missed" ? "Missed" : "Wrong answer"} in {(item.answerTime || 0).toFixed(1)}s</span>
                  </div>
                  <p>{item.logic}</p>
                </article>
              ))}
            </div>
          )}

          <div className="mrl-result-actions">
            <button type="button" onClick={() => startRace(selectedDifficulty)}>Race again</button>
            <button type="button" onClick={() => setSelectedDifficulty(null)}>Change difficulty</button>
            <button type="button" onClick={backToMenu}>Leagues</button>
            <button type="button" onClick={exitToLeaguePicker}>Exit</button>
          </div>
        </div>
      </section>
    );
  }

  const preRaceLobby = raceState.status === "preparing" && (
    <div className="mrl-pre-race-lobby">
      <span className="games-eyebrow"><Trophy size={18} /> Race lobby</span>
      <strong>Preparing 3D race</strong>
      <p>{racePrep.label}</p>
      <div className="mrl-prep-meter" aria-label="Race preparation progress">
        <span style={{ width: `${prepProgress}%` }} />
      </div>
      <em>{prepProgress}% ready</em>
    </div>
  );

  return (
    <section className={`mrl-race-screen feedback-${feedback || "idle"}`}>
      {useFallbackCanvas ? (
        <RaceCanvas
          league={selectedLeague}
          raceState={raceState}
          leaderboard={leaderboard}
          feedback={feedback}
        />
      ) : (
        <Suspense fallback={<RaceCanvas league={selectedLeague} raceState={raceState} leaderboard={leaderboard} feedback={feedback} />}>
          <Race3DScene
            league={selectedLeague}
            raceState={raceState}
            leaderboard={leaderboard}
            onSceneReady={startCountdownWhenSceneReady}
            onSceneError={handleSceneError}
          />
        </Suspense>
      )}

      <div className="mrl-hud">
        <div className="mrl-stat mrl-top-left">
          <strong>{selectedLeague.name}</strong>
          <span>{selectedDifficulty}</span>
          <em>Orbit Lap</em>
          <b>{Math.round(progressPercent)}%</b>
          <i><small style={{ width: `${progressPercent}%` }} /></i>
        </div>

        <div className="mrl-wallet">
          <span><WalletCards size={16} /> {profile.coins}</span>
          <span><Gem size={16} /> {profile.gems}</span>
          <span><Star size={16} /> {profile.xp}</span>
        </div>

        <div className="mrl-race-clock">{formatClock(raceState.timeLeft)}</div>

        {question && raceState.status === "racing" && (
          <div className="mrl-question-panel">
            <span className="mrl-question-timer">{Math.ceil(raceState.questionTimeLeft)}s</span>
            <strong>{question.prompt}</strong>
            <div>
              {question.choices.map((choice, index) => (
                <button key={choice} type="button" onClick={() => answerQuestion(choice)} disabled={isPaused}>
                  {index + 1}. {choice}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mrl-live-board">
          <strong>Live board</strong>
          {leaderboard.map((car, index) => (
            <span key={car.id} className={car.isPlayer ? "player" : ""}>
              <b>{index + 1}</b> {car.name} <small>{Math.round((car.isPlayer ? raceState.speed : car.speed) * 10)}</small>
            </span>
          ))}
        </div>

        <div className="mrl-speedometer">
          <strong>{Math.round(raceState.speed * 10)}</strong>
          <span>km/h</span>
          <meter min="0" max={PLAYER_MAX_SPEED} value={raceState.speed} />
        </div>

        <div className="mrl-touch-controls">
          <button type="button" aria-label="Move left" onClick={() => moveLane(-1)}>‹</button>
          <button type="button" aria-label="Move right" onClick={() => moveLane(1)}>›</button>
        </div>

        <button className="mrl-pause-race" type="button" onClick={togglePause}>
          {isPaused ? <Play size={18} /> : <Pause size={18} />}
          {isPaused ? "Resume" : "Pause"}
        </button>

        {preRaceLobby}

        {(raceState.status === "readying" || raceState.status === "countdown") && (
          <div className="mrl-countdown">
            {raceState.status === "readying" ? "Get Ready" : Math.ceil(raceState.countdown)}
          </div>
        )}

        {raceState.status === "racing" && raceState.timeLeft <= 10 && (
          <div className="mrl-final-warning" role="status" aria-live="polite">
            <strong>{Math.ceil(raceState.timeLeft)}</strong>
            <span>seconds left</span>
          </div>
        )}

        {isPaused && (
          <div className="mrl-pause-overlay">
            <strong>Paused</strong>
            <button type="button" onClick={togglePause}><Play size={18} /> Resume</button>
            <button type="button" onClick={exitToLeaguePicker}><ArrowLeft size={18} /> Exit</button>
          </div>
        )}

        {raceState.boostLevel > 1.5 && (
          <div className="mrl-boost-banner">Nitro boost</div>
        )}

        {(feedback === "correct" || feedback === "wrong") && (
          <div className={`mrl-answer-toast ${feedback}`}>
            {feedback === "correct" ? "Correct" : "Wrong answer"}
          </div>
        )}

        <button className="mrl-exit-race" type="button" onClick={exitToLeaguePicker}>
          <ArrowLeft size={18} /> Exit
        </button>
      </div>
    </section>
  );
}
