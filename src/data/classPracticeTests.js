const seq = (start, count, step = 1) => Array.from({ length: count }, (_, index) => start + index * step);
const list = (items) => items.join(", ");
const rangeText = (start, end) => list(seq(start, end - start + 1));
const normalizeMoney = (value) => `N${Number(value).toLocaleString("en-US")}`;

const topic = (week, title, focus, questions) => ({
  week,
  title,
  focus,
  questions: questions.slice(0, 20).map((question, index) => ({
    id: `w${week}-q${index + 1}`,
    ...question,
  })),
});

const qa = (prompt, answer, hint = "") => ({ prompt, answer, hint });

function basic1Topics() {
  return [
    topic(1, "Whole Numbers 1-10", "Counting, ordering and before/after numbers.", [
      qa("Count 7 pencils and write the numeral.", "7"), qa("Fill in: 1, 2, __, 4, __, 6.", "3, 5"), qa("Arrange 8, 2, 5 and 1 in ascending order.", "1, 2, 5, 8"), qa("Count backwards from 10 to 1.", "10, 9, 8, 7, 6, 5, 4, 3, 2, 1"), qa("Write the number immediately before 10.", "9"),
      ...seq(1, 10).map((n) => qa(`Write the numeral for ${n} object${n === 1 ? "" : "s"}.`, String(n))),
      qa("Arrange 4, 1, 9 and 6 from smallest to largest.", "1, 4, 6, 9"), qa("Write the number after 8.", "9"), qa("Write the number before 6.", "5"), qa("Fill in: 5, 6, __, 8.", "7"), qa("Which is greater: 3 or 9?", "9"),
    ]),
    topic(2, "Whole Numbers 11-20", "Counting, drawing and ordering numbers from 11 to 20.", [
      qa("Write the numbers from 11 to 20.", rangeText(11, 20)), qa("Draw or describe 13 circles.", "13 circles"), qa("Fill in: 12, __, 14, __, 16.", "13, 15"), qa("Arrange 19, 11, 15 and 20 from largest to smallest.", "20, 19, 15, 11"), qa("Write the number immediately before 20.", "19"),
      ...seq(11, 10).map((n) => qa(`Write the number after ${n}.`, String(n + 1))),
      qa("Arrange 12, 18, 14 and 16 in ascending order.", "12, 14, 16, 18"), qa("Count backwards from 20 to 15.", "20, 19, 18, 17, 16, 15"), qa("Fill in: 15, 16, __, 18, __.", "17, 19"), qa("Which is smaller: 13 or 17?", "13"), qa("Write seventeen in numerals.", "17"),
    ]),
    topic(3, "Consolidation of Whole Numbers 1-20", "Before, after, matching, correcting and ordering.", [
      qa("Write the number before 10, 15 and 20.", "9, 14, 19"), qa("Write the number after 7, 13 and 18.", "8, 14, 19"), qa("Match 9, 14 and 20 to groups of objects.", "match each numeral with exactly 9, 14 or 20 objects"), qa("Correct: 1, 2, 4, 3, 5.", "1, 2, 3, 4, 5"), qa("Write the number immediately before 20.", "19"),
      ...seq(1, 10).map((n) => qa(`What comes after ${n}?`, String(n + 1))),
      qa("Arrange 20, 4, 16 and 9 from smallest to largest.", "4, 9, 16, 20"), qa("Count from 6 to 15.", rangeText(6, 15)), qa("Count backwards from 15 to 10.", "15, 14, 13, 12, 11, 10"), qa("Which is greater: 18 or 12?", "18"), qa("Fill in: 8, 9, __, 11.", "10"),
    ]),
    topic(4, "Whole Numbers 21-30", "Writing, showing tens and ones, and number words.", [
      qa("Write 21-30.", rangeText(21, 30)), qa("Show 24 using tens and ones.", "2 tens and 4 ones"), qa("Match: 3-three, 8-eight, 10-ten.", "3-three; 8-eight; 10-ten"), qa("Fill in: 23, 24, __, __, 27.", "25, 26"), qa("Write the number immediately before 30.", "29"),
      ...seq(21, 10).map((n) => qa(`Write the number after ${n}.`, String(n + 1))),
      qa("Arrange 29, 21, 25 and 30 in ascending order.", "21, 25, 29, 30"), qa("How many tens and ones are in 28?", "2 tens and 8 ones"), qa("Write twenty-six in numerals.", "26"), qa("Count backwards from 30 to 25.", "30, 29, 28, 27, 26, 25"), qa("Which is greater: 24 or 27?", "27"),
    ]),
    topic(5, "Whole Numbers 31-40 and Zero", "Counting, zero, forward and backward patterns.", [
      qa("Write 31-40.", rangeText(31, 40)), qa("Circle the number: O, 0.", "0"), qa("Fill in: 0, 1, __, 3 and 4, 3, __, 1, 0.", "2, 2"), qa("Draw or describe a box containing zero stars.", "empty box"), qa("Write the number immediately before 40.", "39"),
      ...seq(31, 10).map((n) => qa(`What comes after ${n}?`, String(n + 1))),
      qa("Arrange 38, 31, 35 and 40 in ascending order.", "31, 35, 38, 40"), qa("Count backwards from 40 to 35.", "40, 39, 38, 37, 36, 35"), qa("What does zero mean?", "none or nothing"), qa("Fill in: 35, 36, __, 38.", "37"), qa("Which is smaller: 32 or 39?", "32"),
    ]),
    topic(6, "Comparing and Ordering Numbers 1-50", "Greater than, less than, number lines and skip-counting.", [
      qa("Insert >, < or =: 7 __ 4; 3 __ 3; 6 __ 9.", ">, =, <"), qa("Count in twos from 2 to 20.", "2, 4, 6, 8, 10, 12, 14, 16, 18, 20"), qa("Write one more than 5, 8 and 9.", "6, 9, 10"), qa("Place 4, 10 and 16 on a number line.", "4, 10 and 16 in correct positions"), qa("Insert >, < or =: 349 __ 394.", "<"),
      ...[[12, 9, ">"], [18, 21, "<"], [30, 30, "="], [45, 39, ">"], [22, 28, "<"]].map(([a, b, ans]) => qa(`Insert >, < or =: ${a} __ ${b}.`, ans)),
      qa("Arrange 42, 24, 35 and 50 in ascending order.", "24, 35, 42, 50"), qa("Arrange 12, 48, 25 and 33 in descending order.", "48, 33, 25, 12"), qa("Count in fives from 5 to 50.", "5, 10, 15, 20, 25, 30, 35, 40, 45, 50"), qa("Write the number before 50.", "49"), qa("Write the number after 44.", "45"),
      qa("Which is greater: 28 or 35?", "35"), qa("Fill in: 40, 41, __, 43.", "42"), qa("Count backwards from 50 to 45.", "50, 49, 48, 47, 46, 45"), qa("One more than 49 is __.", "50"), qa("One less than 31 is __.", "30"),
    ]),
    topic(7, "Mid-Term Break / Assessment", "Mixed revision across counting, comparison and skip-counting.", [
      qa("Write 0-50.", "0-50 in order"), qa("Write the numbers before and after 25.", "24 and 26"), qa("Compare 12 and 9.", "12 > 9"), qa("Count in twos to 20.", "2, 4, 6, 8, 10, 12, 14, 16, 18, 20"), qa("Write the number after 29.", "30"),
      ...seq(1, 15).map((n) => qa(`Revision: write the number after ${n + 10}.`, String(n + 11))),
    ]),
    topic(8, "Consolidation of Numbers 21-50", "Numbers, number words, twos and comparison.", [
      qa("Write 21-50 in order.", "21-50 in order"), qa("Write 11, 15 and 20 in words.", "eleven, fifteen, twenty"), qa("Count in twos from 2 to 30.", "2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30"), qa("Choose the larger stock: 28 eggs or 35 eggs.", "35 eggs"), qa("Write the number immediately before 50.", "49"),
      ...seq(21, 10).map((n) => qa(`Write the number before ${n + 1}.`, String(n))),
      qa("Arrange 49, 22, 36 and 41 in ascending order.", "22, 36, 41, 49"), qa("Count backwards from 50 to 40.", "50, 49, 48, 47, 46, 45, 44, 43, 42, 41, 40"), qa("Which is smaller: 27 or 34?", "27"), qa("Fill in: 31, 32, __, 34.", "33"), qa("Write 45 in words.", "forty-five"),
    ]),
    topic(9, "Introduction to Addition", "Joining groups to find a total.", [
      qa("Use counters to solve 2 + 5.", "7"), qa("Solve 4 + 0, 1 + 1, 3 + 3 and 6 + 2.", "4, 2, 6, 8"), qa("Draw or describe a picture for 5 + 2.", "5 and 2 make 7"), qa("Tell an addition story whose answer is 9.", "any correct joining story with total 9"), qa("Solve 4 + 5.", "9"),
      ...[[1,2],[2,3],[3,4],[4,4],[5,5],[6,1],[7,2],[8,1],[3,6],[2,7],[5,3],[0,9],[6,3],[4,2],[1,8]].map(([a,b]) => qa(`Solve ${a} + ${b}.`, String(a + b))),
    ]),
    topic(10, "Numbers 1-70, Comparison and Addition", "Counting to 70, comparison, patterns and addition.", [
      qa("Write 61-70.", rangeText(61, 70)), qa("Insert >, < or =: 42 __ 24; 35 __ 35.", "> and ="), qa("Continue: 2, 4, 6, __, __ and 10, 20, __, __.", "8, 10; 30, 40"), qa("Solve 5 + 4 and 2 + 7.", "9 and 9"), qa("Solve 4 + 5.", "9"),
      ...[[41,14,">"], [52,52,"="], [63,36,">"], [27,70,"<"], [65,56,">"]].map(([a,b,ans]) => qa(`Insert >, < or =: ${a} __ ${b}.`, ans)),
      ...[[6,4],[7,3],[8,2],[9,1],[5,5],[10,0],[4,6],[3,7],[2,8],[1,9]].map(([a,b]) => qa(`Solve ${a} + ${b}.`, String(a + b))),
    ]),
  ];
}

