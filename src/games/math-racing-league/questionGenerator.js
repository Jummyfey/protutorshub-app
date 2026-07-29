import { DIFFICULTIES, LEAGUES } from "../shared/types/gameTypes";

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[rand(0, items.length - 1)];
const difficultyIndex = (difficulty) => Math.max(0, DIFFICULTIES.indexOf(difficulty));
const gcd = (a, b) => (b === 0 ? Math.abs(a) : gcd(b, a % b));
const pressureTier = (pressureLevel = 0) => Math.min(2, Math.max(0, pressureLevel));

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function makeChoices(answer) {
  const correct = String(answer);
  const numeric = Number(answer);
  const choices = new Set([correct]);

  const distractors = [
    numeric + 1,
    numeric - 1,
    numeric + 5,
    numeric - 5,
    numeric + 10,
    numeric - 10,
    Math.round(numeric * 1.1),
    Math.round(numeric * 0.9),
  ];

  shuffle(distractors).forEach((item) => {
    if (choices.size < 3 && item >= 0) choices.add(formatNumber(item));
  });

  while (choices.size < 3) {
    const spread = Math.max(5, Math.round(Math.abs(numeric) * 0.2));
    const wrong = numeric + rand(-spread, spread);
    if (wrong >= 0) choices.add(formatNumber(wrong));
  }

  return shuffle(Array.from(choices));
}

function bronzeQuestion(difficulty, pressureLevel = 0) {
  const level = difficultyIndex(difficulty);
  const pressure = pressureTier(pressureLevel);

  const types = [
    ["add", "subtract", "multiply", "place", "missing", "sequence", "word"],
    ["add", "subtract", "multiply", "place", "sequence", "expanded", "word", "mixed"],
    ["mixed", "largeMultiply", "missing", "sequence", "expanded", "word", "subtract"],
  ][level];

  const pressureTypes = [
    ["multiply", "place", "missing", "sequence", "word"],
    ["multiply", "place", "sequence", "expanded", "word", "mixed"],
    ["mixed", "largeMultiply", "missing", "sequence", "expanded", "word"],
  ][level];
  const type = pick(pressure > 0 ? pressureTypes : types);

  if (type === "add") {
    const a = rand([60, 400, 5000][level], [500, 2200, 25000][level]);
    const b = rand([40, 300, 3000][level], [450, 1800, 18000][level]);
    return { prompt: `${a} + ${b} = ?`, answer: String(a + b) };
  }

  if (type === "subtract") {
    const a = rand([180, 900, 12000][level], [950, 4800, 40000][level]);
    const b = rand([40, 250, 4000][level], a - 1);
    return { prompt: `${a} - ${b} = ?`, answer: String(a - b) };
  }

  if (type === "multiply") {
    const a = rand([12, 14, 35][level], [24, 42, 140][level]);
    const b = rand([3, 7, 18][level], [9, 18, 75][level]);
    return { prompt: `${a} × ${b} = ?`, answer: String(a * b) };
  }

  if (type === "largeMultiply") {
    const a = rand(65, 180);
    const b = rand(22, 95);
    return { prompt: `${a} × ${b} = ?`, answer: String(a * b) };
  }

  if (type === "mixed") {
    const a = rand([100, 450, 2500][level], [600, 1800, 12000][level]);
    const b = rand([8, 16, 55][level], [28, 60, 240][level]);
    const c = rand([3, 7, 18][level], [12, 24, 90][level]);
    return { prompt: `${a} + ${b} × ${c} = ?`, answer: String(a + b * c) };
  }

  if (type === "place") {
    const number = [rand(100, 999), rand(1000, 9999), rand(10000, 99999)][level];
    const text = String(number);
    const index = rand(0, text.length - 1);
    const place = 10 ** (text.length - index - 1);

    return {
      prompt: `What is the value of ${text[index]} in ${number}?`,
      answer: String(Number(text[index]) * place),
    };
  }

  if (type === "missing") {
    const a = rand([50, 250, 2500][level], [350, 1400, 12000][level]);
    const answer = rand([30, 180, 1800][level], [300, 1200, 10000][level]);
    return { prompt: `${a} + ___ = ${a + answer}`, answer: String(answer) };
  }

  if (type === "sequence") {
    const start = rand([10, 60, 800][level], [80, 350, 4000][level]);
    const step = rand([4, 12, 90][level], [18, 60, 520][level]);
    return {
      prompt: `What comes next? ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ___`,
      answer: String(start + step * 4),
    };
  }

  if (type === "expanded") {
    const number = rand([100, 1000, 10000][level], [999, 9999, 99999][level]);
    const digits = String(number).split("").map(Number);
    const parts = digits.map((d, i) => d * 10 ** (digits.length - i - 1)).filter(Boolean);
    return {
      prompt: `Write ${parts.join(" + ")} as a number.`,
      answer: String(number),
    };
  }

  const pupils = rand([25, 55, 180][level], [90, 160, 520][level]);
  const items = rand([5, 12, 45][level], [16, 36, 160][level]);
  const extra = rand([20, 100, 900][level], [180, 700, 5500][level]);

  return {
    prompt: `${pupils} pupils each get ${items} pencils. There are ${extra} extra pencils. How many pencils altogether?`,
    answer: String(pupils * items + extra),
  };
}

