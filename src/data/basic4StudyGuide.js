const BASIC4_STUDY_WEEK_BASE = [
  {
    week: 1,
    title: "Whole Numbers up to 9,999",
    goal: "Read, write, represent, expand, compare and order four-digit numbers.",
    colour: "#f97316",
    topics: [
      {
        title: "Four-Digit Place Value",
        summary: "A four-digit number has thousands, hundreds, tens and units.",
        explanation: "Whole numbers have no fractional or decimal part. In 6,482, the 6 means 6,000, the 4 means 400, the 8 means 80 and the 2 means 2.",
        steps: [
          "Separate the number into thousands, hundreds, tens and units.",
          "Read from the greatest place first.",
          "If a place has zero, keep the place empty but do not ignore it.",
          "Write the expanded form by adding the value of each digit.",
          "Check every spoken part against the digit in the number.",
        ],
        tip: "Zero is a placeholder. In 9,009, the zeros keep the hundreds and tens places empty.",
        figure: {
          type: "table",
          headers: ["Number", "Thousands", "Hundreds", "Tens", "Units", "Expanded form"],
          rows: [
            ["6,482", "6 = 6,000", "4 = 400", "8 = 80", "2 = 2", "6,000 + 400 + 80 + 2"],
            ["9,009", "9 = 9,000", "0", "0", "9 = 9", "9,000 + 9"],
            ["4,070", "4 = 4,000", "0", "7 = 70", "0", "4,000 + 70"],
          ],
        },
        tasks: [
          { prompt: "Write 5,836 in words.", answer: "five thousand, eight hundred and thirty-six" },
          { prompt: "Write seven thousand and forty-two in figures.", answer: "7,042" },
          { prompt: "Expand 8,426.", answer: "8,000 + 400 + 20 + 6" },
          { prompt: "State the place and value of 9 in 9,318.", answer: "thousands; 9,000" },
          { prompt: "Arrange 4,205, 4,250 and 4,052 in ascending order.", answer: "4,052, 4,205, 4,250" },
        ],
      },
    ],
  },
  {
    week: 2,
    title: "Whole Numbers up to One Million",
    goal: "Read, write, expand and identify digit values in numbers up to 1,000,000.",
    colour: "#22c55e",
    topics: [
      {
        title: "Periods and Large Numbers",
        summary: "Large numbers are easier to read when grouped into periods of three digits from the right.",
        explanation: "The periods are millions, thousands and units. For example, 845,217 is read as eight hundred and forty-five thousand, two hundred and seventeen.",
        steps: [
          "Group digits from the right in threes.",
          "Read the left period first.",
          "Read the units period next.",
          "Join the periods with their names.",
          "To find digit value, multiply the digit by its place.",
        ],
        tip: "A comma helps your eyes see the periods, but place value gives the meaning.",
        figure: {
          type: "table",
          headers: ["Number", "Millions period", "Thousands period", "Units period", "Number name"],
          rows: [
            ["845,217", "-", "845", "217", "eight hundred and forty-five thousand, two hundred and seventeen"],
            ["506,042", "-", "506", "042", "five hundred and six thousand, forty-two"],
            ["1,000,000", "1", "000", "000", "one million"],
          ],
        },
        tasks: [
          { prompt: "Write 704,219 in words.", answer: "seven hundred and four thousand, two hundred and nineteen" },
          { prompt: "Write eight hundred and twelve thousand, six in figures.", answer: "812,006" },
          { prompt: "State the value of 8 in 482,315.", answer: "80,000" },
          { prompt: "Expand 730,405.", answer: "700,000 + 30,000 + 400 + 5" },
          { prompt: "Which is greater: 900,001 or 899,999?", answer: "900,001" },
        ],
      },
    ],
  },
  {
    week: 3,
    title: "Skip-Counting and Number Patterns",
    goal: "Identify constant jumps, complete sequences and connect repeated jumps to multiplication.",
    colour: "#3b82f6",
    topics: [
      {
        title: "Constant Jumps",
        summary: "Skip-counting changes a number by the same amount each time.",
        explanation: "Increasing patterns add the jump. Decreasing patterns subtract the jump. If every neighbouring pair differs by 60, the pattern is counting in sixties.",
        steps: [
          "Compare two neighbouring numbers.",
          "Find the jump by subtracting the smaller from the larger.",
          "Decide whether the pattern is increasing or decreasing.",
          "Use the same jump for every blank.",
          "Check by reading the whole pattern aloud.",
        ],
        tip: "Do not change the jump halfway through a pattern.",
        figure: {
          type: "table",
          headers: ["Count by", "Sequence", "Connection"],
          rows: [
            ["5s", "5, 10, 15, 20, 25", "8 jumps of 5 reach 40: 8 x 5 = 40"],
            ["7s", "7, 14, 21, 28, 35", "The 5th multiple of 7 is 35"],
            ["60s", "60, 120, 180, 240, 300", "5 x 60 = 300"],
            ["1,000s", "1,000, 2,000, 3,000, 4,000", "4 x 1,000 = 4,000"],
          ],
        },
        tasks: [
          { prompt: "Continue: 30, 35, 40, __, __.", answer: "45, 50" },
          { prompt: "Continue: 21, 28, 35, __, __.", answer: "42, 49" },
          { prompt: "Continue: 240, 300, 360, __.", answer: "420" },
          { prompt: "Fill in: 3,000, 4,000, __, __.", answer: "5,000, 6,000" },
          { prompt: "How many jumps of 7 reach 42?", answer: "6 jumps" },
        ],
      },
    ],
  },
  {
    week: 4,
    title: "Ordering and Comparing Whole Numbers",
    goal: "Use >, < and = and arrange large numbers accurately.",
    colour: "#8b5cf6",
    topics: [
      {
        title: "Compare From the Greatest Place",
        summary: "Compare numbers from the greatest place and stop at the first place where the digits differ.",
        explanation: "458,210 > 458,201 because the tens place is the first different place, and 1 ten is greater than 0 tens.",
        steps: [
          "Align the numbers by place value.",
          "Compare the greatest place first.",
          "If the digits match, move one place to the right.",
          "Stop at the first different place.",
          "Use that place to decide >, < or =.",
        ],
        tip: "Do not decide by the last digit unless every earlier digit is the same.",
        figure: {
          type: "table",
          headers: ["Place", "458,210", "458,201", "Decision"],
          rows: [
            ["Hundred-thousands", "4", "4", "equal - continue"],
            ["Ten-thousands", "5", "5", "equal - continue"],
            ["Thousands", "8", "8", "equal - continue"],
            ["Hundreds", "2", "2", "equal - continue"],
            ["Tens", "1", "0", "1 > 0, so stop"],
            ["Units", "0", "1", "not needed"],
          ],
        },
        tasks: [
          { prompt: "Insert >, < or =: 650,004 __ 649,999.", answer: ">" },
          { prompt: "Insert >, < or =: 305,020 __ 305,200.", answer: "<" },
          { prompt: "Order 90,005, 89,950 and 90,050 in ascending order.", answer: "89,950, 90,005, 90,050" },
          { prompt: "Order 712,000, 721,000 and 702,100 in descending order.", answer: "721,000, 712,000, 702,100" },
          { prompt: "Write an inequality using 450,300 and 450,030.", answer: "450,300 > 450,030" },
        ],
      },
    ],
  },
  {
    week: 5,
    title: "Roman Numerals",
    goal: "Convert between Arabic and Roman numerals and calculate simple Roman-numeral expressions.",
    colour: "#ec4899",
    topics: [
      {
        title: "Roman Symbols and Subtraction",
        summary: "Roman numerals use letters. Values are normally written from greatest to smallest and added.",
        explanation: "A smaller value before a larger permitted value is subtracted. IV means 5 - 1 = 4, IX means 10 - 1 = 9 and XL means 50 - 10 = 40.",
        steps: [
          "Know the core symbols: I, V, X, L, C, D and M.",
          "Read from left to right.",
          "Add values when the symbols go from bigger to smaller.",
          "Subtract when a smaller allowed symbol comes before a bigger one.",
          "Convert the final total back into ordinary numbers if needed.",
        ],
        tip: "Do not write four I symbols for 4. Use IV.",
        figure: {
          type: "table",
          headers: ["Roman", "I", "V", "X", "L", "C", "D", "M"],
          rows: [["Value", "1", "5", "10", "50", "100", "500", "1,000"]],
        },
        workedExamples: [
          {
            title: "Example 1: Read XXVIII",
            steps: [
              "X = 10 and another X = 10, so XX = 20.",
              "V = 5 and III = 3, so VIII = 8.",
              "Add 20 + 8 = 28.",
              "Therefore, XXVIII = 28.",
            ],
          },
          {
            title: "Example 2: Read XLVI",
            steps: [
              "X before L means subtract 10 from 50.",
              "XL = 50 - 10 = 40.",
              "VI = 5 + 1 = 6.",
              "Add 40 + 6 = 46, so XLVI = 46.",
            ],
          },
          {
            title: "Example 3: Write 84 in Roman numerals",
            steps: [
              "Break 84 into 80 and 4.",
              "80 = LXXX because 50 + 10 + 10 + 10 = 80.",
              "4 = IV because 1 before 5 means 5 - 1.",
              "So 84 = LXXXIV.",
            ],
          },
          {
            title: "Example 4: Add XV + VII",
            steps: [
              "XV = 10 + 5 = 15.",
              "VII = 5 + 1 + 1 = 7.",
              "15 + 7 = 22.",
              "22 in Roman numerals is XXII.",
            ],
          },
        ],
        tasks: [
          { prompt: "Write XLVI in figures.", answer: "46" },
          { prompt: "Write LXXXIV in figures.", answer: "84" },
          { prompt: "Write 67 in Roman numerals.", answer: "LXVII" },
          { prompt: "Write 400 in Roman numerals.", answer: "CD" },
          { prompt: "Solve XV + VII in Roman numerals.", answer: "XXII" },
        ],
      },
    ],
  },
  {
    week: 6,
    title: "Addition and Subtraction",
    goal: "Add and subtract large numbers accurately using regrouping and checking.",
    colour: "#06b6d4",
    topics: [
      {
        title: "Regrouping Across Places",
        summary: "Regrouping means exchanging 10 of one place for 1 of the next place.",
        explanation: "In addition, carry when a column reaches 10 or more. In subtraction, exchange from the next place when the top digit is too small.",
        steps: [
          "Write the numbers in columns with matching place values aligned.",
          "Start from the units column.",
          "For addition, carry to the next column when the total is 10 or more.",
          "For subtraction, exchange from the next column when needed.",
          "Check addition by estimating and check subtraction by adding back.",
        ],
        tip: "A neat column layout prevents misaligned digits.",
        figure: {
          type: "table",
          headers: ["Column", "Calculation", "Write", "Regroup"],
          rows: [
            ["Units", "7 + 5 = 12", "2", "carry 1 ten"],
            ["Tens", "1 + 1 + 9 = 11", "1", "carry 1 hundred"],
            ["Hundreds", "4 + 6 + 1 = 11", "1", "carry 1 thousand"],
            ["Thousands", "6 + 8 + 1 = 15", "15", "final thousands"],
          ],
        },
        tasks: [
          { prompt: "Solve 36,417 + 18,695.", answer: "55,112" },
          { prompt: "Solve 90,000 - 47,538.", answer: "42,462" },
          { prompt: "Solve 5,120 + 2,875 + 1,005.", answer: "9,000" },
          { prompt: "A shop earned N64,500 and spent N29,875. What is the balance?", answer: "N34,625" },
          { prompt: "Estimate 52,890 + 31,205 to the nearest thousand.", answer: "84,000" },
        ],
      },
    ],
  },
  {
    week: 7,
    title: "Mid-Term Revision and Assessment",
    goal: "Review Weeks 1-6 and correct errors using a clear checking routine.",
    colour: "#f59e0b",
    topics: [
      {
        title: "Error Log and Repair",
        summary: "Revision is more useful when you find the first wrong step and repair it.",
        explanation: "Do not only mark an answer wrong. Identify the skill, find the first wrong line, correct the rule and try a similar question.",
        steps: [
          "Name the topic of the question.",
          "Check whether the correct rule was chosen.",
          "Find the first incorrect step.",
          "Rewrite that step correctly.",
          "Try another question of the same type.",
        ],
        tip: "The first wrong step is usually more important than the final wrong answer.",
        figure: {
          type: "table",
          headers: ["Skill", "Check", "Common error"],
          rows: [
            ["Place value", "Is each digit in the correct place?", "reading 40,000 as 4,000"],
            ["Comparison", "Did you start from the greatest place?", "choosing by the last digit"],
            ["Roman numerals", "Was subtraction used correctly?", "writing IIII instead of IV"],
            ["Operations", "Are columns aligned?", "adding tens under hundreds"],
          ],
        },
        tasks: [
          { prompt: "Write 8,064 in words.", answer: "eight thousand and sixty-four" },
          { prompt: "State the value of 4 in 348,215.", answer: "40,000" },
          { prompt: "Insert > or <: 458,210 __ 458,201.", answer: ">" },
          { prompt: "Write 49 in Roman numerals.", answer: "XLIX" },
          { prompt: "Solve 42,306 - 18,945.", answer: "23,361" },
        ],
      },
    ],
  },
  {
    week: 8,
    title: "Multiplication",
    goal: "Multiply by one- and two-digit numbers using place value, grids and vertical methods.",
    colour: "#10b981",
    topics: [
      {
        title: "Grid and Vertical Multiplication",
        summary: "Multiplication is repeated equal groups. Two-digit multiplication uses partial products.",
        explanation: "For 214 x 32, multiply by 2 and by 30, then add the partial products: 428 + 6,420 = 6,848.",
        steps: [
          "Break the two-digit multiplier into tens and units.",
          "Multiply the first number by the units part.",
          "Multiply the first number by the tens part.",
          "Add the partial products.",
          "Estimate to check whether the answer is reasonable.",
        ],
        tip: "When multiplying by 30, remember the zero because 30 means 3 tens.",
        figure: {
          type: "table",
          headers: ["Part", "Calculation", "Partial product"],
          rows: [
            ["Units", "214 x 2", "428"],
            ["Tens", "214 x 30", "6,420"],
            ["Total", "428 + 6,420", "6,848"],
          ],
        },
        tasks: [
          { prompt: "Solve 132 x 23.", answer: "3,036" },
          { prompt: "Solve 406 x 14.", answer: "5,684" },
          { prompt: "Solve 123 x 32.", answer: "3,936" },
          { prompt: "A class has 28 pupils. Each pupil gets 25 books. How many books are needed?", answer: "700 books" },
          { prompt: "Estimate 198 x 49.", answer: "about 10,000" },
        ],
      },
    ],
  },
  {
    week: 9,
    title: "Division",
    goal: "Divide whole numbers, interpret remainders and check division using multiplication.",
    colour: "#6366f1",
    topics: [
      {
        title: "Long Division and Remainders",
        summary: "Division shares equally or groups equally.",
        explanation: "A remainder is what is left after making equal groups. In 758 divided by 6, the answer is 126 remainder 2 because 126 x 6 = 756 and 2 is left.",
        steps: [
          "Decide how many equal groups are needed.",
          "Divide one place at a time from left to right.",
          "Bring down the next digit after each subtraction.",
          "Write the remainder if something is left.",
          "Check by multiplying the quotient by the divisor and adding the remainder.",
        ],
        tip: "The remainder must always be smaller than the divisor.",
        figure: {
          type: "table",
          headers: ["Question", "Quotient", "Remainder", "Check"],
          rows: [
            ["758 / 6", "126", "2", "126 x 6 + 2 = 758"],
            ["648 / 9", "72", "0", "72 x 9 = 648"],
            ["1,500 / 30", "50", "0", "50 x 30 = 1,500"],
          ],
        },
        tasks: [
          { prompt: "Solve 854 / 7.", answer: "122" },
          { prompt: "Solve 758 / 6.", answer: "126 r2" },
          { prompt: "Solve 1,500 / 30.", answer: "50" },
          { prompt: "648 oranges are shared among 9 baskets. How many in each basket?", answer: "72" },
          { prompt: "Check 432 / 6 using multiplication.", answer: "72; 72 x 6 = 432" },
        ],
      },
    ],
  },
  {
    week: 10,
    title: "Lowest Common Multiple (LCM)",
    goal: "Find the smallest common multiple of two or more numbers.",
    colour: "#ef4444",
    topics: [
      {
        title: "Finding LCM",
        summary: "A multiple is the result of multiplying a number by 1, 2, 3 and so on.",
        explanation: "The lowest common multiple is the smallest number that appears in the multiple lists of all the given numbers.",
        steps: [
          "List multiples of the first number.",
          "List multiples of the second number.",
          "Circle the multiples that appear in both lists.",
          "Choose the smallest common multiple.",
          "Use the LCM for repeated events that meet again.",
        ],
        tip: "Common means shared. Lowest means the smallest shared one.",
        figure: {
          type: "table",
          headers: ["Numbers", "Multiples", "LCM"],
          rows: [
            [
              "4 and 6",
              ["4, 8, ", { text: "12", circle: true }, "; 6, ", { text: "12", circle: true }],
              { text: "12", circle: true },
            ],
            [
              "8 and 12",
              ["8, 16, ", { text: "24", circle: true }, "; 12, ", { text: "24", circle: true }],
              { text: "24", circle: true },
            ],
            [
              "3, 5 and 6",
              ["3, 6, 9, 12, 15, 18, 21, 24, 27, ", { text: "30", circle: true }, "; 5, 10, 15, 20, 25, ", { text: "30", circle: true }, "; 6, 12, 18, 24, ", { text: "30", circle: true }],
              { text: "30", circle: true },
            ],
          ],
        },
        tasks: [
          { prompt: "Find the LCM of 4 and 9.", answer: "36" },
          { prompt: "Find the LCM of 8 and 12.", answer: "24" },
          { prompt: "Find the LCM of 3, 5 and 6.", answer: "30" },
          { prompt: "Two lights flash every 4 seconds and 7 seconds. When will they flash together again?", answer: "28 seconds" },
          { prompt: "Is 48 a common multiple of 6 and 8?", answer: "yes" },
        ],
      },
    ],
  },
  {
    week: 11,
    title: "Highest Common Factor (HCF)",
    goal: "Find the greatest factor shared by two or more numbers.",
    colour: "#14b8a6",
    topics: [
      {
        title: "Finding HCF",
        summary: "A factor divides a number exactly without a remainder.",
        explanation: "The highest common factor is the greatest number that can divide all the given numbers exactly.",
        steps: [
          "List the factors of each number.",
          "Circle the factors that appear in every list.",
          "Choose the greatest common factor.",
          "Use HCF when sharing items into the largest equal groups.",
          "Check by dividing each original number by the HCF.",
        ],
        tip: "LCM looks at multiples going upward; HCF looks at factors inside the number.",
        figure: {
          type: "table",
          headers: ["Numbers", "Common factors", "HCF"],
          rows: [
            ["24 and 36", "1, 2, 3, 4, 6, 12", "12"],
            ["32 and 48", "1, 2, 4, 8, 16", "16"],
            ["18, 30 and 42", "1, 2, 3, 6", "6"],
          ],
        },
        tasks: [
          { prompt: "Find the HCF of 24 and 36.", answer: "12" },
          { prompt: "Find the HCF of 32 and 48.", answer: "16" },
          { prompt: "Find the HCF of 18, 30 and 42.", answer: "6" },
          { prompt: "36 pencils and 48 pens are packed equally. What is the greatest number of packs?", answer: "12 packs" },
          { prompt: "List the factors of 36.", answer: "1, 2, 3, 4, 6, 9, 12, 18, 36" },
        ],
      },
    ],
  },
  {
    week: 12,
    title: "End-of-Term Revision",
    goal: "Review all first-term skills and choose the correct method for mixed questions.",
    colour: "#a855f7",
    topics: [
      {
        title: "Mixed Revision Method",
        summary: "A mixed paper tests whether you can choose the right method, not only calculate.",
        explanation: "Before solving, name the topic: place value, comparison, Roman numerals, operation, LCM or HCF.",
        steps: [
          "Read the question twice.",
          "Underline the important numbers and operation words.",
          "Choose the matching method.",
          "Show your working neatly.",
          "Use a checking method before submitting.",
        ],
        tip: "If the method is wrong, even neat calculation may give the wrong answer.",
        figure: {
          type: "table",
          headers: ["Topic", "Main decision", "Best check"],
          rows: [
            ["Place value", "Which place is each digit in?", "expanded form"],
            ["Operations", "Add, subtract, multiply or divide?", "estimate or inverse"],
            ["LCM", "When do events meet again?", "multiple lists"],
            ["HCF", "How can items be shared equally?", "factor lists"],
          ],
        },
        tasks: [
          { prompt: "Expand 730,405.", answer: "700,000 + 30,000 + 400 + 5" },
          { prompt: "Write LXXXIV in figures.", answer: "84" },
          { prompt: "Solve 36,417 + 18,695.", answer: "55,112" },
          { prompt: "Solve 123 x 32.", answer: "3,936" },
          { prompt: "Solve 758 / 6.", answer: "126 r2" },
          { prompt: "Find LCM of 8 and 12 and HCF of 32 and 48.", answer: "LCM = 24; HCF = 16" },
        ],
      },
    ],
  },
  {
    week: 13,
    title: "Examination Practice",
    goal: "Practise a complete mixed first-term test calmly and accurately.",
    colour: "#0ea5e9",
    topics: [
      {
        title: "Final Mixed Test",
        summary: "Use all first-term skills with neat working and careful checking.",
        explanation: "The final practice combines number names, place value, comparison, Roman numerals, operations, LCM and HCF.",
        steps: [
          "Start with questions you understand quickly.",
          "Show working for every calculation.",
          "Return to harder questions after completing easier ones.",
          "Check operation signs and place-value alignment.",
          "Submit only after reviewing every answer.",
        ],
        tip: "A correct method written neatly is easier to check than mental guessing.",
        figure: {
          type: "checklist",
          items: ["Place value", "Large number names", "Comparison", "Roman numerals", "Addition and subtraction", "Multiplication", "Division", "LCM", "HCF"],
        },
        tasks: [
          { prompt: "Write 506,042 in words.", answer: "five hundred and six thousand, forty-two" },
          { prompt: "Order 712,000, 721,000 and 702,100 descending.", answer: "721,000, 712,000, 702,100" },
          { prompt: "Write 67 in Roman numerals.", answer: "LXVII" },
          { prompt: "Solve 90,000 - 47,538.", answer: "42,462" },
          { prompt: "Solve 406 x 14.", answer: "5,684" },
          { prompt: "Solve 854 / 7.", answer: "122" },
          { prompt: "Find LCM of 4 and 9.", answer: "36" },
          { prompt: "Find HCF of 18, 30 and 42.", answer: "6" },
        ],
      },
    ],
  },
];