function basic2Topics() {
  return [
    topic(1, "Revision and Resumption Activities", "Counting to 300, skip-counting, operations and fractions.", [
      qa("Continue counting from 245 to 260.", "245-260 in order"), qa("Count by threes: 3, 6, 9, __, __.", "12, 15"), qa("Solve 31 + 16 and 44 - 3.", "47 and 41"), qa("Arrange 205, 152 and 250 in ascending order.", "152, 205, 250"), qa("Find one-quarter of 20.", "5"),
      ...seq(246, 10).map((n) => qa(`Write the number after ${n}.`, String(n + 1))), qa("Arrange 199, 250 and 205 in descending order.", "250, 205, 199"), qa("Find half of 18.", "9"), qa("Solve 42 + 15.", "57"), qa("Solve 58 - 24.", "34"), qa("Count by fives: 5, 10, __, __.", "15, 20"),
    ]),
    topic(2, "Whole Numbers 1-300", "Writing, patterns, number lines and tens/ones.", [
      qa("Write 291-300.", rangeText(291, 300)), qa("Continue 36, 39, 42, __, __.", "45, 48"), qa("Draw or describe a number line from 20 to 30.", "label 20-30 in order"), qa("Show 47 as groups of ten and ones.", "4 tens and 7 ones"), qa("Write the number immediately before 300.", "299"),
      ...seq(291, 10).map((n) => qa(`What comes after ${n}?`, String(n + 1))), qa("Write 286 in expanded form.", "200 + 80 + 6"), qa("Count backwards from 300 to 295.", "300, 299, 298, 297, 296, 295"), qa("Which is greater: 298 or 289?", "298"), qa("Arrange 240, 204, 224 in ascending order.", "204, 224, 240"), qa("How many tens are in 70?", "7 tens"),
    ]),
    topic(3, "Reading and Writing Numbers up to 300", "Number names, numerals and patterns.", [
      qa("Write 148 and 200 in words.", "one hundred and forty-eight; two hundred"), qa("Write one hundred and sixty-three in numerals.", "163"), qa("Continue 75, 80, 85, __, __.", "90, 95"), qa("Count backwards from 300 to 290.", "300, 299, 298, 297, 296, 295, 294, 293, 292, 291, 290"), qa("Write the number immediately before 300.", "299"),
      ...[[120,"one hundred and twenty"],[175,"one hundred and seventy-five"],[201,"two hundred and one"],[250,"two hundred and fifty"],[299,"two hundred and ninety-nine"]].map(([n,a]) => qa(`Write ${n} in words.`, a)),
      ...[121, 140, 188, 207, 263].map((n) => qa(`Write the number after ${n}.`, String(n + 1))),
      qa("Arrange 163, 136 and 196 in ascending order.", "136, 163, 196"), qa("Continue 100, 110, 120, __, __.", "130, 140"), qa("Write two hundred and ninety in numerals.", "290"), qa("Which is smaller: 148 or 184?", "148"), qa("Write 200 in expanded form.", "200"),
    ]),
    topic(4, "Place Value", "Hundreds, tens, units and expanded form.", [
      qa("Complete: 286 = __ + __ + __.", "200 + 80 + 6"), qa("State the value of 5 in 154 and 352.", "50 and 50"), qa("Bundle 30 sticks into groups of ten.", "3 bundles of ten"), qa("Write 4 hundreds, 6 tens and 3 units as a numeral.", "463"), qa("Write 425 in expanded form.", "400 + 20 + 5"),
      ...[[137,"100 + 30 + 7"],[209,"200 + 0 + 9"],[350,"300 + 50 + 0"],[472,"400 + 70 + 2"],[506,"500 + 0 + 6"]].map(([n,a]) => qa(`Write ${n} in expanded form.`, a)),
      ...[[248,"40"],[319,"300"],[425,"20"],[507,"7"],[681,"80"]].map(([n,a]) => qa(`State the value of the middle digit in ${n}.`, a)),
      qa("Write 3 hundreds, 0 tens and 8 units.", "308"), qa("How many hundreds are in 600?", "6"), qa("Which digit is in the tens place in 286?", "8"), qa("Which digit is in the units place in 425?", "5"), qa("Write 700 + 40 + 3 as a numeral.", "743"),
    ]),
    topic(5, "Ordering and Comparing Numbers", "Using >, <, = and arranging numbers.", [
      qa("Insert >, < or =: 298 __ 302; 340 __ 304; 277 __ 277.", "<, >, ="), qa("Arrange 320, 203, 230 and 302 in ascending order.", "203, 230, 302, 320"), qa("Arrange 145, 154 and 141 in descending order.", "154, 145, 141"), qa("Explain why 249 < 294.", "249 < 294 because 4 tens are fewer than 9 tens after the equal hundreds"), qa("Insert >, < or =: 349 __ 394.", "<"),
      ...[[210,201,">"],[305,350,"<"],[444,444,"="],[178,187,"<"],[290,209,">"],[601,599,">"],[425,452,"<"],[700,670,">"],[318,318,"="],[526,562,"<"]].map(([a,b,ans]) => qa(`Insert >, < or =: ${a} __ ${b}.`, ans)),
      qa("Arrange 275, 257 and 527 in ascending order.", "257, 275, 527"), qa("Arrange 410, 401 and 104 in descending order.", "410, 401, 104"), qa("Which is greatest: 302, 320 or 230?", "320"), qa("Which is smallest: 145, 154 or 141?", "141"), qa("Order 500, 50 and 505 from smallest to largest.", "50, 500, 505"),
    ]),
    topic(6, "Introduction to Fractions", "Halves, quarters and equal parts.", [
      qa("Shade 1/2 of a rectangle.", "1 of 2 equal parts shaded"), qa("Shade 1/4 of a circle.", "1 of 4 equal parts shaded"), qa("Find 1/2 of 10 and 1/4 of 16.", "5 and 4"), qa("Explain why unequal parts cannot show halves.", "halves must be two equal parts"), qa("Find one-half of 12.", "6"),
      ...[[14,7],[18,9],[20,10],[8,4],[16,8]].map(([n,a]) => qa(`Find 1/2 of ${n}.`, String(a))),
      ...[[8,2],[12,3],[20,5],[24,6],[28,7]].map(([n,a]) => qa(`Find 1/4 of ${n}.`, String(a))),
      qa("How many halves make one whole?", "2"), qa("How many quarters make one whole?", "4"), qa("Write the fraction for one out of four equal parts.", "1/4"), qa("Write the fraction for one out of two equal parts.", "1/2"), qa("Is 1/2 made from equal parts?", "yes"),
    ]),
    topic(7, "Mid-Term Break / Assessment", "Mixed review of numbers, place value, comparison and fractions.", [
      qa("Write 198 in words.", "one hundred and ninety-eight"), qa("Find the value of 7 in 273.", "70"), qa("Compare 310 and 301.", "310 > 301"), qa("Find half of 14.", "7"), qa("Find one-quarter of 20.", "5"),
      ...[[200,"two hundred"],[154,"one hundred and fifty-four"],[275,"two hundred and seventy-five"],[300,"three hundred"],[109,"one hundred and nine"]].map(([n,a]) => qa(`Write ${n} in words.`, a)),
      ...[[246,"40"],[381,"80"],[172,"70"],[509,"0"],[630,"30"]].map(([n,a]) => qa(`Find the value of the tens digit in ${n}.`, a)),
      qa("Arrange 209, 290 and 229 in ascending order.", "209, 229, 290"), qa("Solve 53 + 26.", "79"), qa("Solve 88 - 47.", "41"), qa("Find 1/2 of 18.", "9"), qa("Find 1/4 of 12.", "3"),
    ]),
    topic(8, "Three-Quarters of Objects and Collections", "Understanding 3/4 of shapes and groups.", [
      qa("Shade 3/4 of a square.", "3 of 4 equal parts shaded"), qa("Find 3/4 of 8 and 16.", "6 and 12"), qa("How many quarters make one whole?", "4"), qa("Show 3/4 using 12 counters.", "9 counters"), qa("Find one-half of 12.", "6"),
      ...[[4,3],[12,9],[20,15],[24,18],[28,21],[32,24],[36,27],[40,30],[44,33],[48,36]].map(([n,a]) => qa(`Find 3/4 of ${n}.`, String(a))),
      qa("If 1/4 of 16 is 4, what is 3/4 of 16?", "12"), qa("If a shape has 4 equal parts and 3 are shaded, what fraction is shaded?", "3/4"), qa("How many quarters are shaded in 3/4?", "3"), qa("Is 3/4 more than 1/2?", "yes"), qa("Find 3/4 of 100.", "75"),
    ]),
    topic(9, "Addition of Two-Digit Numbers", "Adding tens and units with stories.", [
      qa("Solve 21 + 16, 34 + 25 and 42 + 7.", "37, 59, 49"), qa("Use expanded form to solve 32 + 15.", "47"), qa("Write an addition story for 24 + 13.", "any correct story with total 37"), qa("Find the total of 31 red beads and 18 blue beads.", "49"), qa("Solve 46 + 32.", "78"),
      ...[[22,15],[31,26],[40,18],[53,26],[12,47],[25,34],[61,18],[70,12],[33,44],[55,23],[18,21],[29,30],[47,12],[63,16],[35,42]].map(([a,b]) => qa(`Solve ${a} + ${b}.`, String(a + b))),
    ]),
    topic(10, "Subtraction of Two-Digit Numbers", "Subtracting tens and units with stories.", [
      qa("Solve 56 - 24, 78 - 36 and 49 - 7.", "32, 42, 42"), qa("Use expanded form to solve 65 - 23.", "42"), qa("Write a story for 38 - 16.", "any correct taking-away story with answer 22"), qa("A shop had 59 eggs and sold 27. How many remain?", "32"), qa("Solve 75 - 28.", "47"),
      ...[[54,22],[78,31],[96,44],[88,47],[67,25],[72,18],[59,26],[83,41],[90,35],[65,19],[48,16],[77,24],[56,28],[99,45],[43,21]].map(([a,b]) => qa(`Solve ${a} - ${b}.`, String(a - b))),
    ]),
    topic(11, "Mixed Addition and Subtraction", "Choosing + or - and solving two-step stories.", [
      qa("Solve 43 + 26 and 87 - 35.", "69 and 52"), qa("Choose + or -: 18 more joined 31; 23 were taken from 56.", "+ and -"), qa("Solve a two-step story using one addition and one subtraction.", "any correct two-step story and solution"), qa("Continue counting in 2s, 3s, 5s and 10s.", "correct skip-counting patterns"), qa("A shop had 45 tins, received 23 and sold 18. How many remain?", "50"),
      ...[[31,18,12],[45,23,18],[60,20,15],[72,14,30],[50,25,10]].map(([start, add, sub]) => qa(`Start with ${start}, add ${add}, then subtract ${sub}.`, String(start + add - sub))),
      ...[[43,26],[55,12],[30,44],[72,16],[19,60]].map(([a,b]) => qa(`Solve ${a} + ${b}.`, String(a+b))),
      ...[[87,35],[99,42],[76,18],[64,21],[58,29]].map(([a,b]) => qa(`Solve ${a} - ${b}.`, String(a-b))),
    ]),
    topic(12, "Revision", "Whole-term revision across numbers, fractions and operations.", [
      qa("Write 275 in words and expanded form.", "two hundred and seventy-five; 200 + 70 + 5"), qa("Arrange 209, 290 and 229 in order.", "209, 229, 290"), qa("Find 1/2 of 18 and 1/4 of 20.", "9 and 5"), qa("Solve 53 + 26 and 88 - 47.", "79 and 41"), qa("Find one-quarter of 20.", "5"),
      ...[[148,"one hundred and forty-eight"],[286,"two hundred and eighty-six"],[300,"three hundred"],[163,"one hundred and sixty-three"],[425,"four hundred and twenty-five"]].map(([n,a]) => qa(`Write ${n} in words.`, a)),
      ...[[21,16],[34,25],[46,32],[53,26],[31,18]].map(([a,b]) => qa(`Revision addition: ${a} + ${b}.`, String(a+b))),
      ...[[56,24],[78,36],[75,28],[88,47],[65,23]].map(([a,b]) => qa(`Revision subtraction: ${a} - ${b}.`, String(a-b))),
    ]),
  ];
}

