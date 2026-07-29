import { ArrowLeft, CheckCircle2, ChefHat, Clock3, Heart, RotateCcw, Sparkles, Star, Trophy, Utensils, Zap } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import "./fraction-slice.css";

const SLICE_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12];
const ROUND_SECONDS = 75;
const ORDER_PATIENCE = 24;
const ORDER_COUNT = 6;
const servingAnimationConfig = {
  toPlate: 300,
  platePause: 180,
  customerReach: 220,
  toHand: 300,
  handHold: 180,
  receiveFood: 280,
  celebration: 350,
  nextOrder: 200,
  stagger: 48,
};

const CUSTOMERS = [
  {
    name: "Tomi",
    asset: "/assets/fraction-slice/customers/customer-boy-yellow.png",
  },
  {
    name: "Ava",
    asset: "/assets/fraction-slice/customers/customer-girl-pink.png",
  },
  {
    name: "Leo",
    asset: "/assets/fraction-slice/customers/customer-boy-blue.png",
  },
];

const QUESTIONS = [
  {
    food: "pizza",
    title: "Pizza Party",
    prompt: "Show one half of the pizza.",
    numerator: 1,
    denominator: 2,
    hint: "Half means 1 out of 2 equal parts.",
    level: "Basic 1",
  },
  {
    food: "cake",
    title: "Birthday Cake",
    prompt: "Show three quarters of the cake.",
    numerator: 3,
    denominator: 4,
    hint: "Quarters are 4 equal parts. Select 3.",
    level: "Basic 2",
  },
  {
    food: "watermelon",
    title: "Watermelon Slice",
    prompt: "Show two thirds of the watermelon.",
    numerator: 2,
    denominator: 3,
    hint: "Thirds are 3 equal parts. Select 2.",
    level: "Basic 3",
  },
  {
    food: "chocolate",
    title: "Chocolate Bar",
    prompt: "Show five eighths of the chocolate.",
    numerator: 5,
    denominator: 8,
    hint: "Eighths are 8 equal pieces. Select 5.",
    level: "Basic 4",
  },
  {
    food: "banana",
    title: "Banana Snack",
    prompt: "Serve three fifths of the banana.",
    numerator: 3,
    denominator: 5,
    hint: "Fifths are 5 equal pieces. Serve 3.",
    level: "Basic 5",
  },
  {
    food: "orange",
    title: "Orange Segments",
    prompt: "Show seven tenths of the orange.",
    numerator: 7,
    denominator: 10,
    hint: "Tenths are 10 equal parts. Select 7.",
    level: "Basic 6",
  },
];

const FOOD_STYLE = {
  pizza: {
    base: "#f7bd55",
    crust: "#c97832",
    selected: "#ef4444",
    accent: "#fee2e2",
    label: "Whole Pizza",
    shape: "round",
    asset: "/assets/fraction-slice/foods/pizza.png",
  },
  cake: {
    base: "#f9a8d4",
    crust: "#7c2d12",
    selected: "#f472b6",
    accent: "#fff1f2",
    label: "Whole Cake",
    shape: "round",
    asset: "/assets/fraction-slice/foods/cake.png",
  },
  watermelon: {
    base: "#ef4444",
    crust: "#16a34a",
    selected: "#22c55e",
    accent: "#111827",
    label: "Whole Watermelon",
    shape: "round",
    asset: "/assets/fraction-slice/foods/watermelon.png",
  },
  chocolate: {
    base: "#7b3518",
    crust: "#3f1b0c",
    selected: "#f8e2bc",
    accent: "#fed7aa",
    label: "Chocolate Bar",
    shape: "bar",
    asset: "/assets/fraction-slice/foods/chocolate.png",
  },
  banana: {
    base: "#facc15",
    crust: "#b45309",
    selected: "#fde68a",
    accent: "#fff7ad",
    label: "Whole Banana",
    shape: "banana",
    asset: "/assets/fraction-slice/foods/banana.png",
  },
  pie: {
    base: "#fbbf24",
    crust: "#92400e",
    selected: "#84cc16",
    accent: "#fff7ed",
    label: "Whole Apple Pie",
    shape: "round",
    asset: "/assets/fraction-slice/foods/apple-pie.png",
  },
  orange: {
    base: "#fb923c",
    crust: "#f97316",
    selected: "#facc15",
    accent: "#fff7ed",
    label: "Whole Orange",
    shape: "round",
    asset: "/assets/fraction-slice/foods/orange.png",
  },
};

const FRACTION_PHRASES = {
  "1/2": "one half",
  "1/3": "one third",
  "2/3": "two thirds",
  "1/4": "one quarter",
  "2/4": "two quarters",
  "3/4": "three quarters",
  "1/5": "one fifth",
  "2/5": "two fifths",
  "3/5": "three fifths",
  "4/5": "four fifths",
  "1/6": "one sixth",
  "2/6": "two sixths",
  "3/6": "three sixths",
  "4/6": "four sixths",
  "5/6": "five sixths",
  "1/8": "one eighth",
  "2/8": "two eighths",
  "3/8": "three eighths",
  "4/8": "four eighths",
  "5/8": "five eighths",
  "6/8": "six eighths",
  "7/8": "seven eighths",
  "1/10": "one tenth",
  "2/10": "two tenths",
  "3/10": "three tenths",
  "4/10": "four tenths",
  "5/10": "five tenths",
  "6/10": "six tenths",
  "7/10": "seven tenths",
  "8/10": "eight tenths",
  "9/10": "nine tenths",
  "1/12": "one twelfth",
  "2/12": "two twelfths",
  "3/12": "three twelfths",
  "4/12": "four twelfths",
  "5/12": "five twelfths",
  "6/12": "six twelfths",
  "7/12": "seven twelfths",
  "8/12": "eight twelfths",
  "9/12": "nine twelfths",
  "10/12": "ten twelfths",
  "11/12": "eleven twelfths",
};

const initialStats = {
  score: 0,
  coins: 0,
  stars: 0,
  streak: 0,
  answered: 0,
  served: 0,
  misses: 0,
  bestStreak: 0,
};

function isLocalFractionSlicePreview() {
  if (typeof window === "undefined") return false;
  const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  if (!isLocalHost) return false;
  const searchParams = new URLSearchParams(window.location.search);
  return searchParams.has("fraction-slice-serving") || searchParams.has("fraction-slice");
}

function formatFraction(numerator, denominator) {
  return `${numerator}/${denominator}`;
}

function getFractionPhrase(numerator, denominator) {
  return FRACTION_PHRASES[formatFraction(numerator, denominator)] || `${numerator} out of ${denominator}`;
}

function getFoodName(food) {
  return FOOD_STYLE[food].label.replace("Whole ", "").toLowerCase();
}

function createRandomOrder(index, previousFood = "") {
  const foodKeys = Object.keys(FOOD_STYLE);
  const denominator = SLICE_OPTIONS[Math.floor(Math.random() * SLICE_OPTIONS.length)];
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;
  const foodPool = foodKeys.filter((food) => food !== previousFood);
  const food = foodPool[Math.floor(Math.random() * foodPool.length)] || foodKeys[0];
  const fractionPhrase = getFractionPhrase(numerator, denominator);

  return {
    food,
    title: `${FOOD_STYLE[food].label.replace("Whole ", "")} Order`,
    prompt: `Show ${fractionPhrase} of the treat.`,
    numerator,
    denominator,
    hint: `${fractionPhrase} means ${numerator} out of ${denominator} equal parts.`,
    level: `Order ${index + 1}`,
    fractionPhrase,
  };
}