const BASIC4_WORKED_EXAMPLES = {
  "Four-Digit Place Value": [
    {
      title: "Example 1: Expand 7,305",
      steps: [
        "Separate the digits: 7 thousands, 3 hundreds, 0 tens and 5 units.",
        "Write each value: 7,000, 300, 0 and 5.",
        "Expanded form is 7,000 + 300 + 5.",
      ],
    },
    {
      title: "Example 2: Write 4,729 in words",
      steps: [
        "Read the thousands first: 4,000 is four thousand.",
        "Read the remaining part: 729 is seven hundred and twenty-nine.",
        "So 4,729 is four thousand, seven hundred and twenty-nine.",
      ],
    },
    {
      title: "Example 3: Compare 3,504 and 3,450",
      steps: [
        "Both numbers have 3 thousands.",
        "Compare hundreds: 5 hundreds is greater than 4 hundreds.",
        "So 3,504 > 3,450.",
      ],
    },
  ],
  "Periods and Large Numbers": [
    {
      title: "Example 1: Read 704,219",
      steps: [
        "Group the number into periods: 704 | 219.",
        "Read the thousands period: seven hundred and four thousand.",
        "Read the units period: two hundred and nineteen.",
        "So 704,219 is seven hundred and four thousand, two hundred and nineteen.",
      ],
    },
    {
      title: "Example 2: Write 980,007 in figures",
      steps: [
        "The thousands period is 980, so write 980 before the comma.",
        "The units period is 007, because there are no hundreds or tens.",
        "Join the periods to get 980,007.",
      ],
    },
    {
      title: "Example 3: Find the value of 4 in 348,215",
      steps: [
        "Locate the digit 4 in 348,215.",
        "It is in the ten-thousands place.",
        "Its value is 40,000.",
      ],
    },
  ],
  "Constant Jumps": [
    {
      title: "Example 1: Continue 35, 42, 49, __",
      steps: [
        "Find the jump: 42 - 35 = 7.",
        "Use the same jump after 49.",
        "49 + 7 = 56, so the next number is 56.",
      ],
    },
    {
      title: "Example 2: Continue 180, 240, 300, __",
      steps: [
        "Find the jump: 240 - 180 = 60.",
        "Check again: 300 - 240 = 60.",
        "300 + 60 = 360, so the next number is 360.",
      ],
    },
    {
      title: "Example 3: How many jumps of 5 reach 40?",
      steps: [
        "Count in fives: 5, 10, 15, 20, 25, 30, 35, 40.",
        "There are 8 jumps.",
        "This also means 8 x 5 = 40.",
      ],
    },
  ],
  "Compare From the Greatest Place": [
    {
      title: "Example 1: Compare 650,004 and 649,999",
      steps: [
        "Compare hundred-thousands: both have 6.",
        "Compare ten-thousands: 5 is greater than 4.",
        "So 650,004 > 649,999.",
      ],
    },
    {
      title: "Example 2: Compare 305,020 and 305,200",
      steps: [
        "The hundred-thousands, ten-thousands, thousands and hundreds are the same.",
        "Compare tens: 2 tens is less than 20 tens.",
        "So 305,020 < 305,200.",
      ],
    },
    {
      title: "Example 3: Order 90,005, 89,950 and 90,050",
      steps: [
        "89,950 is smaller because it is below 90,000.",
        "Compare 90,005 and 90,050: 5 tens is greater than 0 tens.",
        "Ascending order is 89,950, 90,005, 90,050.",
      ],
    },
  ],
  "Roman Symbols and Subtraction": [
    {
      title: "Example 1: Read XXVIII",
      steps: [
        "X = 10 and another X = 10, so XX = 20.",
        "V = 5 and III = 3, so VIII = 8.",
        "Add 20 + 8 = 28.",
        "Therefore, XXVIII = 28.",
      ],
    },
    {
      title: "Example 2: Read XLVI",
      steps: [
        "X before L means subtract 10 from 50.",
        "XL = 50 - 10 = 40.",
        "VI = 5 + 1 = 6.",
        "Add 40 + 6 = 46, so XLVI = 46.",
      ],
    },
    {
      title: "Example 3: Write 84 in Roman numerals",
      steps: [
        "Break 84 into 80 and 4.",
        "80 = LXXX because 50 + 10 + 10 + 10 = 80.",
        "4 = IV because 1 before 5 means 5 - 1.",
        "So 84 = LXXXIV.",
      ],
    },
    {
      title: "Example 4: Add XV + VII",
      steps: [
        "XV = 10 + 5 = 15.",
        "VII = 5 + 1 + 1 = 7.",
        "15 + 7 = 22.",
        "22 in Roman numerals is XXII.",
      ],
    },
  ],
  "Regrouping Across Places": [
    {
      title: "Example 1: Add 36,417 + 18,695",
      steps: [
        "Write the numbers in columns: units under units, tens under tens, and so on.",
        "Units: 7 + 5 = 12. Write 2 and carry 1 ten.",
        "Tens: 1 carried + 1 + 9 = 11. Write 1 and carry 1 hundred.",
        "Hundreds: 1 carried + 4 + 6 = 11. Write 1 and carry 1 thousand.",
        "Thousands and ten-thousands give 55,112.",
      ],
    },
    {
      title: "Example 2: Subtract 90,000 - 47,538",
      steps: [
        "Write 90,000 above 47,538 with the places aligned.",
        "Because several zeros cannot subtract, exchange across the places from the ten-thousands.",
        "After exchanging, subtract each column from right to left.",
        "The answer is 42,462.",
      ],
    },
    {
      title: "Example 3: Check a subtraction answer",
      steps: [
        "If 90,000 - 47,538 = 42,462, add back to check.",
        "42,462 + 47,538 = 90,000.",
        "Because the sum returns to the starting number, the subtraction is correct.",
      ],
    },
  ],
  "Error Log and Repair": [
    {
      title: "Example 1: Place-value error",
      steps: [
        "A learner says the value of 4 in 348,215 is 4,000.",
        "Check the place of 4: it is in the ten-thousands place.",
        "Repair: the value is 40,000.",
      ],
    },
    {
      title: "Example 2: Roman numeral error",
      steps: [
        "A learner writes 49 as IL.",
        "Use allowed subtraction pairs: 40 is XL and 9 is IX.",
        "Repair: 49 is XLIX.",
      ],
    },
    {
      title: "Example 3: Operation error",
      steps: [
        "If a subtraction answer looks too small or too large, check by adding back.",
        "For 42,306 - 18,945, the difference should be around 23,000.",
        "The exact answer is 23,361, and 23,361 + 18,945 = 42,306.",
      ],
    },
  ],
  "Grid and Vertical Multiplication": [
    {
      title: "Example 1: Multiply 132 x 23",
      steps: [
        "Break 23 into 20 and 3.",
        "132 x 3 = 396.",
        "132 x 20 = 2,640.",
        "Add 396 + 2,640 = 3,036.",
      ],
    },
    {
      title: "Example 2: Multiply 406 x 14",
      steps: [
        "Break 14 into 10 and 4.",
        "406 x 4 = 1,624.",
        "406 x 10 = 4,060.",
        "Add 1,624 + 4,060 = 5,684.",
      ],
    },
    {
      title: "Example 3: Word problem",
      steps: [
        "There are 28 pupils and each pupil gets 25 books.",
        "Multiply 28 x 25.",
        "25 x 20 = 500 and 25 x 8 = 200.",
        "500 + 200 = 700 books.",
      ],
    },
  ],
  "Long Division and Remainders": [
    {
      title: "Example 1: Divide 648 by 9",
      steps: [
        "9 goes into 64 seven times because 9 x 7 = 63.",
        "Subtract 63 from 64 to get 1, then bring down 8.",
        "9 goes into 18 two times.",
        "So 648 / 9 = 72.",
      ],
    },
    {
      title: "Example 2: Divide 758 by 6",
      steps: [
        "6 goes into 75 twelve times, giving 72 with 3 left.",
        "Bring down 8 to make 38.",
        "6 goes into 38 six times, giving 36 with 2 left.",
        "So 758 / 6 = 126 remainder 2.",
      ],
    },
    {
      title: "Example 3: Check with multiplication",
      steps: [
        "To check 126 remainder 2, multiply 126 x 6.",
        "126 x 6 = 756.",
        "Add the remainder: 756 + 2 = 758.",
        "The division is correct.",
      ],
    },
  ],
  "Finding LCM": [
    {
      title: "Example 1: LCM of 4 and 6",
      steps: [
        "List multiples of 4: 4, 8, 12, 16, 20.",
        "List multiples of 6: 6, 12, 18, 24.",
        "The first shared multiple is 12, so the LCM is 12.",
      ],
    },
    {
      title: "Example 2: LCM of 8 and 12",
      steps: [
        "Multiples of 8 are 8, 16, 24, 32.",
        "Multiples of 12 are 12, 24, 36.",
        "The smallest shared multiple is 24.",
      ],
    },
    {
      title: "Example 3: Two events meeting again",
      steps: [
        "One bell rings every 4 minutes and another every 7 minutes.",
        "Find the LCM of 4 and 7.",
        "4 and 7 first share 28, so they ring together again after 28 minutes.",
      ],
    },
  ],
  "Finding HCF": [
    {
      title: "Example 1: HCF of 24 and 36",
      steps: [
        "Factors of 24 include 1, 2, 3, 4, 6, 8, 12 and 24.",
        "Factors of 36 include 1, 2, 3, 4, 6, 9, 12, 18 and 36.",
        "The greatest shared factor is 12.",
      ],
    },
    {
      title: "Example 2: HCF of 32 and 48",
      steps: [
        "Factors shared by 32 and 48 include 1, 2, 4, 8 and 16.",
        "The greatest of these is 16.",
        "So the HCF of 32 and 48 is 16.",
      ],
    },
    {
      title: "Example 3: Equal packing",
      steps: [
        "36 pencils and 48 pens must be packed equally.",
        "Use HCF because we need the greatest equal number of packs.",
        "HCF of 36 and 48 is 12, so make 12 packs.",
        "Each pack gets 3 pencils and 4 pens.",
      ],
    },
  ],
  "Mixed Revision Method": [
    {
      title: "Example 1: Choose place value",
      steps: [
        "Question: expand 730,405.",
        "This is place value, so separate the digits by place.",
        "730,405 = 700,000 + 30,000 + 400 + 5.",
      ],
    },
    {
      title: "Example 2: Choose operation",
      steps: [
        "Question: solve 36,417 + 18,695.",
        "The plus sign shows addition, so align columns.",
        "Add from units to ten-thousands to get 55,112.",
      ],
    },
    {
      title: "Example 3: Choose LCM or HCF",
      steps: [
        "If the question asks when events meet again, use LCM.",
        "If the question asks for greatest equal sharing, use HCF.",
        "For 8 and 12, LCM = 24, while HCF = 4.",
      ],
    },
  ],
  "Final Mixed Test": [
    {
      title: "Example 1: Start with a quick fact",
      steps: [
        "Question: write 67 in Roman numerals.",
        "Break 67 into 60 and 7.",
        "60 = LX and 7 = VII, so 67 = LXVII.",
      ],
    },
    {
      title: "Example 2: Show working for calculation",
      steps: [
        "Question: solve 406 x 14.",
        "Break 14 into 10 and 4.",
        "406 x 10 = 4,060 and 406 x 4 = 1,624.",
        "Add to get 5,684.",
      ],
    },
    {
      title: "Example 3: Check before submitting",
      steps: [
        "Question: solve 854 / 7.",
        "854 divided by 7 = 122.",
        "Check: 122 x 7 = 854.",
        "The answer is correct.",
      ],
    },
  ],
};

