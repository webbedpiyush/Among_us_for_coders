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
const MAX_RETRIES = 2;
const TIMEOUT_MS = 12000;

function buildPrompt(code: string, challenge: Challenge, testCase: TestCase) {
  return [
    "You are a strict code test evaluator.",
    "Evaluate the submitted code against the test case.",
    "Return ONLY valid JSON with keys: passed (boolean), output (string), error (string or null).",
    "Do not include markdown, explanations, or extra text.",
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

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : "";
}

function safeJsonParse(text: string) {
  try {
    const cleaned = extractJson(text)
      .replace(/^```json/i, "")
      .replace(/```$/i, "")
      .trim();
    if (!cleaned) return null;
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

async function generateWithTimeout(prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { text } = await generateText({
      model: google(MODEL),
      prompt,
      maxOutputTokens: 256,
      temperature: 0,
      abortSignal: controller.signal,
    });
    return text;
  } finally {
    clearTimeout(timeout);
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
    let parsed: any = null;
    let lastError = "AI response parse error";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const text = await generateWithTimeout(prompt);
        parsed = safeJsonParse(text);
        if (parsed && typeof parsed.passed === "boolean") break;
        lastError = "AI response parse error";
      } catch (error) {
        lastError =
          error instanceof Error ? error.message : "AI generation failed";
      }
    }

    if (!parsed || typeof parsed.passed !== "boolean") {
      results.push({
        name: testCase.name,
        passed: false,
        output: "",
        error: lastError,
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
