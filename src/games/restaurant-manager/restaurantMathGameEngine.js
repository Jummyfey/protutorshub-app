export const CLASS_LEVELS = [
  { id: "basic4", label: "Basic 4", subtitle: "Whole numbers, simple money, sharing" },
  { id: "basic5", label: "Basic 5", subtitle: "Larger totals, change, missing values" },
  { id: "basic6", label: "Basic 6", subtitle: "BODMAS, estimation, efficient change" },
];

export const DIFFICULTY_SETTINGS = {
  easy: {
    id: "easy",
    label: "Easy",
    maxCustomersInside: 2,
    firstCustomerDelay: 1000,
    arrivalIntervalMin: 18000,
    arrivalIntervalMax: 24000,
    activePatienceRate: 0.5,
    waitingPatienceRate: 0.2,
    timeMultiplier: 1.4,
    maxOrderItems: 2,
    maxQuestionSteps: 1,
    totalCustomers: 6,
    baseTimeSeconds: 240,
    skipCount: 3,
  },
  medium: {
    id: "medium",
    label: "Medium",
    maxCustomersInside: 3,
    firstCustomerDelay: 1000,
    arrivalIntervalMin: 12000,
    arrivalIntervalMax: 18000,
    activePatienceRate: 0.75,
    waitingPatienceRate: 0.3,
    timeMultiplier: 1.15,
    maxOrderItems: 3,
    maxQuestionSteps: 2,
    totalCustomers: 10,
    baseTimeSeconds: 280,
    skipCount: 2,
  },
  difficult: {
    id: "difficult",
    label: "Difficult",
    maxCustomersInside: 4,
    firstCustomerDelay: 1000,
    arrivalIntervalMin: 8000,
    arrivalIntervalMax: 13000,
    activePatienceRate: 1,
    waitingPatienceRate: 0.4,
    timeMultiplier: 1,
    maxOrderItems: 4,
    maxQuestionSteps: 3,
    totalCustomers: 12,
    baseTimeSeconds: 300,
    skipCount: 1,
  },
};

export const PATIENCE_RULES = {
  tickIntervalMs: 1500,
  wrongFoodPenalty: 4,
  wrongQuantityPenalty: 4,
  wrongAnswerPenalty: 6,
  wrongChangePenalty: 6,
  hintPenalty: 2,
  correctActionRecovery: 3,
};

export const SCORING_RULES = {
  correctFood: 15,
  correctQuantity: 20,
  correctAnswer: 50,
  correctMultiStepQuestion: 80,
  correctChange: 50,
  correctCashSelection: 30,
  customerCompleted: 40,
  noMistakeBonus: 30,
  maximumSpeedBonus: 40,
};

export const FOOD_CATALOG = [
  { id: "croissant-tray", name: "Croissant", plural: "Croissants", price: 300, image: "croissant", proceduralType: "croissant", initialStock: 10 },
  { id: "hotdog-tray", name: "Hotdog", plural: "Hotdogs", price: 350, image: "hotdog", proceduralType: "hotdog", initialStock: 10 },
  { id: "hamburger-tray", name: "Hamburger", plural: "Hamburgers", price: 600, image: "burger", proceduralType: "hamburger", initialStock: 10 },
  { id: "cupcake-tray", name: "Cupcake", plural: "Cupcakes", price: 400, image: "cupcake", proceduralType: "cupcake", initialStock: 10 },
  { id: "doughnut-tray", name: "Doughnut", plural: "Doughnuts", price: 250, image: "doughnut", proceduralType: "doughnut", initialStock: 10 },
  { id: "fruit-cup-tray", name: "Fruit cup", plural: "Fruit cups", price: 450, image: "fruitCup", proceduralType: "fruitCup", initialStock: 10 },
  { id: "cheese-tray", name: "Cheese portion", plural: "Cheese portions", price: 450, image: "cheese", proceduralType: "cheese", initialStock: 10 },
  { id: "pizza-tray", name: "Whole pizza", plural: "Whole pizzas", price: 1200, image: "pizza", proceduralType: "pizza", initialStock: 10 },
  { id: "meatpie-tray", name: "Meat pie", plural: "Meat pies", price: 500, image: "meatpie", proceduralType: "meatpie", initialStock: 10 },
  { id: "fries-tray", name: "Fries cup", plural: "Fries cups", price: 400, image: "fries", proceduralType: "friesCup", initialStock: 10 },
];

const CUSTOMER_IMAGES = [
  "/assets/restaurant-manager/customers/full-body-samples/young-male-full.png",
  "/assets/restaurant-manager/customers/full-body-samples/young-female-full.png",
  "/assets/restaurant-manager/customers/full-body-samples/middle-aged-male-full.png",
  "/assets/restaurant-manager/customers/full-body-samples/old-male-full.png",
];