function bronzeQuestionV2(difficulty, pressureLevel = 0) {
  const baseLevel = difficultyIndex(difficulty);
  const pressure = pressureTier(pressureLevel);
  const level = baseLevel;

  if (baseLevel === 0 && pressure > 0) {
    const type = pick(["add", "add", "subtract", "subtract", "multiply", "missing", "sequence"]);
    const tier = Math.min(3, pressure);

    if (type === "add") {
      const a = rand(35 + tier * 20, 95 + tier * 70);
      const b = rand(25 + tier * 15, 85 + tier * 60);
      return { prompt: `${a} + ${b} = ?`, answer: String(a + b) };
    }

    if (type === "subtract") {
      const answer = rand(25 + tier * 15, 90 + tier * 65);
      const b = rand(20 + tier * 12, 80 + tier * 55);
      return { prompt: `${answer + b} - ${b} = ?`, answer: String(answer) };
    }

    if (type === "multiply") {
      const a = rand(12 + tier * 4, 24 + tier * 12);
      const b = rand(6 + tier, 12 + tier * 3);
      return { prompt: `${a} x ${b} = ?`, answer: String(a * b) };
    }

    if (type === "missing") {
      const a = rand(25 + tier * 20, 90 + tier * 65);
      const answer = rand(20 + tier * 15, 85 + tier * 55);
      return { prompt: `${a} + ___ = ${a + answer}`, answer: String(answer) };
    }

    const start = rand(10 + tier * 12, 60 + tier * 45);
    const step = rand(3 + tier * 2, 12 + tier * 8);
    return {
      prompt: `What comes next? ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ___`,
      answer: String(start + step * 4),
    };
  }

  if (level === 0) {
    const type = pick(["add", "add", "subtract", "subtract", "multiply"]);

    if (type === "add") {
      const a = rand(1, 35);
      const b = rand(1, 35);
      return { prompt: `${a} + ${b} = ?`, answer: String(a + b) };
    }

    if (type === "subtract") {
      const answer = rand(1, 30);
      const b = rand(1, 30);
      return { prompt: `${answer + b} - ${b} = ?`, answer: String(answer) };
    }

    const a = rand(2, 10);
    const b = rand(2, 5);
    return { prompt: `${a} x ${b} = ?`, answer: String(a * b) };
  }

  if (level === 1) {
    const type = pick(
      pressure > 0
        ? ["multiply", "missing", "sequence", "place", "word"]
        : ["add", "subtract", "multiply", "missing", "sequence", "place", "word"]
    );

    if (type === "add") {
      const a = rand(40, 180);
      const b = rand(20, 150);
      return { prompt: `${a} + ${b} = ?`, answer: String(a + b) };
    }

    if (type === "subtract") {
      const a = rand(80, 260);
      const b = rand(20, Math.min(150, a - 1));
      return { prompt: `${a} - ${b} = ?`, answer: String(a - b) };
    }

    if (type === "multiply") {
      const a = rand(6, 12);
      const b = rand(3, 8);
      return { prompt: `${a} x ${b} = ?`, answer: String(a * b) };
    }

    if (type === "missing") {
      const a = rand(25, 120);
      const answer = rand(10, 90);
      return { prompt: `${a} + ___ = ${a + answer}`, answer: String(answer) };
    }

    if (type === "sequence") {
      const start = rand(5, 50);
      const step = rand(2, 12);
      return {
        prompt: `What comes next? ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ___`,
        answer: String(start + step * 4),
      };
    }

    if (type === "place") {
      const number = rand(100, 999);
      const text = String(number);
      const index = rand(0, text.length - 1);
      const place = 10 ** (text.length - index - 1);

      return {
        prompt: `What is the value of ${text[index]} in ${number}?`,
        answer: String(Number(text[index]) * place),
      };
    }

    const pupils = rand(8, 30);
    const items = rand(3, 9);
    const extra = rand(5, 40);
    return {
      prompt: `${pupils} pupils each get ${items} pencils. There are ${extra} extra pencils. How many pencils altogether?`,
      answer: String(pupils * items + extra),
    };
  }

  if (level === 2) {
    return bronzeQuestion(difficulty, pressure);
  }

  const bronzeLevel = 1;
  const types = [
    ["add", "subtract", "multiply", "place", "missing", "sequence", "word"],
    ["add", "subtract", "multiply", "place", "sequence", "expanded", "word", "mixed"],
  ][bronzeLevel];

  const type = pick(types);

  if (type === "add") {
    const a = rand([60, 400][bronzeLevel], [500, 2200][bronzeLevel]);
    const b = rand([40, 300][bronzeLevel], [450, 1800][bronzeLevel]);
    return { prompt: `${a} + ${b} = ?`, answer: String(a + b) };
  }

  if (type === "subtract") {
    const a = rand([180, 900][bronzeLevel], [950, 4800][bronzeLevel]);
    const b = rand([40, 250][bronzeLevel], a - 1);
    return { prompt: `${a} - ${b} = ?`, answer: String(a - b) };
  }

  if (type === "multiply") {
    const a = rand([12, 14][bronzeLevel], [24, 42][bronzeLevel]);
    const b = rand([3, 7][bronzeLevel], [9, 18][bronzeLevel]);
    return { prompt: `${a} x ${b} = ?`, answer: String(a * b) };
  }

  if (type === "mixed") {
    const a = rand([100, 450][bronzeLevel], [600, 1800][bronzeLevel]);
    const b = rand([8, 16][bronzeLevel], [28, 60][bronzeLevel]);
    const c = rand([3, 7][bronzeLevel], [12, 24][bronzeLevel]);
    return { prompt: `${a} + ${b} x ${c} = ?`, answer: String(a + b * c) };
  }

  if (type === "place") {
    const number = [rand(100, 999), rand(1000, 9999)][bronzeLevel];
    const text = String(number);
    const index = rand(0, text.length - 1);
    const place = 10 ** (text.length - index - 1);

    return {
      prompt: `What is the value of ${text[index]} in ${number}?`,
      answer: String(Number(text[index]) * place),
    };
  }

  if (type === "missing") {
    const a = rand([50, 250][bronzeLevel], [350, 1400][bronzeLevel]);
    const answer = rand([30, 180][bronzeLevel], [300, 1200][bronzeLevel]);
    return { prompt: `${a} + ___ = ${a + answer}`, answer: String(answer) };
  }

  if (type === "sequence") {
    const start = rand([10, 60][bronzeLevel], [80, 350][bronzeLevel]);
    const step = rand([4, 12][bronzeLevel], [18, 60][bronzeLevel]);
    return {
      prompt: `What comes next? ${start}, ${start + step}, ${start + step * 2}, ${start + step * 3}, ___`,
      answer: String(start + step * 4),
    };
  }

  if (type === "expanded") {
    const number = rand([100, 1000][bronzeLevel], [999, 9999][bronzeLevel]);
    const digits = String(number).split("").map(Number);
    const parts = digits.map((d, i) => d * 10 ** (digits.length - i - 1)).filter(Boolean);
    return {
      prompt: `Write ${parts.join(" + ")} as a number.`,
      answer: String(number),
    };
  }

  const pupils = rand([25, 55][bronzeLevel], [90, 160][bronzeLevel]);
  const items = rand([5, 12][bronzeLevel], [16, 36][bronzeLevel]);
  const extra = rand([20, 100][bronzeLevel], [180, 700][bronzeLevel]);

  return {
    prompt: `${pupils} pupils each get ${items} pencils. There are ${extra} extra pencils. How many pencils altogether?`,
    answer: String(pupils * items + extra),
  };
}