function createRandomOrders() {
  const orders = [];
  for (let index = 0; index < ORDER_COUNT; index += 1) {
    const previousFood = orders[index - 1]?.food || "";
    orders.push(createRandomOrder(index, previousFood));
  }
  return orders;
}

function getSlicePath(index, total) {
  const startAngle = (index / total) * Math.PI * 2 - Math.PI / 2;
  const endAngle = ((index + 1) / total) * Math.PI * 2 - Math.PI / 2;
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  const radius = 46;
  const startX = 50 + Math.cos(startAngle) * radius;
  const startY = 50 + Math.sin(startAngle) * radius;
  const endX = 50 + Math.cos(endAngle) * radius;
  const endY = 50 + Math.sin(endAngle) * radius;

  return `M 50 50 L ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
}

function getSliceOffset(index, total, selected = false) {
  const middleAngle = ((index + 0.5) / total) * Math.PI * 2 - Math.PI / 2;
  const distance = selected ? 4.3 : 1.25;
  return {
    x: Math.cos(middleAngle) * distance,
    y: Math.sin(middleAngle) * distance,
  };
}

function getPieceId(food, sliceIndex) {
  return `${food}-piece-${sliceIndex}`;
}

function getRelativeCenter(element, container, fallback = { x: 0, y: 0 }) {
  if (!element || !container) return fallback;
  const elementBounds = element.getBoundingClientRect();
  const containerBounds = container.getBoundingClientRect();
  return {
    x: elementBounds.left - containerBounds.left + elementBounds.width / 2,
    y: elementBounds.top - containerBounds.top + elementBounds.height / 2,
  };
}

function getPlateOffset(index, total) {
  if (total <= 1) return { x: 0, y: 0 };
  if (total === 2) return { x: index === 0 ? -24 : 24, y: 0 };
  const angle = -40 + (80 / Math.max(1, total - 1)) * index;
  return {
    x: Math.sin((angle * Math.PI) / 180) * 36,
    y: -Math.cos((angle * Math.PI) / 180) * 10 + Math.abs(index - (total - 1) / 2) * 5,
  };
}

function FoodPiecePreview({ piece }) {
  const style = FOOD_STYLE[piece.foodType];
  const clipId = `fs-moving-${piece.id}`;
  const isRound = style.shape === "round";
  const isBar = style.shape === "bar";
  const isBanana = style.shape === "banana";
  const barWidth = 76 / piece.denominator;
  const bananaWidth = 64 / piece.denominator;
  const bananaX = 18 + piece.sliceIndex * bananaWidth;
  const bananaPath = `M ${bananaX} ${38 + (piece.sliceIndex % 2)} C ${bananaX + bananaWidth * 0.35} 51, ${bananaX + bananaWidth * 0.7} 54, ${bananaX + bananaWidth} 40 L ${bananaX + bananaWidth - 2} 56 C ${bananaX + bananaWidth * 0.55} 64, ${bananaX + 3} 60, ${bananaX} 43 Z`;

  return (
    <svg viewBox="0 0 100 100" className="fs-moving-piece-svg" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          {isRound ? <path d={getSlicePath(piece.sliceIndex, piece.denominator)} /> : null}
          {isBar ? <rect x={12 + piece.sliceIndex * barWidth} y="26" width={barWidth} height="48" rx="2.2" /> : null}
          {isBanana ? <path d={bananaPath} /> : null}
        </clipPath>
      </defs>
      <image href={style.asset} x={isBanana ? 3 : isBar ? 15 : 1} y={isBanana ? 12 : isBar ? 8 : 1} width={isBanana ? 94 : isBar ? 70 : 98} height={isBanana ? 76 : isBar ? 84 : 98} preserveAspectRatio="xMidYMid meet" clipPath={`url(#${clipId})`} />
      {isRound ? <path d={getSlicePath(piece.sliceIndex, piece.denominator)} fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.92)" strokeWidth="1.35" /> : null}
      {isBar ? <rect x={12 + piece.sliceIndex * barWidth} y="26" width={barWidth} height="48" rx="2.2" fill="rgba(255,255,255,0.01)" stroke="rgba(255,244,214,0.9)" strokeWidth="1" /> : null}
      {isBanana ? <path d={bananaPath} fill="rgba(255,255,255,0.01)" stroke="rgba(255,255,255,0.9)" strokeWidth="1" /> : null}
    </svg>
  );
}

function ServingAnimationLayer({ pieces, servingState }) {
  if (!pieces.length) return null;

  return (
    <div className="fs-serving-animation-layer" aria-hidden="true">
      {pieces.map((piece) => {
        const target = servingState === "receiving"
          ? piece.mouth
          : servingState === "movingToHand" || servingState === "onHand"
            ? piece.hand
            : piece.plate;
        const isReceiving = servingState === "receiving";

        return (
          <motion.div
            key={piece.id}
            className={`fs-moving-serving-piece fs-moving-${piece.foodType}`}
            initial={{
              x: piece.from.x,
              y: piece.from.y,
              scale: 1,
              rotate: piece.rotation,
              opacity: 1,
            }}
            animate={{
              x: target.x,
              y: target.y,
              scale: isReceiving ? 0.18 : piece.scale,
              rotate: servingState === "movingToHand" ? piece.rotation * 0.35 : piece.rotation,
              opacity: isReceiving ? 0 : 1,
            }}
            transition={{
              duration: (servingState === "receiving"
                ? servingAnimationConfig.receiveFood
                : servingState === "movingToHand"
                  ? servingAnimationConfig.toHand
                  : servingAnimationConfig.toPlate) / 1000,
              delay: servingState === "receiving" ? 0 : piece.delay / 1000,
              ease: [0.2, 0.86, 0.25, 1],
            }}
          >
            <FoodPiecePreview piece={piece} />
          </motion.div>
        );
      })}
    </div>
  );
}

