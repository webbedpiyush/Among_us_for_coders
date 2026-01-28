import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import type { Challenge, TestCase } from "./challenges";

interface AiTestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

const MODEL = "gemini-2.5-pro";

function buildPrompt(code: string, challenge: Challenge, testCase: TestCase) {
  return [
    "You are a strict code test evaluator.",
    "Evaluate the submitted code against the test case.",
    "Return ONLY valid JSON with keys: passed (boolean), output (string), error (string or null).",
    "",
    `LanguageId: ${challenge.languageId}`,
    `Category: ${challenge.category}`,
    "",
    "SubmittedCode:",
    "```",
    code,
    "```",
    "",
    "TestCaseCode:",
    "```",
    testCase.testCode,
    "```",
    "",
    `ExpectedOutput: ${testCase.expectedOutput}`,
    "",
    "If execution output matches expected output, passed=true, else passed=false.",
  ].join("\n");
}

function safeJsonParse(text: string) {
  try {
    const cleaned = text
      .trim()
      .replace(/^```json|```$/g, "")
      .trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

export async function runAiTests(
  code: string,
  challenge: Challenge,
): Promise<AiTestResult[]> {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GOOGLE_GENERATIVE_AI_API_KEY is not set (or GOOGLE_API_KEY fallback)",
    );
  }

  const results: AiTestResult[] = [];
  for (const testCase of challenge.testCases) {
    const prompt = buildPrompt(code, challenge, testCase);
    const { text } = await generateText({
      model: google(MODEL),
      prompt,
      maxOutputTokens: 256,
      temperature: 0,
    });

    const parsed = safeJsonParse(text);
    if (!parsed || typeof parsed.passed !== "boolean") {
      results.push({
        name: testCase.name,
        passed: false,
        output: "",
        error: "AI response parse error",
      });
      continue;
    }

    results.push({
      name: testCase.name,
      passed: parsed.passed,
      output: typeof parsed.output === "string" ? parsed.output : "",
      error: typeof parsed.error === "string" ? parsed.error : undefined,
    });
  }

  return results;
}