function silverQuestion(difficulty, pressureLevel = 0) {
  const level = difficultyIndex(difficulty);
  const pressure = pressureTier(pressureLevel);

  const types = [
    ["round", "factor", "multiple", "square", "simpleMixed"],
    ["factor", "multiple", "lcm", "hcf", "square", "missingOperation", "mediumMixed"],
    ["mixedHard", "lcm", "hcf", "square", "divisible", "missingOperation"],
  ][level];

  const type = pick(pressure > 0 ? types.slice(Math.max(0, types.length - 3)) : types);

  if (type === "round") {
    const value = rand(110, 999);
    const place = pick([10, 100]);
    return {
      prompt: `Round ${value} to the nearest ${place}.`,
      answer: String(Math.round(value / place) * place),
    };
  }

  if (type === "factor") {
    const value = pick(
      level === 0
        ? [12, 16, 18, 20, 24]
        : level === 1
        ? [30, 36, 42, 48, 54, 60]
        : [72, 84, 90, 96, 108, 120]
    );

    const factors = Array.from({ length: value }, (_, i) => i + 1).filter((n) => value % n === 0);

    return {
      prompt: `How many factors does ${value} have?`,
      answer: String(factors.length),
    };
  }

  if (type === "multiple") {
    const base = rand([2, 5, 9][level], [7, 11, 18][level]);
    const count = rand([3, 6, 10][level], [8, 12, 22][level]);

    return {
      prompt: `Find the ${count}th multiple of ${base}.`,
      answer: String(base * count),
    };
  }

  if (type === "lcm") {
    const a = rand(level === 1 ? 4 : 9, level === 1 ? 10 : 24);
    const b = rand(level === 1 ? 5 : 10, level === 1 ? 12 : 30);

    let lcm = Math.max(a, b);
    while (lcm % a !== 0 || lcm % b !== 0) lcm++;

    return { prompt: `What is the LCM of ${a} and ${b}?`, answer: String(lcm) };
  }

  if (type === "hcf") {
    const common = rand(level === 1 ? 2 : 4, level === 1 ? 6 : 14);
    const a = common * rand(level === 1 ? 3 : 5, level === 1 ? 8 : 15);
    const b = common * rand(level === 1 ? 4 : 6, level === 1 ? 9 : 18);

    let hcf = 1;
    for (let i = 1; i <= Math.min(a, b); i++) {
      if (a % i === 0 && b % i === 0) hcf = i;
    }

    return { prompt: `What is the HCF of ${a} and ${b}?`, answer: String(hcf) };
  }

  if (type === "square") {
    const n = rand([3, 8, 15][level], [12, 20, 35][level]);
    return { prompt: `What is ${n} squared?`, answer: String(n * n) };
  }

  if (type === "divisible") {
    const divisor = pick([4, 6, 8, 9, 12]);
    const answer = divisor * rand(12, 45);

    return {
      prompt: `Which number is divisible by ${divisor}: ${answer}, ${answer + 3}, or ${answer + 5}?`,
      answer: String(answer),
    };
  }

  if (type === "missingOperation") {
    const a = rand(level === 1 ? 8 : 18, level === 1 ? 30 : 75);
    const b = rand(level === 1 ? 3 : 6, level === 1 ? 14 : 28);
    const result = a * b;

    return {
      prompt: `What number is missing? ${a} x ___ = ${result}`,
      answer: String(b),
    };
  }

  if (type === "mixedHard") {
    const a = rand(400, 1800);
    const b = rand(18, 70);
    const c = rand(8, 24);
    const d = rand(120, 900);

    return {
      prompt: `${a} + ${b} x ${c} - ${d} = ?`,
      answer: String(a + b * c - d),
    };
  }

  if (type === "mediumMixed") {
    const a = rand(80, 350);
    const b = rand(6, 18);
    const c = rand(4, 12);
    return {
      prompt: `${a} + ${b} x ${c} = ?`,
      answer: String(a + b * c),
    };
  }

  const a = rand(30, 160);
  const b = rand(3, 12);
  const c = rand(2, 8);

  return {
    prompt: `${a} + ${b} x ${c} = ?`,
    answer: String(a + b * c),
  };
}