const upperConfigs = {
  "basic-3": [
    ["Revision and Resumption Test", ["Write 438 in words.", "What is the value of 6 in 563?", "Count backwards from 520 to 510.", "Arrange 582, 528 and 600.", "Write the number after 587."], ["four hundred and thirty-eight", "60", "520, 519, 518, 517, 516, 515, 514, 513, 512, 511, 510", "528, 582, 600", "588"]],
    ["Counting Whole Numbers 601-620", ["Write 606 in words.", "Continue: 605, 610, __, 620.", "Arrange 618, 603, 615 and 609.", "Write the number before 620.", "Count from 611 to 617."], ["six hundred and six", "615", "603, 609, 615, 618", "619", "611, 612, 613, 614, 615, 616, 617"]],
    ["Place Value of Numbers 621-640", ["Expand 627.", "State the place and value of 4 in 647.", "Which number is 600 + 20 + 9?", "Arrange 636, 622, 640 and 629.", "Write 638 in words."], ["600 + 20 + 7", "tens; 40", "629", "622, 629, 636, 640", "six hundred and thirty-eight"]],
    ["Ordering Whole Numbers 641-660", ["Insert >, < or =: 652 __ 658.", "Arrange 656, 642, 660 and 648.", "Continue: 6, 12, 18, __, __.", "Continue: 7, 14, 21, __, __.", "Which is greatest: 641, 659 or 650?"], ["<", "642, 648, 656, 660", "24, 30", "28, 35", "659"]],
    ["Introduction to Fractions", ["Write the fraction when 4 of 5 equal parts are shaded.", "Find 1/4 of 16.", "Find 3/4 of 16.", "Name numerator and denominator in 3/8.", "Describe 3/4 of a rectangle."], ["4/5", "4", "12", "numerator 3; denominator 8", "3 of 4 equal parts shaded"]],
    ["Equivalent, Ordered and Added Fractions", ["Write an equivalent fraction for 2/3 by multiplying by 2.", "Insert < or >: 2/8 __ 6/8.", "Order 5/6, 2/6 and 4/6.", "Solve 1/9 + 5/9.", "Write 4/8 in simplest form."], ["4/6", "<", "2/6, 4/6, 5/6", "6/9", "1/2"]],
    ["Mid-Term Revision and Assessment", ["Write 684 in words.", "Expand 697.", "Compare 3/7 and 5/7.", "Solve 1/8 + 4/8.", "State the value of 9 in 697."], ["six hundred and eighty-four", "600 + 90 + 7", "3/7 < 5/7", "5/8", "90"]],
    ["Addition of Whole Numbers", ["Solve 236 + 152.", "Solve 289 + 134.", "Solve 45 + 32.", "268 birds plus 157 birds.", "Solve 347 + 253."], ["388", "423", "77", "425 birds", "600"]],
    ["Addition Using the Partial-Sum Method", ["Use partial sums for 315 + 252.", "Use partial sums for 347 + 286.", "Solve 264 + 179.", "Name places that regroup in 264 + 179.", "Create an addition story above 500."], ["567", "633", "443", "units and tens", "any correct story above 500"]],
    ["Subtraction of Whole Numbers", ["Solve 694 - 253.", "Solve 590 - 255.", "Solve 472 - 257.", "714 books minus 257.", "How can addition check 713 - 277?"], ["441", "335", "215", "457 books", "436 + 277 = 713"]],
    ["First-Term Revision", ["Write 738 in words and expanded form.", "Order 719, 684, 708 and 697.", "Solve 2/8 + 5/8.", "Write one equivalent fraction to 2/4.", "Solve 347 + 277 and 713 - 347."], ["seven hundred and thirty-eight; 700 + 30 + 8", "684, 697, 708, 719", "7/8", "1/2", "624 and 366"]],
    ["First-Term Examination Preparation", ["Which word usually means addition: altogether or difference?", "Which operation checks subtraction?", "Write one thing to check before submitting.", "What must you check in a fraction answer?", "Estimate 278 + 146."], ["altogether", "addition", "any correct checking step", "denominator and equal parts", "about 400"]],
    ["End-of-Term Skill Check", ["Write 618 and 729 in words.", "Expand 637 and state value of 3.", "Arrange 660, 606, 650 and 616 descending.", "Solve 3/8 + 4/8.", "Solve 704 - 268 and check."], ["six hundred and eighteen; seven hundred and twenty-nine", "600 + 30 + 7; 30", "660, 650, 616, 606", "7/8", "436; 436 + 268 = 704"]],
  ],
  "basic-4": [
    ["Whole Numbers up to 9,999", ["Write 5,836 in words.", "Write seven thousand and forty-two in figures.", "Expand 8,426.", "State place and value of 9 in 9,318.", "Arrange 4,205, 4,250 and 4,052."], ["five thousand, eight hundred and thirty-six", "7,042", "8,000 + 400 + 20 + 6", "thousands; 9,000", "4,052, 4,205, 4,250"]],
    ["Whole Numbers up to One Million", ["Write 704,219 in words.", "Write eight hundred and twelve thousand, six.", "State value of 8 in 482,315.", "Expand 730,405.", "Which is greater: 900,001 or 899,999?"], ["seven hundred and four thousand, two hundred and nineteen", "812,006", "80,000", "700,000 + 30,000 + 400 + 5", "900,001"]],
    ["Skip-Counting and Number Patterns", ["Continue: 30, 35, 40, __, __.", "Continue: 21, 28, 35, __, __.", "Continue: 240, 300, 360, __.", "Fill in: 3,000, 4,000, __, __.", "How many jumps of 7 reach 42?"], ["45, 50", "42, 49", "420", "5,000, 6,000", "6 jumps"]],
    ["Ordering and Comparing Whole Numbers", ["650,004 __ 649,999.", "305,020 __ 305,200.", "Order 90,005, 89,950 and 90,050.", "Order 712,000, 721,000 and 702,100 descending.", "Write inequality using 450,300 and 450,030."], [">", "<", "89,950, 90,005, 90,050", "721,000, 712,000, 702,100", "450,300 > 450,030"]],
    ["Roman Numerals", ["Write XLVI in figures.", "Write LXXXIV in figures.", "Write 67 in Roman numerals.", "Write 400 in Roman numerals.", "Solve XV + VII in Roman numerals."], ["46", "84", "LXVII", "CD", "XXII"]],
    ["Addition and Subtraction", ["Solve 36,417 + 18,695.", "Solve 90,000 - 47,538.", "Solve 5,120 + 2,875 + 1,005.", "N64,500 - N29,875.", "Estimate 52,890 + 31,205."], ["55,112", "42,462", "9,000", "N34,625", "84,000"]],
    ["Mid-Term Revision and Assessment", ["Write 8,064 in words.", "State value of 4 in 348,215.", "458,210 __ 458,201.", "Write 49 in Roman numerals.", "Solve 42,306 - 18,945."], ["eight thousand and sixty-four", "40,000", ">", "XLIX", "23,361"]],
    ["Multiplication", ["Solve 132 x 23.", "Solve 406 x 14.", "Solve 123 x 32.", "28 pupils get 25 books each.", "Estimate 198 x 49."], ["3,036", "5,684", "3,936", "700 books", "about 10,000"]],
    ["Division", ["Solve 854 / 7.", "Solve 758 / 6.", "Solve 1,500 / 30.", "648 oranges shared among 9 baskets.", "Check 432 / 6 using multiplication."], ["122", "126 r2", "50", "72", "72; 72 x 6 = 432"]],
    ["Lowest Common Multiple", ["LCM of 4 and 9.", "LCM of 8 and 12.", "LCM of 3, 5 and 6.", "Lights flash every 4 and 7 seconds.", "Is 48 common multiple of 6 and 8?"], ["36", "24", "30", "28 seconds", "yes"]],
    ["Highest Common Factor", ["HCF of 24 and 36.", "HCF of 32 and 48.", "HCF of 18, 30 and 42.", "36 pencils and 48 pens equal packs.", "List factors of 36."], ["12", "16", "6", "12 packs", "1, 2, 3, 4, 6, 9, 12, 18, 36"]],
    ["End-of-Term Revision", ["Expand 730,405.", "Write LXXXIV in figures.", "Solve 36,417 + 18,695.", "Solve 123 x 32.", "Find LCM(8,12) and HCF(32,48)."], ["700,000 + 30,000 + 400 + 5", "84", "55,112", "3,936", "LCM = 24; HCF = 16"]],
    ["Examination Practice", ["Write 704,219 in words.", "Compare 650,004 and 649,999.", "Convert XLVI to figures.", "Solve 90,000 - 47,538.", "Find HCF(24,36) and LCM(4,9)."], ["seven hundred and four thousand, two hundred and nineteen", "650,004 > 649,999", "46", "42,462", "HCF = 12; LCM = 36"]],
  ],
  "basic-5": [],
  "basic-6": [],
};