export const QUESTION_TYPES = {
  quantity: {
    heading: "Serve The Correct Quantity",
    stages: ["select_food", "check_quantity", "deliver_food"],
    title: "Quantity serving",
  },
  itemCost: {
    heading: "Calculate The Item Cost",
    stages: ["select_food", "calculate_item_cost", "deliver_food"],
    title: "Multiplication",
  },
  total: {
    heading: "Calculate The Total",
    stages: ["select_food", "calculate_line_totals", "calculate_order_total", "deliver_food"],
    title: "Total bill",
  },
  change: {
    heading: "Calculate The Change",
    stages: ["calculate_order_total", "show_customer_payment", "calculate_change", "complete_transaction"],
    title: "Money and change",
  },
  division: {
    heading: "Divide The Bill",
    stages: ["calculate_order_total", "divide_bill", "submit_answer", "complete_transaction"],
    title: "Equal sharing",
  },
  estimation: {
    heading: "Estimate The Total",
    stages: ["estimate_total", "calculate_exact_total", "compare_estimate", "complete_transaction"],
    title: "Estimation",
  },
  bodmas: {
    heading: "Calculate The Exact Total",
    stages: ["calculate_order_total", "submit_answer", "complete_transaction"],
    title: "BODMAS",
  },
};

export function formatNaira(value) {
  const numeric = Number(value) || 0;
  return `N${numeric.toLocaleString("en-NG", { maximumFractionDigits: 2 })}`;
}

export function calculateLineTotal(item) {
  return roundMoney((Number(item.quantity) || 0) * (Number(item.price) || 0));
}

export function calculateOrderTotal(items) {
  return roundMoney(items.reduce((total, item) => total + calculateLineTotal(item), 0));
}

export function calculateChange(total, paid) {
  return roundMoney((Number(paid) || 0) - (Number(total) || 0));
}

export function divideBill(total, people) {
  return roundMoney((Number(total) || 0) / Math.max(1, Number(people) || 1));
}

export function estimateOrderTotal(items, nearest = 100) {
  return items.reduce((sum, item) => sum + Math.round(item.price / nearest) * nearest * item.quantity, 0);
}

export function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

export function createInitialStock() {
  return Object.fromEntries(FOOD_CATALOG.map((food) => [food.id, food.initialStock]));
}

export function createLevelConfig(classLevel, difficulty) {
  const difficultyConfig = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.easy;
  const classTopics = {
    basic4: ["quantity", "itemCost", "total", "change", "division"],
    basic5: ["itemCost", "total", "change", "division"],
    basic6: ["total", "change", "division", "estimation", "bodmas"],
  };
  return {
    levelId: `${classLevel}-${difficulty}-restaurant-math-01`,
    classLevel,
    difficulty,
    topic: QUESTION_TYPES[(classTopics[classLevel] || classTopics.basic4)[0]].title,
    maxCustomersInside: difficultyConfig.maxCustomersInside,
    totalCustomers: difficultyConfig.totalCustomers,
    levelTimeSeconds: Math.round(difficultyConfig.baseTimeSeconds * difficultyConfig.timeMultiplier),
    questionTypes: classTopics[classLevel] || classTopics.basic4,
    paymentRequired: classLevel !== "basic4" || difficulty !== "easy",
    changeRequired: false,
    cashSelectionRequired: difficulty === "difficult",
    maxOrderItems: difficultyConfig.maxOrderItems,
    maxQuestionSteps: difficultyConfig.maxQuestionSteps,
    maxQuantity: classLevel === "basic4" ? (difficulty === "easy" ? 4 : 6) : difficulty === "easy" ? 5 : 8,
    skipCount: difficultyConfig.skipCount,
    scoringTarget: difficulty === "easy" ? 700 : difficulty === "medium" ? 1200 : 1700,
    accuracyTarget: difficulty === "easy" ? 60 : difficulty === "medium" ? 75 : 90,
  };
}

export function chooseQuestionType(level, index) {
  const sequenceByClassAndDifficulty = {
    basic4: {
      easy: ["quantity", "itemCost", "total"],
      medium: ["total", "change", "division"],
      difficult: ["total", "itemCost", "change", "division"],
    },
    basic5: {
      easy: ["itemCost", "total", "division"],
      medium: ["total", "change", "division"],
      difficult: ["total", "change", "division"],
    },
    basic6: {
      easy: ["bodmas", "estimation", "total"],
      medium: ["estimation", "total", "change", "division"],
      difficult: ["bodmas", "estimation", "change", "division"],
    },
  };
  const sequence = sequenceByClassAndDifficulty[level.classLevel]?.[level.difficulty] || ["quantity"];
  return sequence[index % sequence.length];
}