function goldQuestion(difficulty, pressureLevel = 0) {
  const level = difficultyIndex(difficulty);
  const pressure = pressureTier(pressureLevel);

  const types = [
    ["fraction", "decimalAdd", "percent", "money", "area"],
    ["fraction", "decimalSubtract", "percentHard", "discount", "increase", "perimeter", "area"],
    ["fractionHard", "decimalMixed", "percentHard", "discount", "increase", "area", "conversion"],
  ][level];

  const type = pick(pressure > 0 ? types.slice(Math.max(0, types.length - 3)) : types);

  if (type === "fraction") {
    const denominator = pick(level === 0 ? [4, 5, 8, 10] : [6, 8, 10, 12, 15]);
    const numerator = rand(level === 0 ? 1 : 2, denominator - 1);
    const whole = denominator * rand([5, 12, 50][level], [24, 50, 180][level]);

    return {
      prompt: `Find ${numerator}/${denominator} of ${whole}.`,
      answer: formatNumber((whole * numerator) / denominator),
    };
  }

  if (type === "fractionHard") {
    const denominator = pick([8, 9, 12, 15, 18, 20]);
    const numerator = rand(2, denominator - 1);
    const whole = denominator * rand(40, 160);

    return {
      prompt: `A farmer harvested ${whole} mangoes. He sold ${numerator}/${denominator} of them. How many did he sell?`,
      answer: formatNumber((whole * numerator) / denominator),
    };
  }

  if (type === "decimalAdd") {
    const a = rand(120, 900) / 10;
    const b = rand(80, 800) / 10;

    return {
      prompt: `${formatNumber(a)} + ${formatNumber(b)} = ?`,
      answer: formatNumber(a + b),
    };
  }

  if (type === "decimalSubtract") {
    const a = rand(800, 5000) / 10;
    const b = rand(200, 799) / 10;

    return {
      prompt: `${formatNumber(a)} - ${formatNumber(b)} = ?`,
      answer: formatNumber(a - b),
    };
  }

  if (type === "decimalMixed") {
    const a = rand(2500, 12000) / 10;
    const b = rand(80, 450) / 10;
    const c = rand(6, 18);

    return {
      prompt: `${formatNumber(a)} + ${formatNumber(b)} × ${c} = ?`,
      answer: formatNumber(a + b * c),
    };
  }

  if (type === "percent") {
    const percent = pick([15, 20, 25, 30, 40, 45, 50, 75]);
    const amount = rand(10, 90) * 10;

    return {
      prompt: `Calculate ${percent}% of ${amount}.`,
      answer: formatNumber((percent / 100) * amount),
    };
  }

  if (type === "percentHard") {
    const percent = pick([12, 15, 18, 22, 35, 45, 60, 80]);
    const amount = rand([30, 50, 80][level], [140, 220, 400][level]) * 10;

    return {
      prompt: `Calculate ${percent}% of ${amount}.`,
      answer: formatNumber((percent / 100) * amount),
    };
  }

  if (type === "discount") {
    const price = rand([20, 50, 100][level], [100, 300, 800][level]) * 10;
    const discount = pick([10, 15, 20, 25, 30, 40]);

    return {
      prompt: `An item costs ₦${price}. A ${discount}% discount is given. What is the new price?`,
      answer: formatNumber(price * (1 - discount / 100)),
    };
  }

  if (type === "increase") {
    const price = rand([20, 50, 100][level], [100, 300, 800][level]) * 10;
    const increase = pick([10, 15, 20, 25, 30, 40]);

    return {
      prompt: `A price of ₦${price} increases by ${increase}%. What is the new price?`,
      answer: formatNumber(price * (1 + increase / 100)),
    };
  }

  if (type === "money") {
    const cost = rand(100, 900);
    const quantity = rand(5, 20);

    return {
      prompt: `One notebook costs ₦${cost}. What is the cost of ${quantity} notebooks?`,
      answer: String(cost * quantity),
    };
  }

  if (type === "perimeter") {
    const length = rand(20, 80);
    const width = rand(10, 50);

    return {
      prompt: `Find the perimeter of a rectangle with length ${length} cm and width ${width} cm.`,
      answer: String(2 * (length + width)),
    };
  }

  if (type === "area") {
    const length = rand([8, 15, 25][level], [30, 60, 120][level]);
    const width = rand([5, 12, 20][level], [25, 50, 100][level]);

    return {
      prompt: `Find the area of a rectangle with length ${length} cm and width ${width} cm.`,
      answer: String(length * width),
    };
  }

  const metres = rand([5, 20, 50][level], [30, 100, 500][level]);

  return {
    prompt: `Convert ${metres} metres to centimetres.`,
    answer: String(metres * 100),
  };
}