function FoodDetails({ food, style, isCut }) {
  if (food === "pizza") {
    return (
      <>
        <circle cx="50" cy="50" r="34" fill="#f97316" opacity="0.18" />
        {[24, 36, 48, 61, 73, 31, 68].map((x, index) => (
          <circle key={x} cx={x} cy={29 + (index % 4) * 13} r="3.4" fill="#dc2626" stroke="#991b1b" strokeWidth="0.6" opacity="0.9" />
        ))}
        {[31, 42, 60, 72, 54].map((x, index) => (
          <path key={`leaf-${x}`} d={`M ${x} ${58 - index * 7} c 3 -4 8 -3 9 1 c -4 4 -7 5 -9 -1`} fill="#65a30d" opacity="0.86" />
        ))}
        {[25, 49, 75, 38, 63].map((x, index) => (
          <circle key={`cheese-${x}`} cx={x} cy={42 + (index % 3) * 13} r="1.4" fill="#fbbf24" opacity="0.72" />
        ))}
      </>
    );
  }

  if (food === "watermelon") {
    return (
      <>
        <circle cx="50" cy="50" r="35" fill="#ef4444" opacity={isCut ? "0.22" : "0.9"} />
        {[24, 34, 45, 56, 67, 77, 39, 61].map((x, index) => (
          <ellipse key={x} cx={x} cy={34 + (index % 4) * 10} rx="1.2" ry="2.4" fill={style.accent} opacity="0.75" transform={`rotate(${index * 24} ${x} ${34 + (index % 4) * 10})`} />
        ))}
        <circle cx="50" cy="50" r="42" fill="none" stroke="#15803d" strokeWidth="5" opacity="0.65" />
      </>
    );
  }

  if (food === "cake") {
    return (
      <>
        <circle cx="50" cy="50" r="32" fill="#fff1f2" opacity="0.38" />
        {[28, 39, 50, 61, 72].map((x, index) => (
          <circle key={x} cx={x} cy={35 + (index % 2) * 26} r="3.2" fill="#be123c" stroke="#fff1f2" strokeWidth="1" opacity="0.9" />
        ))}
        {[34, 45, 57, 69].map((x, index) => (
          <rect key={`sprinkle-${x}`} x={x} y={44 + (index % 2) * 9} width="8" height="2" rx="1" fill={index % 2 ? "#facc15" : "#38bdf8"} transform={`rotate(${index * 28} ${x} ${44 + (index % 2) * 9})`} />
        ))}
      </>
    );
  }

  if (food === "pie") {
    return (
      <>
        <path d="M24 42 C38 30 61 30 76 42" fill="none" stroke="#92400e" strokeWidth="3" opacity="0.58" />
        <path d="M28 59 C42 46 59 46 72 59" fill="none" stroke="#92400e" strokeWidth="3" opacity="0.46" />
      </>
    );
  }

  if (food === "orange") {
    return (
      <>
        {[0, 1, 2, 3, 4, 5].map((index) => (
          <line key={index} x1="50" y1="50" x2={50 + Math.cos((index / 6) * Math.PI * 2) * 28} y2={50 + Math.sin((index / 6) * Math.PI * 2) * 28} stroke="#fff7ed" strokeWidth="1.6" opacity="0.45" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
          <path key={`pulp-${index}`} d={`M50 50 C ${42 + index * 2} ${30 + (index % 3) * 10}, ${62 - index} ${30 + (index % 4) * 9}, ${50 + Math.cos(index) * 28} ${50 + Math.sin(index) * 28}`} fill="none" stroke="#fed7aa" strokeWidth="0.9" opacity="0.38" />
        ))}
        <circle cx="50" cy="50" r="7" fill="#fed7aa" opacity="0.65" />
      </>
    );
  }

  return null;
}

function BarFood({ food, style, sliceCount, selectedSlices, hiddenSlices = [], onPiecePointerDown, isCut }) {
  const pieceWidth = 76 / sliceCount;

  if (!isCut) {
    return (
      <>
        <image href={style.asset} x="15" y="8" width="70" height="84" preserveAspectRatio="xMidYMid meet" />
        <text x="50" y="83" textAnchor="middle" className="fs-svg-label">tap a cut number</text>
      </>
    );
  }

  return (
    <>
      <defs>
        {Array.from({ length: sliceCount }, (_, index) => (
          <clipPath key={index} id={`chocolate-piece-${sliceCount}-${index}`}>
            <rect x={12 + index * pieceWidth} y="26" width={pieceWidth} height="48" rx="2.2" />
          </clipPath>
        ))}
      </defs>
      {Array.from({ length: sliceCount }, (_, index) => {
        const selected = selectedSlices.includes(index);
        const hidden = hiddenSlices.includes(index);
        const offset = selected ? -3.2 : (index - (sliceCount - 1) / 2) * 0.22;
        return (
          <g
            key={index}
            data-fs-piece-id={getPieceId(food, index)}
            transform={`translate(0 ${offset})`}
            className={`${selected ? "fs-piece-selected" : ""} ${hidden ? "fs-piece-hidden" : ""}`}
            onPointerDown={(event) => onPiecePointerDown(index, event)}
          >
            <image href={style.asset} x="15" y="8" width="70" height="84" preserveAspectRatio="xMidYMid meet" clipPath={`url(#chocolate-piece-${sliceCount}-${index})`} />
            <rect
              x={12 + index * pieceWidth}
              y="26"
              width={pieceWidth}
              height="48"
              rx="2.2"
              fill={selected ? "#fffdf7" : "rgba(255,255,255,0.01)"}
              stroke={selected ? "rgba(255,255,255,0.98)" : "rgba(255,244,214,0.88)"}
              strokeWidth={selected ? "2" : "0.85"}
            />
          </g>
        );
      })}
    </>
  );
}

function BananaFood({ food, style, sliceCount, selectedSlices, hiddenSlices = [], onPiecePointerDown, isCut }) {
  const segmentWidth = 64 / sliceCount;

  if (!isCut) {
    return (
      <>
        <image href={style.asset} x="3" y="12" width="94" height="76" preserveAspectRatio="xMidYMid meet" />
        <text x="50" y="82" textAnchor="middle" className="fs-svg-label">whole banana</text>
      </>
    );
  }

  return (
    <>
      <defs>
        {Array.from({ length: sliceCount }, (_, index) => {
          const x = 18 + index * segmentWidth;
          return (
            <clipPath key={index} id={`banana-piece-${sliceCount}-${index}`}>
              <path d={`M ${x} ${38 + (index % 2)} C ${x + segmentWidth * 0.35} ${51}, ${x + segmentWidth * 0.7} ${54}, ${x + segmentWidth} ${40} L ${x + segmentWidth - 2} ${56} C ${x + segmentWidth * 0.55} ${64}, ${x + 3} ${60}, ${x} ${43} Z`} />
            </clipPath>
          );
        })}
      </defs>
      {Array.from({ length: sliceCount }, (_, index) => {
        const selected = selectedSlices.includes(index);
        const hidden = hiddenSlices.includes(index);
        const x = 18 + index * segmentWidth;
        const offset = selected ? -3.4 : (index - (sliceCount - 1) / 2) * 0.18;
        const piecePath = `M ${x} ${38 + (index % 2)} C ${x + segmentWidth * 0.35} ${51}, ${x + segmentWidth * 0.7} ${54}, ${x + segmentWidth} ${40} L ${x + segmentWidth - 2} ${56} C ${x + segmentWidth * 0.55} ${64}, ${x + 3} ${60}, ${x} ${43} Z`;
        return (
          <g
            key={index}
            data-fs-piece-id={getPieceId(food, index)}
            transform={`translate(0 ${offset})`}
            className={`${selected ? "fs-piece-selected" : ""} ${hidden ? "fs-piece-hidden" : ""}`}
            onPointerDown={(event) => onPiecePointerDown(index, event)}
          >
            <image href={style.asset} x="3" y="12" width="94" height="76" preserveAspectRatio="xMidYMid meet" clipPath={`url(#banana-piece-${sliceCount}-${index})`} />
            <path
              d={piecePath}
              fill={selected ? "#fffdf7" : "rgba(255,255,255,0.02)"}
              stroke={selected ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.86)"}
              strokeWidth={selected ? "2" : "0.9"}
            />
          </g>
        );
      })}
    </>
  );
}