function makeFromSeeds(classLevel, fallbackTopics) {
  const configs = upperConfigs[classLevel]?.length ? upperConfigs[classLevel] : fallbackTopics;
  return configs.map(([title, prompts, answers], index) => {
    const questions = [];
    for (let i = 0; i < 20; i += 1) {
      const seedIndex = i % prompts.length;
      const round = Math.floor(i / prompts.length);
      questions.push(qa(round === 0 ? prompts[seedIndex] : `${prompts[seedIndex]} (Practice ${round + 1})`, answers[seedIndex]));
    }
    return topic(index + 1, title, "Answer all 20 questions. Submit each answer before checking.", questions);
  });
}

const basic5Fallback = [
  ["Whole Numbers, Decimals and Place Value", ["Round 8,746 to nearest 10.", "Round 83,726 to nearest 1,000.", "Write seven hundredths as decimal.", "State value of 8 in 47.386.", "Round 64,300 to nearest 10,000."], ["8,750", "84,000", "0.07", "0.08", "60,000"]],
  ["Roman Numerals", ["Convert 38 to Roman numerals.", "Convert 49 to Roman numerals.", "Convert LXXVI to Arabic.", "Convert CM to Arabic.", "Calculate XII + VIII."], ["XXXVIII", "XLIX", "76", "900", "XX"]],
  ["Addition and Subtraction", ["24,508 + 13,679.", "70,000 - 28,456.", "4,250 + 3,805 + 945.", "N56,750 - N28,925.", "48.75 + 6.8."], ["38,187", "41,544", "9,000", "N27,825", "55.55"]],
  ["Multiplication and Division", ["125 x 24.", "308 x 15.", "214 x 32.", "728 / 7.", "965 / 8."], ["3,000", "4,620", "6,848", "104", "120 r5"]],
  ["Prime Numbers, LCM and HCF", ["Classify 51.", "List primes from 10 to 20.", "Prime-factorise 36.", "Find HCF(42,56).", "Find LCM(6,9)."], ["composite", "11, 13, 17, 19", "2^2 x 3^2", "14", "18"]],
  ["Fractions, Decimals and Percentages", ["Convert 1/4 to decimal and percent.", "Convert 0.6 to fraction and percent.", "Convert 45% to fraction and decimal.", "Order 0.5, 60%, 3/4.", "Find 35% of 200."], ["0.25; 25%", "3/5; 60%", "9/20; 0.45", "0.5, 60%, 3/4", "70"]],
  ["Mid-Term Revision", ["Round 376,482 to nearest 10,000.", "Convert 294 to Roman numerals.", "Calculate 48.75 + 6.8.", "Calculate 214 x 32.", "Convert 3/8 to decimal and percent."], ["380,000", "CCXCIV", "55.55", "6,848", "0.375 and 37.5%"]],
  ["Ratios", ["Simplify 10:15.", "Boys:girls=3:5. Write boys as fraction.", "Share 96 in ratio 5:3.", "12 blue and 8 red; find red when blue is 30.", "Are 4:6 and 10:15 equivalent?"], ["2:3", "3/8", "60 and 36", "20 red", "yes"]],
  ["Fractions and Decimals Addition/Subtraction", ["2/7 + 3/7.", "1/3 + 1/4.", "2 1/2 + 1 1/4.", "4.7 - 2.75.", "5/6 - 1/3."], ["5/7", "7/12", "3 3/4", "1.95", "1/2"]],
  ["Multiplication of Fractions and Decimals", ["2/5 x 3/4.", "1.2 x 2.5.", "0.8 x 1.8.", "4.5 hectares x 6 tonnes.", "1 1/2 x 2."], ["3/10", "3.0", "1.44", "27 tonnes", "3"]],
  ["Division of Fractions and Decimals", ["3/5 / 2/7.", "6.0 / 2.5.", "56.4 / 10.", "8.25 / 100.", "Four litres into 1/2-litre cups."], ["2 1/10", "2.4", "5.64", "0.0825", "8 cups"]],
  ["Squares and Square Roots", ["Find 18 squared.", "Find square root of 196.", "Is 250 a perfect square?", "Find 30 squared.", "Area 144 sq cm, find side."], ["324", "14", "no", "900", "12 cm"]],
  ["End-of-Term Revision", ["Round 376,482.", "Convert 3/8 to percent.", "Share 84 in ratio 3:4.", "1/3 + 1/4.", "3/4 / 2/5."], ["380,000", "37.5%", "36 and 48", "7/12", "1 7/8"]],
  ["Examination Practice", ["Value of 7 in 3,472,615.", "Round 83,726.", "Convert 294 to Roman.", "70,000 - 28,456.", "0.8 x 1.8 and 7.2 / 0.3."], ["70,000", "84,000", "CCXCIV", "41,544", "1.44; 24"]],
];