export function generateQuestion(level, index, stock = createInitialStock()) {
  const type = chooseQuestionType(level, index);
  const itemCount = Math.min(level.maxOrderItems, type === "itemCost" || type === "quantity" ? 1 : 2 + (index % Math.max(1, level.maxOrderItems - 1)));
  const orderItems = chooseOrderItems(level, index, itemCount, stock);
  const total = calculateOrderTotal(orderItems);
  const template = QUESTION_TYPES[type] || QUESTION_TYPES.quantity;
  const question = {
    id: `${level.levelId}-q${index + 1}`,
    classLevel: level.classLevel,
    difficulty: level.difficulty,
    topic: template.title,
    questionType: type,
    heading: template.heading,
    orderedItems: orderItems,
    requiredStages: [...template.stages],
    answer: total,
    paymentRequired: false,
    changeRequired: false,
    foodSelectionRequired: template.stages.includes("select_food"),
    cashSelectionRequired: false,
    estimatedAnswerRequired: type === "estimation",
    attempts: 0,
  };

  if (type === "quantity") {
    question.prompt = `Serve ${orderItems[0].quantity} ${orderItems[0].quantity === 1 ? orderItems[0].name : orderItems[0].plural}.`;
    question.answer = null;
  } else if (type === "itemCost") {
    question.prompt = `${orderItems[0].quantity} ${orderItems[0].plural} cost ${formatNaira(orderItems[0].price)} each. Find the total.`;
    question.answer = calculateLineTotal(orderItems[0]);
  } else if (type === "change") {
    const paymentStep = level.classLevel === "basic4" ? 500 : 1000;
    question.paymentRequired = true;
    question.changeRequired = true;
    question.cashSelectionRequired = level.cashSelectionRequired;
    question.amountPaid = Math.ceil((total + paymentStep) / paymentStep) * paymentStep;
    question.answer = calculateChange(total, question.amountPaid);
    question.prompt = `The bill is ${formatNaira(total)}. The customer pays ${formatNaira(question.amountPaid)}. Find the change.`;
  } else if (type === "division") {
    const people = level.classLevel === "basic4" ? 2 + (index % 3) : 2 + (index % 4);
    const divisibleTotal = Math.ceil(total / people / 50) * people * 50;
    question.people = people;
    question.answer = divideBill(divisibleTotal, people);
    question.prompt = `${people} customers share a ${formatNaira(divisibleTotal)} bill equally. How much does each person pay?`;
  } else if (type === "estimation") {
    question.estimatedAnswerRequired = true;
    question.answer = estimateOrderTotal(orderItems);
    question.exactAnswer = total;
    question.prompt = "Estimate the bill by rounding each price to the nearest hundred.";
  } else if (type === "bodmas") {
    question.answer = total;
    question.prompt = `Solve: ${orderItems.map((item) => `(${item.quantity} x ${formatNaira(item.price)})`).join(" + ")}`;
  } else {
    question.prompt = "Find the total amount the customer should pay.";
  }

  validateQuestion(question);
  return question;
}

export function chooseOrderItems(level, index, itemCount, stock) {
  const permittedFoods = FOOD_CATALOG.filter((food) => (stock[food.id] ?? 0) > 0);
  const offset = index % permittedFoods.length;
  const selected = [];
  for (let step = 0; step < itemCount && selected.length < permittedFoods.length; step += 1) {
    const food = permittedFoods[(offset + step * 2) % permittedFoods.length];
    const maxQuantity = Math.min(level.maxQuantity, stock[food.id] || food.initialStock);
    const quantity = Math.max(1, Math.min(maxQuantity, 1 + ((index + step) % Math.max(1, Math.min(maxQuantity, 4)))));
    selected.push({ ...food, quantity });
  }
  return selected;
}

export function validateQuestion(question) {
  if (!question.orderedItems?.length && question.foodSelectionRequired) {
    throw new Error(`Question ${question.id} has no order items.`);
  }
  if (question.classLevel === "basic4" && question.orderedItems?.some((item) => !Number.isInteger(item.price))) {
    throw new Error("Basic 4 questions cannot use decimal prices.");
  }
  if (question.changeRequired && question.amountPaid < calculateOrderTotal(question.orderedItems)) {
    throw new Error("Change question cannot have payment below total.");
  }
  if (!question.changeRequired && question.requiredStages.includes("calculate_change")) {
    throw new Error("Non-change question cannot activate change.");
  }
  return true;
}

export function createCustomer(level, index, stock = createInitialStock()) {
  const question = generateQuestion(level, index, stock);
  return {
    id: `customer-${index + 1}`,
    imagePath: CUSTOMER_IMAGES[index % CUSTOMER_IMAGES.length],
    order: question.orderedItems,
    question,
    patience: 100,
    state: index === 0 ? "active" : "waiting",
    mistakes: 0,
    hintsUsed: 0,
    arrivedAt: Date.now(),
  };
}