function SliceBoard({ question, sliceCount, selectedSlices, hiddenSlices = [], onPiecePointerDown, isCut }) {
  if (!question?.food) {
    return (
      <div className="fs-board fs-empty-board is-whole">
        <div className="fs-plate">
          <div className="fs-empty-main-plate">Pick food</div>
        </div>
        <div className="fs-board-shadow" />
      </div>
    );
  }

  const style = FOOD_STYLE[question.food];
  const isBar = style.shape === "bar";
  const isBanana = style.shape === "banana";

  return (
    <div className={`fs-board fs-${question.food} ${isCut ? "is-cut" : "is-whole"}`}>
      <div className="fs-plate">
        <svg viewBox="0 0 100 100" className="fs-food" role="img" aria-label={`${question.title} divided into ${sliceCount} slices`}>
          <defs>
            <clipPath id={`${question.food}-circle-clip`}>
              <circle cx="50" cy="50" r="47" />
            </clipPath>
            {isCut && !isBanana && !isBar ? Array.from({ length: sliceCount }, (_, index) => (
              <clipPath key={index} id={`${question.food}-slice-${sliceCount}-${index}`}>
                <path d={getSlicePath(index, sliceCount)} />
              </clipPath>
            )) : null}
            <radialGradient id={`${question.food}-shine`} cx="34%" cy="28%" r="65%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.62" />
              <stop offset="52%" stopColor={style.base} stopOpacity="1" />
              <stop offset="100%" stopColor={style.crust} stopOpacity="0.88" />
            </radialGradient>
            <filter id={`${question.food}-soft-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1.6" stdDeviation="1.4" floodColor="#3f1d0f" floodOpacity="0.25" />
            </filter>
            <filter id={`${question.food}-piece-shadow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="1.2" stdDeviation="1.2" floodColor="#3f1d0f" floodOpacity="0.32" />
            </filter>
          </defs>
          {isBanana ? (
            <BananaFood food={question.food} style={style} sliceCount={sliceCount} selectedSlices={selectedSlices} hiddenSlices={hiddenSlices} onPiecePointerDown={onPiecePointerDown} isCut={isCut} />
          ) : isBar ? (
            <BarFood food={question.food} style={style} sliceCount={sliceCount} selectedSlices={selectedSlices} hiddenSlices={hiddenSlices} onPiecePointerDown={onPiecePointerDown} isCut={isCut} />
          ) : (
            <>
              {!isCut ? <image href={style.asset} x="1" y="1" width="98" height="98" clipPath={`url(#${question.food}-circle-clip)`} preserveAspectRatio="xMidYMid meet" /> : null}
              {isCut ? Array.from({ length: sliceCount }, (_, index) => {
                const selected = selectedSlices.includes(index);
                const hidden = hiddenSlices.includes(index);
                const offset = getSliceOffset(index, sliceCount, selected);
                const slicePath = getSlicePath(index, sliceCount);
                return (
                  <g
                    key={index}
                    data-fs-piece-id={getPieceId(question.food, index)}
                    className={`${selected ? "fs-piece-selected" : ""} ${hidden ? "fs-piece-hidden" : ""}`}
                    transform={`translate(${offset.x} ${offset.y})`}
                    onPointerDown={(event) => onPiecePointerDown(index, event)}
                    filter={`url(#${question.food}-piece-shadow)`}
                  >
                    <image href={style.asset} x="1" y="1" width="98" height="98" preserveAspectRatio="xMidYMid meet" clipPath={`url(#${question.food}-slice-${sliceCount}-${index})`} />
                    <path
                      d={slicePath}
                      fill={selected ? "#fffdf7" : "rgba(255,255,255,0.01)"}
                      stroke={selected ? "rgba(255,255,255,0.98)" : "rgba(255,255,255,0.94)"}
                      strokeWidth={selected ? "2.15" : "1.08"}
                    />
                  </g>
                );
              }) : null}
              {!isCut ? <text x="50" y="93" textAnchor="middle" className="fs-svg-label">whole</text> : null}
            </>
          )}
        </svg>
      </div>
      <div className="fs-board-shadow" />
    </div>
  );
}

function ServingPlate({ question, servedSlices, onRemovePiece, plateRef, isReceiving }) {
  const style = FOOD_STYLE[question.food];
  const servedCount = servedSlices.length;

  return (
    <div className={`fs-serving-plate ${isReceiving ? "is-receiving" : ""}`} ref={plateRef}>
      <div className="fs-serving-plate-inner">
        <span><Utensils size={15} /> Serving plate</span>
        <strong>{servedCount}/{question.denominator}</strong>
        <div className={`fs-served-food-plate fs-served-count-${Math.max(1, servedCount)}`}>
          {servedCount > 0 ? servedSlices.map((sliceIndex, index) => {
            const offset = getPlateOffset(index, servedCount);
            return (
              <button
                key={getPieceId(question.food, sliceIndex)}
                type="button"
                className="fs-served-real-piece"
                style={{
                  "--piece-x": `${offset.x}px`,
                  "--piece-y": `${offset.y}px`,
                  "--piece-rotate": `${(index - (servedCount - 1) / 2) * 8}deg`,
                }}
                onClick={onRemovePiece}
                disabled={isReceiving}
                aria-label="Remove served food piece"
              >
                <FoodPiecePreview
                  piece={{
                    id: getPieceId(question.food, sliceIndex),
                    foodType: question.food,
                    sliceIndex,
                    denominator: question.denominator,
                  }}
                />
              </button>
            );
          }) : (
            <div className="fs-empty-serving-plate">Drop pieces here</div>
          )}
        </div>
        <div className="fs-served-pieces" aria-hidden="true">
          {Array.from({ length: question.denominator }, (_, index) => (
            <button
              key={index}
              type="button"
              className={index < servedCount ? "filled" : ""}
              style={{ "--piece-color": style.selected }}
              tabIndex={-1}
              disabled={isReceiving}
              aria-label={index < servedCount ? "Remove served piece" : "Empty plate slot"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DraggedSliceGhost({ piece }) {
  if (!piece) return null;

  const style = FOOD_STYLE[piece.food];

  return (
    <div
      className={`fs-dragged-piece fs-dragged-${style.shape}`}
      style={{
        left: piece.x,
        top: piece.y,
        "--piece-color": style.base,
        "--piece-ring": style.crust,
      }}
      aria-hidden="true"
    >
      <span>{piece.index + 1}</span>
    </div>
  );
}

function ProgressDots({ total, current }) {
  return (
    <div className="fs-dots" aria-label="Question progress">
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className={index <= current ? "active" : ""} />
      ))}
    </div>
  );
}

function CustomerFace({ mood = "waiting" }) {
  return (
    <div className={`fs-customer-face fs-${mood}`} aria-hidden="true">
      <span className="fs-customer-hair" />
      <span className="fs-customer-eye left" />
      <span className="fs-customer-eye right" />
      <span className="fs-customer-mouth" />
    </div>
  );
}

function CustomerCharacter({ customer, question, mood, orderKey, handRef, mouthRef, isReaching }) {
  const foodLabel = FOOD_STYLE[question.food].label.replace("Whole ", "").toLowerCase();

  return (
    <div key={orderKey} className={`fs-walk-in-customer fs-${mood} ${isReaching ? "is-reaching" : ""}`}>
      <div className="fs-order-bubble">
        <span>{customer.name} says</span>
        <strong>Serve {question.numerator}/{question.denominator}</strong>
        <small>{foodLabel}</small>
      </div>
      <img src={customer.asset} alt={`${customer.name}, customer`} />
      <span ref={handRef} className="fs-customer-hand-anchor" />
      <span ref={mouthRef} className="fs-customer-mouth-anchor" />
    </div>
  );
}

function OrderQueue({ questions, currentIndex }) {
  return (
    <div className="fs-order-queue" aria-label="Customer order queue">
      {[0, 1, 2].map((offset) => {
        const order = questions[(currentIndex + offset) % questions.length];
        const style = FOOD_STYLE[order.food];
        return (
          <div key={`${order.food}-${offset}`} className={offset === 0 ? "active" : ""}>
            <CustomerFace mood={offset === 0 ? "waiting" : "next"} />
            <span>{offset === 0 ? "Now" : "Next"}</span>
            <strong>{order.numerator}/{order.denominator}</strong>
            <small>{style.label.replace("Whole ", "")}</small>
          </div>
        );
      })}
    </div>
  );
}

function ComboMeter({ streak }) {
  const comboLevel = Math.min(5, streak);

  return (
    <div className="fs-combo-meter" aria-label={`Combo streak ${streak}`}>
      <span>Combo</span>
      <div>
        {Array.from({ length: 5 }, (_, index) => (
          <i key={index} className={index < comboLevel ? "active" : ""} />
        ))}
      </div>
      <strong>x{Math.max(1, streak || 1)}</strong>
    </div>
  );
}

export default function FractionSliceGame({ onBackToHub, startPlaying = false }) {
  const [orders, setOrders] = useState(() => createRandomOrders());
  const [screen, setScreen] = useState(() => startPlaying || isLocalFractionSlicePreview() ? "playing" : "start");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [sliceCount, setSliceCount] = useState(() => orders[0].denominator);
  const [selectedSlices, setSelectedSlices] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [stats, setStats] = useState(initialStats);
  const [reward, setReward] = useState(null);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [lives, setLives] = useState(3);
  const [isSolved, setIsSolved] = useState(false);
  const [shakeBoard, setShakeBoard] = useState(false);
  const [isCut, setIsCut] = useState(false);
  const [cutFlash, setCutFlash] = useState(false);
  const [pendingSliceCount, setPendingSliceCount] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);
  const [servedSlices, setServedSlices] = useState([]);
  const [patience, setPatience] = useState(ORDER_PATIENCE);
  const [customerMood, setCustomerMood] = useState("waiting");
  const [slashGesture, setSlashGesture] = useState(null);
  const [draggingPiece, setDraggingPiece] = useState(null);
  const [servingState, setServingState] = useState("idle");
  const [activeServingPieces, setActiveServingPieces] = useState([]);
  const slashGestureRef = useRef(null);
  const draggingPieceRef = useRef(null);
  const servingPlateRef = useRef(null);
  const gameContainerRef = useRef(null);
  const customerHandRef = useRef(null);
  const customerMouthRef = useRef(null);
  const servingTimersRef = useRef([]);

  const question = orders[questionIndex % orders.length];
  const targetLabel = formatFraction(question.numerator, question.denominator);
  const correctSliceCount = sliceCount === question.denominator;
  const correctServedCount = servedSlices.length === question.numerator;
  const correctFood = selectedFood === question.food;
  const selectedFraction = `${servedSlices.length}/${question.denominator}`;
  const correctFoodStyle = FOOD_STYLE[question.food];
  const style = selectedFood ? FOOD_STYLE[selectedFood] : correctFoodStyle;
  const currentCustomer = CUSTOMERS[questionIndex % CUSTOMERS.length];
  const isServing = servingState !== "idle";
  const hiddenSlices = isCut ? [...new Set([...servedSlices, ...activeServingPieces.map((piece) => piece.sliceIndex)])] : [];

  const clearServingTimers = () => {
    servingTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    servingTimersRef.current = [];
  };

  const scheduleServingStep = (delay, callback) => {
    const timerId = window.setTimeout(callback, delay);
    servingTimersRef.current.push(timerId);
    return timerId;
  };

  const selectedText = useMemo(() => {
    if (!selectedFood) return "Pick the food from the shelf.";
    if (!isCut) return "Slash across the food or press Slice Food.";
    if (servedSlices.length === 0) return "Move slices to the plate.";
    return `${servedSlices.length} of ${question.denominator} on the plate`;
  }, [isCut, question.denominator, selectedFood, servedSlices.length]);

  const visiblePrompt = selectedFood
    ? `Show ${question.fractionPhrase || getFractionPhrase(question.numerator, question.denominator)} of the ${getFoodName(selectedFood)}.`
    : question.prompt;

  useEffect(() => () => clearServingTimers(), []);

  useEffect(() => {
    if (screen !== "playing") return undefined;

    const timer = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setScreen("summary");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "playing" || isSolved) return undefined;

    const timer = window.setInterval(() => {
      setPatience((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          setCustomerMood("worried");
          setStats((statsCurrent) => ({
            ...statsCurrent,
            streak: 0,
            misses: statsCurrent.misses + 1,
          }));
          setLives((currentLives) => {
            const nextLives = Math.max(0, currentLives - 1);
            window.setTimeout(() => {
              if (nextLives <= 0) {
                setScreen("summary");
              } else {
                nextQuestion();
              }
            }, 700);
            return nextLives;
          });
          setFeedback("The customer waited too long. Serve the next one faster.");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isSolved, screen]);

  useEffect(() => {
    if (!draggingPiece) return undefined;

    const finishPieceDrag = (event) => {
      const current = draggingPieceRef.current;
      if (!current) return;

      const plateBounds = servingPlateRef.current?.getBoundingClientRect();
      const droppedOnPlate = plateBounds
        ? event.clientX >= plateBounds.left
          && event.clientX <= plateBounds.right
          && event.clientY >= plateBounds.top
          && event.clientY <= plateBounds.bottom
        : false;
      const movedDistance = Math.hypot(event.clientX - current.startX, event.clientY - current.startY);

      draggingPieceRef.current = null;
      setDraggingPiece(null);

      if (droppedOnPlate || movedDistance < 12) {
        servePiece(current.index, droppedOnPlate ? "drop" : "tap");
      } else {
        setFeedback("Release the slice on the serving plate to serve it.");
      }
    };

    const movePieceDrag = (event) => {
      const current = draggingPieceRef.current;
      if (!current) return;

      const next = {
        ...current,
        x: event.clientX,
        y: event.clientY,
      };
      draggingPieceRef.current = next;
      setDraggingPiece(next);
    };

    window.addEventListener("pointermove", movePieceDrag);
    window.addEventListener("pointerup", finishPieceDrag);
    window.addEventListener("pointercancel", finishPieceDrag);

    return () => {
      window.removeEventListener("pointermove", movePieceDrag);
      window.removeEventListener("pointerup", finishPieceDrag);
      window.removeEventListener("pointercancel", finishPieceDrag);
    };
  }, [draggingPiece]);

  const startGame = () => {
    clearServingTimers();
    const nextOrders = createRandomOrders();
    setOrders(nextOrders);
    setScreen("playing");
    setQuestionIndex(0);
    setSliceCount(nextOrders[0].denominator);
    setSelectedSlices([]);
    setFeedback("Serve the first order. Pick a cut number to slice the whole food.");
    setStats(initialStats);
    setReward(null);
    setTimeLeft(ROUND_SECONDS);
    setLives(3);
    setIsSolved(false);
    setShakeBoard(false);
    setIsCut(false);
    setCutFlash(false);
    setPendingSliceCount(null);
    setSelectedFood(null);
    setServedSlices([]);
    setPatience(ORDER_PATIENCE);
    setCustomerMood("waiting");
    slashGestureRef.current = null;
    draggingPieceRef.current = null;
    setSlashGesture(null);
    setDraggingPiece(null);
    setServingState("idle");
    setActiveServingPieces([]);
  };

  const resetQuestion = () => {
    if (isServing) return;
    setSliceCount(question.denominator);
    setSelectedSlices([]);
    setFeedback("The food is whole again. Choose how many equal parts to cut.");
    setReward(null);
    setIsSolved(false);
    setIsCut(false);
    setCutFlash(false);
    setPendingSliceCount(null);
    setServedSlices([]);
    slashGestureRef.current = null;
    draggingPieceRef.current = null;
    setSlashGesture(null);
    setDraggingPiece(null);
    setServingState("idle");
    setActiveServingPieces([]);
  };

  const servePiece = (index, method = "tap") => {
    if (isServing) return;
    if (!selectedFood) {
      setFeedback("Pick the correct whole food from the shelf first.");
      return;
    }

    if (selectedFood !== question.food) {
      setFeedback(`This customer ordered ${style.label.toLowerCase()}. Pick that food first.`);
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    if (!isCut || isSolved) {
      setFeedback("Choose equal parts, then use the slicer tool.");
      return;
    }

    if (sliceCount !== question.denominator) {
      setFeedback(`This food is cut into ${sliceCount}, but the order needs ${question.denominator} equal parts.`);
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    setReward(null);
    setServedSlices((current) => {
      if (current.includes(index)) {
        setFeedback("That slice is already on the serving plate.");
        return current;
      }

      const next = [...current, index].sort((a, b) => a - b);
      setSelectedSlices(next);
      const remaining = Math.max(0, question.numerator - next.length);
      setFeedback(remaining === 0
        ? "Plate is ready. Press Serve for the customer."
        : `${method === "drop" ? "Dropped" : "Added"} one slice. Serve ${remaining} more.`);
      return next;
    });
  };

  const startPieceDrag = (index, event) => {
    event.preventDefault();
    event.stopPropagation();

    if (isServing) return;

    if (servedSlices.includes(index)) {
      setFeedback("That slice is already on the plate. Tap a plate slot to remove the last piece.");
      return;
    }

    const next = {
      index,
      food: selectedFood || question.food,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
    };
    draggingPieceRef.current = next;
    setDraggingPiece(next);
    setReward(null);
    setFeedback("Drag the slice to the serving plate, then release.");
  };

  const chooseSliceCount = (count) => {
    if (isSolved || isServing) return;
    if (!selectedFood) {
      setFeedback("Pick a whole food from the shelf before cutting.");
      return;
    }
    setPendingSliceCount(count);
    setSelectedSlices([]);
    setServedSlices([]);
    draggingPieceRef.current = null;
    setDraggingPiece(null);
    setIsCut(false);
    setReward(null);
    setFeedback(count === question.denominator ? "Slicer is ready. Drag across the food or press Slice Food." : `Slicer is set to ${count} parts. The order needs ${question.denominator}.`);
  };

  const useSlicer = () => {
    if (isSolved || isServing) return;
    if (!selectedFood) {
      setFeedback("Pick a whole food from the shelf before using the slicer.");
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    if (!pendingSliceCount) {
      setFeedback("Choose how many equal parts to cut first.");
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    setSliceCount(pendingSliceCount);
    setSelectedSlices([]);
    setServedSlices([]);
    draggingPieceRef.current = null;
    setDraggingPiece(null);
    setIsCut(true);
    setCutFlash(true);
    window.setTimeout(() => setCutFlash(false), 620);
    setReward(null);
    setFeedback(pendingSliceCount === question.denominator ? "Clean cut. Now tap slices to move them onto the plate." : `You cut it into ${pendingSliceCount} parts. This order needs ${question.denominator}.`);
  };

  const getSlashPoint = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return {
      x: ((event.clientX - bounds.left) / bounds.width) * 100,
      y: ((event.clientY - bounds.top) / bounds.height) * 100,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  };

  const getSlashStyle = () => {
    if (!slashGesture) return {};
    const dx = slashGesture.end.clientX - slashGesture.start.clientX;
    const dy = slashGesture.end.clientY - slashGesture.start.clientY;
    return {
      "--slash-x1": `${slashGesture.start.x}%`,
      "--slash-y1": `${slashGesture.start.y}%`,
      "--slash-length": `${Math.max(32, Math.hypot(dx, dy))}px`,
      "--slash-angle": `${Math.atan2(dy, dx)}rad`,
    };
  };

  const startSlash = (event) => {
    if (isSolved || isCut || isServing) return;

    if (!selectedFood) {
      setFeedback("Pick a whole food first, then slash across it.");
      return;
    }

    event.preventDefault();
    const point = getSlashPoint(event);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const gesture = { active: true, pointerId: event.pointerId, start: point, end: point };
    slashGestureRef.current = gesture;
    setSlashGesture(gesture);
  };

  const moveSlash = (event) => {
    const current = slashGestureRef.current;
    if (!current?.active || current.pointerId !== event.pointerId) return;

    event.preventDefault();
    const next = { ...current, end: getSlashPoint(event) };
    slashGestureRef.current = next;
    setSlashGesture(next);
  };

  const finishSlash = (event) => {
    const current = slashGestureRef.current;
    if (!current?.active || current.pointerId !== event.pointerId) return;

    event.preventDefault();
    const end = getSlashPoint(event);
    const dx = end.clientX - current.start.clientX;
    const dy = end.clientY - current.start.clientY;
    const distance = Math.hypot(dx, dy);
    const finished = { ...current, active: false, end };
    slashGestureRef.current = null;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setSlashGesture(finished);
    window.setTimeout(() => setSlashGesture(null), 280);

    if (distance < 70) {
      setFeedback("Make a longer slash across the food to cut it.");
      return;
    }

    useSlicer();
  };

  const cancelSlash = () => {
    slashGestureRef.current = null;
    setSlashGesture(null);
  };

  const chooseFood = (food) => {
    if (isSolved || isServing) return;
    setSelectedFood(food);
    setSelectedSlices([]);
    setServedSlices([]);
    draggingPieceRef.current = null;
    setDraggingPiece(null);
    setIsCut(false);
    setPendingSliceCount(null);
    setReward(null);
    setFeedback(food === question.food ? `Good. Now choose how many equal parts to cut.` : `That is ${FOOD_STYLE[food].label.toLowerCase()}, but the customer ordered ${correctFoodStyle.label.toLowerCase()}.`);
  };

  const removeServedPiece = () => {
    if (isSolved || isServing) return;
    setServedSlices((current) => {
      const next = current.slice(0, -1);
      setSelectedSlices(next);
      return next;
    });
  };

  const runServingAnimation = () => {
    const container = gameContainerRef.current;
    const plateCenter = getRelativeCenter(servingPlateRef.current, container, { x: 0, y: 0 });
    const handCenter = getRelativeCenter(customerHandRef.current, container, plateCenter);
    const mouthCenter = getRelativeCenter(customerMouthRef.current, container, handCenter);
    const pieceIndexes = [...servedSlices].sort((a, b) => a - b);
    const boardFallback = {
      x: plateCenter.x - 260,
      y: plateCenter.y - 40,
    };
    const pieces = pieceIndexes.map((sliceIndex, index) => {
      const id = getPieceId(question.food, sliceIndex);
      const sourceElement = container?.querySelector(`[data-fs-piece-id="${id}"]`);
      const plateOffset = getPlateOffset(index, pieceIndexes.length);
      const handOffset = getPlateOffset(index, pieceIndexes.length);

      return {
        id,
        foodType: question.food,
        sliceIndex,
        denominator: question.denominator,
        from: getRelativeCenter(sourceElement, container, boardFallback),
        plate: {
          x: plateCenter.x + plateOffset.x,
          y: plateCenter.y + plateOffset.y,
        },
        hand: {
          x: handCenter.x + handOffset.x * 0.42,
          y: handCenter.y + handOffset.y * 0.42,
        },
        mouth: {
          x: mouthCenter.x,
          y: mouthCenter.y,
        },
        scale: pieceIndexes.length > 3 ? 0.72 : 0.82,
        delay: index * servingAnimationConfig.stagger,
        rotation: (index - (pieceIndexes.length - 1) / 2) * 8,
      };
    });

    const streak = stats.streak + 1;
    const starBonus = streak % 3 === 0 ? 1 : 0;
    const speedBonus = Math.min(8, streak);
    const lastStagger = Math.max(0, pieces.length - 1) * servingAnimationConfig.stagger;
    const toPlateDone = servingAnimationConfig.toPlate + lastStagger;
    const toHandStart = toPlateDone + servingAnimationConfig.platePause + servingAnimationConfig.customerReach;
    const toHandDone = toHandStart + servingAnimationConfig.toHand + lastStagger;
    const receiveStart = toHandDone + servingAnimationConfig.handHold;
    const celebrationStart = receiveStart + servingAnimationConfig.receiveFood;
    const nextOrderStart = celebrationStart + servingAnimationConfig.celebration + servingAnimationConfig.nextOrder;

    clearServingTimers();
    draggingPieceRef.current = null;
    setDraggingPiece(null);
    setActiveServingPieces(pieces);
    setServingState("movingToPlate");
    setIsSolved(true);
    setReward(null);
    setFeedback("Serving the exact pieces to the customer...");

    scheduleServingStep(toPlateDone, () => {
      setServingState("onPlate");
      setFeedback("The pieces are on the plate.");
    });

    scheduleServingStep(toHandStart, () => {
      setServingState("movingToHand");
      setFeedback(`${currentCustomer.name} is taking the food.`);
    });

    scheduleServingStep(receiveStart, () => {
      setServingState("receiving");
      setFeedback(`${currentCustomer.name} received the pieces.`);
    });

    scheduleServingStep(celebrationStart, () => {
      setServingState("celebrating");
      setActiveServingPieces([]);
      setCustomerMood("happy");
      setStats((current) => ({
        ...current,
        score: current.score + 120 + streak * 12,
        coins: current.coins + 15 + streak,
        stars: current.stars + starBonus,
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
        answered: current.answered + 1,
        served: current.served + 1,
      }));
      setTimeLeft((current) => Math.min(ROUND_SECONDS, current + speedBonus));
      setReward(`+${15 + streak} coins${starBonus ? " +1 star" : ""} +${speedBonus}s`);
      setFeedback(`Correct! You served ${question.numerator} out of ${question.denominator} equal parts.`);
    });

    scheduleServingStep(nextOrderStart, () => {
      setServingState("idle");
      setActiveServingPieces([]);
      nextQuestion();
    });
  };

  const submitAnswer = () => {
    if (isServing) return;

    if (isSolved) {
      nextQuestion();
      return;
    }

    if (!selectedFood) {
      setFeedback("Pick the customer's food from the shelf first.");
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    if (!correctFood) {
      setCustomerMood("worried");
      setFeedback(`Wrong food. The customer wants ${correctFoodStyle.label.toLowerCase()}.`);
      setPatience((current) => Math.max(0, current - 5));
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    if (!isCut) {
      setFeedback(`Cut the whole ${question.food} into equal parts first.`);
      setShakeBoard(true);
      window.setTimeout(() => setShakeBoard(false), 420);
      return;
    }

    if (isCut && correctSliceCount && correctServedCount) {
      runServingAnimation();
      return;
    }

    const nextLives = Math.max(0, lives - 1);
    setLives(nextLives);
    setStats((current) => ({
      ...current,
      streak: 0,
      answered: current.answered + 1,
      misses: current.misses + 1,
    }));
    setReward(null);
    setCustomerMood("worried");
    setPatience((current) => Math.max(0, current - 4));
    setShakeBoard(true);
    window.setTimeout(() => setShakeBoard(false), 420);
    setFeedback(correctSliceCount
      ? `Select ${question.numerator} piece${question.numerator === 1 ? "" : "s"} because the numerator is ${question.numerator}.`
      : `Not yet. ${targetLabel} needs ${question.denominator} equal parts first.`);

    if (nextLives <= 0) {
      window.setTimeout(() => setScreen("summary"), 650);
    }
  };

  const nextQuestion = () => {
    clearServingTimers();
    const nextIndex = questionIndex + 1;
    if (nextIndex >= orders.length) {
      setServingState("idle");
      setActiveServingPieces([]);
      setScreen("summary");
      return;
    }

    const next = orders[nextIndex];
    setQuestionIndex(nextIndex);
    setSliceCount(next.denominator);
    setSelectedSlices([]);
    setReward(null);
    setFeedback(next.hint);
    setIsSolved(false);
    setShakeBoard(false);
    setIsCut(false);
    setCutFlash(false);
    setPendingSliceCount(null);
    setSelectedFood(null);
    setServedSlices([]);
    draggingPieceRef.current = null;
    setDraggingPiece(null);
    setPatience(ORDER_PATIENCE);
    setCustomerMood("waiting");
    slashGestureRef.current = null;
    setSlashGesture(null);
    setServingState("idle");
    setActiveServingPieces([]);
  };

  if (screen === "start") {
    return (
      <main className="fs-game">
        <button type="button" className="fs-back" onClick={onBackToHub}>
          <ArrowLeft size={18} /> Games
        </button>
        <div className="fs-wood-title">
          <span>Fraction Slice</span>
        </div>
        <section className="fs-start">
          <div className="fs-start-copy">
            <span><Sparkles size={18} /> Fraction Slice</span>
            <h1>Run a fast fraction food stand.</h1>
            <p>Customers order fractions. Pick the food, cut it into equal parts, move slices onto the plate, and serve before patience runs out.</p>
            <div className="fs-start-rules">
              <strong><Clock3 size={16} /> 75 second round</strong>
              <strong><Heart size={16} /> 3 tries</strong>
              <strong><Zap size={16} /> streak bonuses</strong>
            </div>
            <button type="button" onClick={startGame}>Start Rush</button>
          </div>
          <div className="fs-start-demo">
            <SliceBoard question={QUESTIONS[1]} sliceCount={4} selectedSlices={[0, 1, 2]} onPiecePointerDown={() => {}} isCut />
          </div>
        </section>
      </main>
    );
  }

  if (screen === "summary") {
    return (
      <main className="fs-game">
        <button type="button" className="fs-back" onClick={onBackToHub}>
          <ArrowLeft size={18} /> Games
        </button>
        <section className="fs-summary">
          <Trophy size={54} />
          <span>Round Complete</span>
          <h1>{stats.score} points</h1>
          <div className="fs-summary-grid">
            <strong>{stats.coins} coins</strong>
            <strong>{stats.stars} stars</strong>
            <strong>{stats.served} served</strong>
            <strong>{stats.bestStreak} best streak</strong>
            <strong>{stats.misses} misses</strong>
            <strong>{timeLeft}s left</strong>
          </div>
          <button type="button" onClick={startGame}>Play Again</button>
        </section>
      </main>
    );
  }

  return (
    <main className="fs-game">
      <button type="button" className="fs-back" onClick={onBackToHub}>
        <ArrowLeft size={18} /> Games
      </button>
      <div className="fs-wood-title fs-play-title">
        <span>Fraction Chef Rush</span>
      </div>

      <section className="fs-hud">
        <div>
          <span><Clock3 size={13} /> Time</span>
          <strong>{timeLeft}s</strong>
        </div>
        <div>
          <span>Coins</span>
          <strong>{stats.coins}</strong>
        </div>
        <div>
          <span><Zap size={13} /> Streak</span>
          <strong>{stats.streak}</strong>
        </div>
        <div>
          <span><Heart size={13} /> Tries</span>
          <strong>{lives}</strong>
        </div>
      </section>

      <section className="fs-play" ref={gameContainerRef}>
        <aside className="fs-controls fs-shelf-panel">
          <ComboMeter streak={stats.streak} />
          <div className="fs-control-block">
            <span><ChefHat size={14} /> Food shelf</span>
            <div className="fs-food-shelf">
              {Object.entries(FOOD_STYLE).map(([food, foodStyle]) => (
                <button
                  key={food}
                  type="button"
                  className={`${selectedFood === food ? "active" : ""} fs-shelf-${foodStyle.shape}`}
                  style={{ "--food-color": foodStyle.base, "--food-ring": foodStyle.crust }}
                  onClick={() => chooseFood(food)}
                  disabled={isServing}
                >
                  <img src={foodStyle.asset} alt="" />
                  <strong>{foodStyle.label.replace("Whole ", "")}</strong>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="fs-question-card fs-order-panel">
          <ProgressDots total={orders.length} current={questionIndex} />
          <span className="fs-level">{question.level}</span>
          <h1>Customer order</h1>
          <div className="fs-customer-card">
            <img className="fs-customer-thumb" src={currentCustomer.asset} alt="" />
            <div>
              <span>{isSolved ? "Happy customer" : "Waiting customer"}</span>
              <strong>
                {currentCustomer.name} wants{" "}
                {selectedFood ? style.label.replace("Whole ", "").toLowerCase() : "a sliced treat"}
              </strong>
            </div>
          </div>
          <div className="fs-patience">
            <span>Patience</span>
            <div><i style={{ width: `${(patience / ORDER_PATIENCE) * 100}%` }} /></div>
          </div>
          <div className="fs-target">
            <span>Target</span>
            <strong>{targetLabel}</strong>
          </div>
          <h2>{visiblePrompt}</h2>
          <p>{feedback || question.hint}</p>
        </div>

        <div
          className={`fs-stage ${!isCut && selectedFood ? "can-slash" : ""} ${shakeBoard ? "is-shaking" : ""} ${isSolved ? "is-solved" : ""}`}
          style={{ "--food": style.base, "--selected": style.selected }}
          onPointerDown={startSlash}
          onPointerMove={moveSlash}
          onPointerUp={finishSlash}
          onPointerCancel={cancelSlash}
        >
          <div className="fs-counter-top">
            <span>Order {questionIndex + 1}/{orders.length}</span>
            <strong>{stats.score} points</strong>
          </div>
          <OrderQueue questions={orders} currentIndex={questionIndex} />
          <CustomerCharacter
            customer={currentCustomer}
            question={question}
            mood={customerMood}
            orderKey={`${questionIndex}-${question.food}`}
            handRef={customerHandRef}
            mouthRef={customerMouthRef}
            isReaching={servingState === "onPlate" || servingState === "movingToHand" || servingState === "receiving"}
          />
          <div className="fs-food-label">{selectedFood ? FOOD_STYLE[selectedFood].label : "Pick Food"}</div>
          {cutFlash ? <div className="fs-cut-flash" aria-hidden="true"><span /><span /><span /><b /></div> : null}
          {slashGesture ? (
            <div
              className={`fs-slash-trail ${slashGesture.active ? "is-active" : ""}`}
              style={getSlashStyle()}
              aria-hidden="true"
            />
          ) : null}
          <SliceBoard question={selectedFood ? { ...question, food: selectedFood } : null} sliceCount={sliceCount} selectedSlices={selectedSlices} hiddenSlices={hiddenSlices} onPiecePointerDown={startPieceDrag} isCut={isCut} />
          <DraggedSliceGhost piece={draggingPiece} />
          {reward ? <div className="fs-reward"><Star size={18} /> {reward}</div> : null}
          {servingState === "celebrating" ? <div className="fs-served-stamp">Served</div> : null}
        </div>

        <aside className="fs-controls fs-tool-panel">
          <div className="fs-control-block">
            <span>1. Equal parts</span>
            <div className="fs-slice-options">
              {SLICE_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={pendingSliceCount === count ? "active" : ""}
                  onClick={() => chooseSliceCount(count)}
                  disabled={isServing}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="fs-control-block fs-slicer-block">
            <span><Utensils size={14} /> Slicer tool</span>
            <button type="button" className={`fs-slicer-tool ${cutFlash ? "is-cutting" : ""}`} onClick={useSlicer} disabled={isServing}>
              <i aria-hidden="true" />
              <strong>Slice Food</strong>
              <small>{pendingSliceCount ? `${pendingSliceCount} parts or slash` : "choose parts first"}</small>
            </button>
          </div>

          <div className="fs-control-block">
            <span>2. Plate fraction</span>
            <ServingPlate question={question} servedSlices={servedSlices} onRemovePiece={removeServedPiece} plateRef={servingPlateRef} isReceiving={Boolean(draggingPiece) || isServing} />
            <strong>{isCut ? selectedFraction : "Whole"}</strong>
            <p>{isCut ? selectedText : "Slash across the food to cut."}</p>
          </div>

          <div className="fs-actions">
            <button type="button" className="fs-secondary" onClick={resetQuestion} disabled={isServing}>
              <RotateCcw size={17} /> Reset
            </button>
            <button type="button" className="fs-primary" onClick={submitAnswer} disabled={isServing}>
              <CheckCircle2 size={18} /> {isServing ? "Serving..." : isSolved ? "Next Order" : "Serve"}
            </button>
            <button type="button" className="fs-next" onClick={nextQuestion} disabled={isServing}>Skip Order</button>
          </div>
        </aside>
        <ServingAnimationLayer pieces={activeServingPieces} servingState={servingState} />
      </section>
    </main>
  );
}