const basic6Fallback = [
  ["Whole Numbers up to Billions", ["Write 5,306,004,090 in words.", "Write nine billion, forty million, six thousand.", "Value of 8 in 2,817,400,000.", "Expand 1,205,030,004.", "Which is greater: 999,999,999 or 1,000,000,000?"], ["five billion, three hundred and six million, four thousand and ninety", "9,040,006,000", "800,000,000", "1,000,000,000 + 200,000,000 + 5,000,000 + 30,000 + 4", "1,000,000,000"]],
  ["Addition and Subtraction", ["24,508 + 13,679.", "70,000 - 28,456.", "4,250 + 3,805 + 945.", "N56,750 - N28,925.", "Estimate 48,901 + 20,102."], ["38,187", "41,544", "9,000", "N27,825", "about 69,000"]],
  ["Multiplication", ["324 x 205.", "2.75 x 1.6.", "0.48 x 25.", "N125.50 x 24.", "Estimate 49.8 x 19.9."], ["66,420", "4.4", "12", "N3,012", "about 1,000"]],
  ["Division", ["9,450 / 125.", "7,425 / 33.", "34.56 / 1.2.", "N18,750 shared among 125.", "5,000 / 128."], ["75 r75", "225", "28.8", "N150 each", "39 r8"]],
  ["LCM and HCF", ["LCM(5,8).", "LCM(4,6,10).", "Lights flash every 3 and 5 seconds.", "HCF(27,45).", "42 pencils and 56 pens equal packs."], ["40", "60", "after 15 seconds", "9", "14 packs"]],
  ["Fractions and Decimals", ["3/7 + 2/7.", "5/6 - 1/4.", "1 1/2 + 2 1/4.", "3/4 x 2/5.", "45% to fraction and decimal."], ["5/7", "7/12", "3 3/4", "3/10", "9/20; 0.45"]],
  ["Mid-Term Assessment", ["Rule for comparing large numbers.", "Difference between LCM and HCF.", "Fraction division rule.", "State BODMAS.", "Checking method for subtraction."], ["compare from the greatest place", "LCM is least shared multiple; HCF is greatest shared factor", "keep-change-flip", "Brackets, Orders, Division, Multiplication, Addition, Subtraction", "add the difference to the amount subtracted"]],
  ["Order of Basic Operations", ["6 + 4 x 3.", "(6 + 4) x 3.", "36 / 6 + 2 squared.", "20 - 8 / 2 x 3.", "1/2 + 3/4 x 2."], ["18", "30", "10", "8", "2"]],
  ["Scale Drawing", ["At 1:100, actual length for 6 cm.", "At 1:50, drawing length for 5 m.", "1 cm=4 km, actual for 8.5 cm.", "At 1:500, 3 cm line represents metres.", "12 m room drawn 6 cm, state scale."], ["600 cm or 6 m", "10 cm", "34 km", "15 m", "1:200"]],
  ["Approximation and Estimation", ["Round 84,651 to nearest thousand.", "Round 7.386 to nearest hundredth.", "Estimate 597 x 41.", "Estimate 8,120 / 39.", "Is 12,000 reasonable for 398 x 29?"], ["85,000", "7.39", "about 24,000", "about 200", "yes"]],
  ["Revision and Project", ["Choose a project topic.", "Write measurements or data.", "Show at least three calculations.", "Include one estimate or check.", "Write a two-sentence conclusion."], ["learner's choice", "must be recorded with units", "must be mathematically correct", "must be shown and compared", "must explain the result"]],
  ["Examination Preparation", ["Prepare writing materials.", "Review formulas and rules.", "Complete one timed mixed exercise.", "Correct every missed item.", "Rest adequately."], ["completed before examination", "completed before examination", "answers depend on exercise", "all errors corrected", "completed"]],
  ["Examination Practice", ["Write 5,306,004,090 in words.", "Calculate 24,508 + 13,679.", "Find LCM(5,8).", "Evaluate 20 - 8 / 2 x 3.", "Round 84,651."], ["five billion, three hundred and six million, four thousand and ninety", "38,187", "40", "8", "85,000"]],
];

export const CLASS_PRACTICE_TESTS = {
  "basic-1": basic1Topics(),
  "basic-2": basic2Topics(),
  "basic-3": makeFromSeeds("basic-3"),
  "basic-4": makeFromSeeds("basic-4"),
  "basic-5": makeFromSeeds("basic-5", basic5Fallback),
  "basic-6": makeFromSeeds("basic-6", basic6Fallback),
};