export function getMoodFromPatience(patience) {
  if (patience > 60) return "happy";
  if (patience > 30) return "neutral";
  return "angry";
}

export function updateCustomerPatience(customers, difficulty, paused = false) {
  if (paused) return customers;
  const settings = DIFFICULTY_SETTINGS[difficulty] || DIFFICULTY_SETTINGS.easy;
  return customers.map((customer, index) => {
    const rate = index === 0 ? settings.activePatienceRate : settings.waitingPatienceRate;
    return {
      ...customer,
      patience: Math.max(0, roundMoney(customer.patience - rate)),
    };
  });
}

export function canAdmitCustomer(customers, level, generatedCount, paused = false) {
  return !paused && generatedCount < level.totalCustomers && customers.length < level.maxCustomersInside;
}

export function promoteQueue(customers) {
  return customers.map((customer, index) => ({
    ...customer,
    state: index === 0 ? "active" : "waiting",
  }));
}

export function getRequiredQuantityMap(question) {
  return Object.fromEntries((question.orderedItems || []).map((item) => [item.id, item.quantity]));
}

export function getSelectedTotal(selectedFood) {
  return Object.values(selectedFood).reduce((total, value) => total + value, 0);
}

export function validateFoodSelection(question, selectedFood) {
  const required = getRequiredQuantityMap(question);
  const missing = [];
  const extra = [];
  Object.entries(required).forEach(([foodId, quantity]) => {
    const selected = selectedFood[foodId] || 0;
    if (selected < quantity) missing.push({ foodId, missing: quantity - selected, required: quantity, selected });
    if (selected > quantity) extra.push({ foodId, extra: selected - quantity, required: quantity, selected });
  });
  Object.entries(selectedFood).forEach(([foodId, selected]) => {
    if (!required[foodId] && selected > 0) extra.push({ foodId, extra: selected, required: 0, selected });
  });
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

export function applyFoodSelection(stock, foodId, delta) {
  const current = stock[foodId] ?? 0;
  return {
    ...stock,
    [foodId]: Math.max(0, current - delta),
  };
}

export function restoreTemporaryFood(stock, selectedFood) {
  const restored = { ...stock };
  Object.entries(selectedFood).forEach(([foodId, quantity]) => {
    restored[foodId] = (restored[foodId] || 0) + quantity;
  });
  return restored;
}

export function validateNumericAnswer(question, rawAnswer) {
  const numeric = Number(rawAnswer);
  if (!Number.isFinite(numeric)) return false;
  return Math.abs(roundMoney(numeric) - roundMoney(question.answer)) < 0.01;
}

export function getHintForQuestion(question, attempt = 0) {
  if (question.questionType === "itemCost") {
    return attempt > 0 ? "Quantity x Unit price" : "Multiply the number of items by the price of one.";
  }
  if (question.questionType === "total" || question.questionType === "bodmas") {
    return attempt > 0 ? "Add each line total after multiplying." : "Find each item's cost, then add the costs.";
  }
  if (question.questionType === "change") return "Change = Amount paid - Total bill.";
  if (question.questionType === "division") return "Divide the total equally.";
  if (question.questionType === "estimation") return "Round each price before adding.";
  return "Check the customer's order and serve the exact quantity.";
}

export function calculateQuestionScore(question, mistakes = 0, hintsUsed = 0, patience = 100) {
  let score = 0;
  if (question.foodSelectionRequired) score += SCORING_RULES.correctFood + SCORING_RULES.correctQuantity;
  if (question.answer !== null) score += question.requiredStages.length > 3 ? SCORING_RULES.correctMultiStepQuestion : SCORING_RULES.correctAnswer;
  if (question.changeRequired) score += SCORING_RULES.correctChange;
  if (question.cashSelectionRequired) score += SCORING_RULES.correctCashSelection;
  score += SCORING_RULES.customerCompleted;
  if (mistakes === 0) score += SCORING_RULES.noMistakeBonus;
  if (patience > 80) score += SCORING_RULES.maximumSpeedBonus;
  return Math.max(0, Math.round(score - mistakes * 18 - hintsUsed * 10));
}

export function getLevelStars({ accuracy, served, target, hintsUsed }) {
  if (accuracy >= 90 && served >= target && hintsUsed <= 2) return 3;
  if (accuracy >= 75 && served >= target) return 2;
  if (accuracy >= 60) return 1;
  return 0;
}

export function handleKeypadInput(current, key, { allowDecimal = false } = {}) {
  if (key === "C") return "";
  if (key === "backspace") return current.slice(0, -1);
  if (key === ".") {
    if (!allowDecimal || current.includes(".")) return current;
    return current ? `${current}.` : "0.";
  }
  if (!/^\d$/.test(key)) return current;
  const next = `${current}${key}`.replace(/^0+(?=\d)/, "");
  return next.slice(0, 10);
}

