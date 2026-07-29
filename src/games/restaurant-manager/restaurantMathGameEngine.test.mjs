import assert from "node:assert/strict";
import {
  applyFoodSelection,
  calculateChange,
  canAdmitCustomer,
  createCustomer,
  createInitialStock,
  createLevelConfig,
  DIFFICULTY_SETTINGS,
  generateQuestion,
  getMoodFromPatience,
  handleKeypadInput,
  promoteQueue,
  restoreTemporaryFood,
  updateCustomerPatience,
  validateFoodSelection,
  validateNumericAnswer,
} from "./restaurantMathGameEngine.js";

const b4Easy = createLevelConfig("basic4", "easy");
const b5Medium = createLevelConfig("basic5", "medium");
const b6Difficult = createLevelConfig("basic6", "difficult");

assert.equal(DIFFICULTY_SETTINGS.easy.maxCustomersInside, 2);
assert.equal(DIFFICULTY_SETTINGS.medium.maxCustomersInside, 3);
assert.equal(DIFFICULTY_SETTINGS.difficult.maxCustomersInside, 4);
assert.equal(b4Easy.maxCustomersInside, 2);
assert.equal(b5Medium.maxCustomersInside, 3);
assert.equal(b6Difficult.maxCustomersInside, 4);

let customers = [createCustomer(b6Difficult, 0), createCustomer(b6Difficult, 1), createCustomer(b6Difficult, 2), createCustomer(b6Difficult, 3)];
assert.equal(canAdmitCustomer(customers, b6Difficult, 4), false);
customers = [createCustomer(b5Medium, 0), createCustomer(b5Medium, 1)];
assert.equal(canAdmitCustomer(customers, b5Medium, 2), true);

const promoted = promoteQueue([createCustomer(b5Medium, 1), createCustomer(b5Medium, 2)]);
assert.equal(promoted.filter((customer) => customer.state === "active").length, 1);
assert.equal(promoted[0].state, "active");
assert.equal(promoted[1].state, "waiting");

const patienceBefore = [createCustomer(b6Difficult, 0), createCustomer(b6Difficult, 1)];
const patienceAfter = updateCustomerPatience(patienceBefore, "difficult");
assert.ok(patienceAfter[0].patience < patienceBefore[0].patience);
assert.ok(patienceAfter[1].patience < patienceBefore[1].patience);
assert.ok((patienceBefore[0].patience - patienceAfter[0].patience) > (patienceBefore[1].patience - patienceAfter[1].patience));
assert.deepEqual(updateCustomerPatience(patienceBefore, "difficult", true), patienceBefore);
assert.equal(getMoodFromPatience(80), "happy");
assert.equal(getMoodFromPatience(50), "neutral");
assert.equal(getMoodFromPatience(20), "angry");

const stock = createInitialStock();
const quantityQuestion = generateQuestion(b4Easy, 0, stock);
assert.equal(quantityQuestion.requiredStages.includes("calculate_change"), false);
assert.equal(quantityQuestion.changeRequired, false);

const selectedFood = { [quantityQuestion.orderedItems[0].id]: quantityQuestion.orderedItems[0].quantity };
assert.equal(validateFoodSelection(quantityQuestion, selectedFood).ok, true);
assert.equal(validateFoodSelection(quantityQuestion, {}).ok, false);

const reducedStock = applyFoodSelection(stock, quantityQuestion.orderedItems[0].id, 1);
assert.equal(reducedStock[quantityQuestion.orderedItems[0].id], stock[quantityQuestion.orderedItems[0].id] - 1);
const restoredStock = restoreTemporaryFood(reducedStock, { [quantityQuestion.orderedItems[0].id]: 1 });
assert.equal(restoredStock[quantityQuestion.orderedItems[0].id], stock[quantityQuestion.orderedItems[0].id]);

const changeQuestion = Array.from({ length: 8 }, (_, index) => generateQuestion(b5Medium, index, stock))
  .find((question) => question.questionType === "change");
assert.ok(changeQuestion);
assert.equal(changeQuestion.changeRequired, true);
assert.equal(changeQuestion.requiredStages.includes("calculate_change"), true);
assert.equal(validateNumericAnswer(changeQuestion, String(calculateChange(
  changeQuestion.orderedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
  changeQuestion.amountPaid
))), true);

const b4Questions = Array.from({ length: 8 }, (_, index) => generateQuestion(b4Easy, index, stock));
assert.equal(b4Questions.some((question) => question.questionType === "estimation" || question.questionType === "bodmas"), false);

const b6Questions = Array.from({ length: 8 }, (_, index) => generateQuestion(b6Difficult, index, stock));
assert.equal(b6Questions.some((question) => question.questionType === "estimation"), true);
assert.equal(b6Questions.some((question) => question.questionType === "bodmas"), true);

assert.equal(handleKeypadInput("12", "3"), "123");
assert.equal(handleKeypadInput("123", "backspace"), "12");
assert.equal(handleKeypadInput("12", ".", { allowDecimal: false }), "12");
assert.equal(handleKeypadInput("12", ".", { allowDecimal: true }), "12.");
assert.equal(handleKeypadInput("12", "C"), "");

console.log("Restaurant math game engine tests passed.");
