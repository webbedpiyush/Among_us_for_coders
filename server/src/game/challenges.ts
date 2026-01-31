export interface TestCase {
  name: string;
  testCode: string;
  expectedOutput: string;
}

export interface SabotageTask {
  id: string;
  description: string;
  pattern: string; // Regex pattern checked against code
}

export interface Challenge {
  category: "dsa" | "oop" | "security" | "frontend" | "backend";
  languageId: number;
  testCases: TestCase[];
  sabotageTasks: SabotageTask[];
}

const CHALLENGES: Challenge[] = [
  {
    category: "dsa",
    languageId: 71,
    testCases: [
      {
        name: "finds middle",
        testCode: "print(binary_search([1,2,3,4,5], 3))",
        expectedOutput: "2\n",
      },
      {
        name: "not found",
        testCode: "print(binary_search([1,2,3,4,5], 8))",
        expectedOutput: "-1\n",
      },
    ],
    sabotageTasks: [
      {
        id: "dsa-1",
        description: "Make binary_search always return 0",
        pattern: "return\\s+0",
      },
      {
        id: "dsa-2",
        description: "Remove the while loop condition",
        pattern: "while\\s+True",
      },
    ],
  },
  {
    category: "oop",
    languageId: 71,
    testCases: [
      {
        name: "add item",
        testCode:
          "vm = VendingMachine()\nvm.add_item('soda', 1.5, 2)\nprint(len(vm.inventory))",
        expectedOutput: "1\n",
      },
      {
        name: "purchase",
        testCode:
          "vm = VendingMachine()\nvm.add_item('soda', 1.5, 1)\nprint(vm.purchase('soda', 2.0))",
        expectedOutput: "0.5\n",
      },
    ],
    sabotageTasks: [
      {
        id: "oop-1",
        description: "Set price to 0 in purchase()",
        pattern: "price\\s*=\\s*0",
      },
      {
        id: "oop-2",
        description: "Increase balance instead of decreasing",
        pattern: "balance\\s*\\+\\=",
      },
    ],
  },
  {
    category: "security",
    languageId: 71,
    testCases: [
      {
        name: "uses parameters",
        testCode:
          "class FakeCursor:\n    def __init__(self):\n        self.query = None\n        self.params = None\n    def execute(self, q, p=None):\n        self.query = q\n        self.params = p\n    def fetchone(self):\n        return 'ok'\n\nclass FakeDB:\n    def cursor(self):\n        return FakeCursor()\n\ndb = FakeDB()\nuser = login_user('a', \"' OR 1=1 --\", db)\nprint(user)",
        expectedOutput: "ok\n",
      },
    ],
    sabotageTasks: [
      {
        id: "sec-1",
        description: "Keep raw SQL string formatting",
        pattern: 'f"SELECT \\* FROM users',
      },
    ],
  },
  {
    category: "frontend",
    languageId: 63,
    testCases: [
      {
        name: "component defined",
        testCode: "console.log(typeof Counter === 'function')",
        expectedOutput: "true\n",
      },
    ],
    sabotageTasks: [
      {
        id: "fe-1",
        description: "Make count start at 100",
        pattern: "useState\\(100\\)",
      },
    ],
  },
  {
    category: "backend",
    languageId: 71,
    testCases: [
      {
        name: "register exists",
        testCode: "print(register.__name__)",
        expectedOutput: "register\n",
      },
    ],
    sabotageTasks: [
      {
        id: "be-1",
        description: "Return 500 status always",
        pattern: "return\\s+jsonify\\(.*\\),\\s*500",
      },
    ],
  },
];

export function getChallengeByCategory(category: string | undefined) {
  if (!category) return null;
  return (
    CHALLENGES.find((challenge) => challenge.category === category) || null
  );
}