function championQuestion(difficulty, pressureLevel = 0) {
  const level = difficultyIndex(difficulty);
  const pressure = pressureTier(pressureLevel);

  const types = [
    ["fractionOf", "percentage", "ratio", "average", "brackets", "unitary", "perimeter"],
    ["fractionOf", "percentage", "ratio", "average", "speed", "unitary", "algebra", "area"],
    ["fractionHard", "percentageHard", "ratioHard", "averageHard", "speedHard", "unitaryHard", "algebraHard", "mixedHard"],
  ][level];

  const type = pick(pressure > 0 ? types.slice(Math.max(0, types.length - 3)) : types);

  if (type === "fractionOf") {
    const denominator = pick(level === 0 ? [4, 5, 8, 10] : [6, 8, 9, 12]);
    const numerator = rand(level === 0 ? 1 : 2, denominator - 1);
    const whole = denominator * rand(level === 0 ? 6 : 10, level === 0 ? 24 : 45);

    return {
      prompt: `Find ${numerator}/${denominator} of ${whole}.`,
      answer: formatNumber((whole * numerator) / denominator),
    };
  }

  if (type === "fractionHard") {
    const denominator = pick([8, 10, 12, 15, 16, 20]);
    const numerator = rand(3, denominator - 2);
    const whole = denominator * rand(12, 60);

    return {
      prompt: `${numerator}/${denominator} of ${whole} = ?`,
      answer: formatNumber((whole * numerator) / denominator),
    };
  }

  if (type === "percentage") {
    const percent = pick(level === 0 ? [10, 20, 25, 50] : [5, 10, 15, 20, 25, 30, 40]);
    const value = (100 / gcd(percent, 100)) * rand(level === 0 ? 2 : 4, level === 0 ? 12 : 25);

    return {
      prompt: `Find ${percent}% of ${value}.`,
      answer: formatNumber((percent / 100) * value),
    };
  }

  if (type === "percentageHard") {
    const percent = pick([12.5, 15, 20, 25, 30, 37.5, 40]);
    const value = percent === 12.5 || percent === 37.5 ? 8 * rand(15, 90) : 20 * rand(8, 60);

    return {
      prompt: `Find ${formatNumber(percent)}% of ${value}.`,
      answer: formatNumber((percent / 100) * value),
    };
  }

  if (type === "ratio") {
    const a = rand(level === 0 ? 2 : 3, level === 0 ? 7 : 10);
    const b = rand(level === 0 ? 3 : 4, level === 0 ? 9 : 12);
    const total = (a + b) * rand(level === 0 ? 6 : 10, level === 0 ? 22 : 35);

    return {
      prompt: `Share ${total} in the ratio ${a}:${b}. What is the second share?`,
      answer: String((total / (a + b)) * b),
    };
  }

  if (type === "ratioHard") {
    const a = rand(3, 9);
    const b = rand(4, 12);
    const c = rand(2, 8);
    const total = (a + b + c) * rand(12, 45);

    return {
      prompt: `Share ${total} in the ratio ${a}:${b}:${c}. What is the second share?`,
      answer: String((total / (a + b + c)) * b),
    };
  }

  if (type === "speed") {
    const speed = rand(35, 95);
    const time = rand(2, 6);

    return {
      prompt: `A car travels at ${speed} km/h for ${time} hours. What distance does it cover?`,
      answer: String(speed * time),
    };
  }

  if (type === "speedHard") {
    const time = rand(3, 8);
    const speed = rand(45, 120);
    const distance = speed * time;

    return {
      prompt: `A bus travels ${distance} km in ${time} hours. What is its average speed?`,
      answer: String(speed),
    };
  }

  if (type === "average") {
    const average = rand(level === 0 ? 12 : 20, level === 0 ? 60 : 90);
    const offsetA = rand(2, level === 0 ? 12 : 20);
    const offsetB = rand(2, level === 0 ? 12 : 20);
    const a = average - offsetA;
    const b = average + offsetB;
    const c = average * 3 - a - b;

    return {
      prompt: `Find the average of ${a}, ${b}, and ${c}.`,
      answer: String(average),
    };
  }

  if (type === "averageHard") {
    const average = rand(30, 120);
    const a = average - rand(4, 18);
    const b = average + rand(3, 22);
    const c = average - rand(2, 16);
    const d = average + rand(5, 25);
    const e = average * 5 - a - b - c - d;

    return {
      prompt: `Find the average of ${a}, ${b}, ${c}, ${d}, and ${e}.`,
      answer: String(average),
    };
  }

  if (type === "unitary") {
    const one = rand(level === 0 ? 3 : 4, level === 0 ? 8 : 12);
    const unitPrice = rand(level === 0 ? 15 : 25, level === 0 ? 80 : 120);
    const many = rand(level === 0 ? 5 : 8, level === 0 ? 15 : 24);
    const cost = one * unitPrice;

    return {
      prompt: `If ${one} books cost NGN ${cost}, what is the cost of ${many} books?`,
      answer: String(unitPrice * many),
    };
  }

  if (type === "unitaryHard") {
    const one = rand(6, 15);
    const unitPrice = rand(35, 180);
    const many = rand(12, 35);
    const cost = one * unitPrice;

    return {
      prompt: `If ${one} pens cost NGN ${cost}, how much will ${many} pens cost?`,
      answer: String(unitPrice * many),
    };
  }

  if (type === "algebra") {
    const x = rand(8, 40);
    const multiplier = rand(3, 12);
    const add = rand(15, 90);
    const result = x * multiplier + add;

    return {
      prompt: `Solve for x: ${multiplier}x + ${add} = ${result}`,
      answer: String(x),
    };
  }

  if (type === "algebraHard") {
    const x = rand(12, 80);
    const multiplier = rand(4, 18);
    const subtract = rand(25, 160);
    const result = multiplier * x - subtract;

    return {
      prompt: `Solve for x: ${multiplier}x - ${subtract} = ${result}`,
      answer: String(x),
    };
  }

  if (type === "perimeter") {
    const length = rand(12, 55);
    const width = rand(6, 30);
    return {
      prompt: `Find the perimeter of a rectangle ${length} cm by ${width} cm.`,
      answer: String(2 * (length + width)),
    };
  }

  if (type === "area") {
    const length = rand(12, 45);
    const width = rand(8, 30);
    return {
      prompt: `Find the area of a rectangle ${length} cm by ${width} cm.`,
      answer: String(length * width),
    };
  }

  if (type === "mixedHard") {
    const a = rand(120, 650);
    const b = rand(40, 240);
    const c = rand(6, 18);
    const d = rand(80, 700);

    return {
      prompt: `(${a} + ${b}) x ${c} - ${d} = ?`,
      answer: String((a + b) * c - d),
    };
  }

  const a = rand(level === 0 ? 40 : 80, level === 0 ? 180 : 350);
  const b = rand(level === 0 ? 10 : 25, level === 0 ? 70 : 150);
  const c = rand(level === 0 ? 3 : 4, level === 0 ? 9 : 14);

  return {
    prompt: `(${a} + ${b}) x ${c} = ?`,
    answer: String((a + b) * c),
  };
}

export function generateRaceQuestion(leagueId, difficulty, pressureLevel = 0) {
  const generator = {
    bronze: bronzeQuestionV2,
    silver: silverQuestion,
    gold: goldQuestion,
    champion: championQuestion,
  }[leagueId] || bronzeQuestion;

  const question = generator(difficulty, pressureLevel);

  return {
    ...question,
    choices: makeChoices(question.answer),
  };
}

export function getLeagueById(leagueId) {
  return LEAGUES.find((league) => league.id === leagueId) || LEAGUES[0];
}