export const BASIC4_STUDY_WEEKS = BASIC4_STUDY_WEEK_BASE.map((week) => ({
  ...week,
  topics: week.topics.map((topic) => ({
    ...topic,
    workedExamples: topic.workedExamples?.length >= 3 ? topic.workedExamples : BASIC4_WORKED_EXAMPLES[topic.title] || [],
  })),
}));

export const BASIC4_DOCUMENT_NOTES = {
  intro: [
    "Study the idea first, read each table from left to right, copy the demonstration and explain every step aloud.",
    "Complete practice without viewing answers, mark it, identify the first incorrect step and retry.",
    "Each week follows Learn, See, Follow, Try and Correct so the learner can study independently.",
  ],
  interactions: [
    "Read the explanation slowly before opening the practice section.",
    "Use the tables to point to each place, row, jump or partial product.",
    "Try every answer first, then submit to check.",
    "If an answer is wrong, correct the first wrong step before trying again.",
  ],
  weeks: Object.fromEntries(
    BASIC4_STUDY_WEEKS.map((week) => [
      week.week,
      [
        { heading: "Learning Goal", body: week.goal },
        { heading: "Learn", body: week.topics[0].summary },
        { heading: "See", body: week.topics[0].explanation },
        { heading: "Follow", list: week.topics[0].steps },
        { heading: "Tip", body: week.topics[0].tip },
        { heading: "Try It", list: week.topics[0].tasks.map((task) => task.prompt) },
        { heading: "Check Your Answers", list: week.topics[0].tasks.map((task) => task.answer) },
      ],
    ])
  ),
};
