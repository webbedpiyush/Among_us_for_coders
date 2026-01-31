import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import type { Challenge, TestCase } from "./challenges";
import { z } from "zod";

interface AiTestResult {
  name: string;
  passed: boolean;
  output?: string;
  error?: string;
}

const MODEL = "gemini-2.5-flash";
const MAX_RETRIES = 3;
const TIMEOUT_MS = 12000;

function extractJsonFromText(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

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

const resultSchema = z.object({
  passed: z.boolean(),
  output: z.string(),
  error: z.string().nullable(),
});

async function generateWithTimeout(prompt: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const { object } = await generateObject({
      model: google(MODEL),
      schema: resultSchema,
      schemaName: "TestCaseEvaluation",
      schemaDescription:
        "Deterministic evaluation of code against a test case.",
      prompt,
      temperature: 0,
      maxOutputTokens: 256,
      maxRetries: MAX_RETRIES,
      seed: 1,
      experimental_repairText: async ({ text, error }) => {
        console.error("AI schema parse error:", error?.message || error);
        console.error("AI raw response:", text);
        const extracted = extractJsonFromText(
          text.replace(/```json/gi, "").replace(/```/g, ""),
        );
        return extracted;
      },
      abortSignal: controller.signal,
    });
    console.log(object);
    return object;
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
    try {
      const parsed = await generateWithTimeout(prompt);
      results.push({
        name: testCase.name,
        passed: parsed.passed,
        output: parsed.output,
        error: parsed.error || undefined,
      });
      console.log(results);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "AI generation failed";
      results.push({
        name: testCase.name,
        passed: false,
        output: "",
        error: message,
      });
    }
  }

  return results;
}
