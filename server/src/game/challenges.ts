export interface TestCase {
  name: string;
  testCode: string;
  expectedOutput: string;
}

export interface Challenge {
  category: "dsa" | "oop" | "security" | "frontend" | "backend";
  languageId: number;
  testCases: TestCase[];
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
  },
  {
    category: "oop",
    languageId: 71,
    testCases: [
      {
        name: "add item",
        testCode: "vm = VendingMachine()\nvm.add_item('soda', 1.5, 2)\nprint(len(vm.inventory))",
        expectedOutput: "1\n",
      },
      {
        name: "purchase",
        testCode:
          "vm = VendingMachine()\nvm.add_item('soda', 1.5, 1)\nprint(vm.purchase('soda', 2.0))",
        expectedOutput: "0.5\n",
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
  },
];

export function getChallengeByCategory(category: string | undefined) {
  if (!category) return null;
  return CHALLENGES.find((challenge) => challenge.category === category) || null;
}
