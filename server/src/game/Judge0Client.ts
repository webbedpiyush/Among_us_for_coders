export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  time: string;
  memory: number;
  status: { id: number; description: string };
}

export class Judge0Client {
  private baseUrl: string;
  private apiKey?: string;
  private apiHost?: string;

  constructor(baseUrl: string, apiKey?: string, apiHost?: string) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.apiHost = apiHost;
  }

  async submitCode(
    sourceCode: string,
    languageId: number,
    stdin: string = "",
    expectedOutput?: string,
  ): Promise<SubmissionResult> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.apiKey) {
      headers["X-RapidAPI-Key"] = this.apiKey;
      if (this.apiHost) {
        headers["X-RapidAPI-Host"] = this.apiHost;
      }
    }

    const response = await fetch(
      `${this.baseUrl}/submissions?base64_encoded=true&wait=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_code: Buffer.from(sourceCode).toString("base64"),
          language_id: languageId,
          stdin: Buffer.from(stdin).toString("base64"),
          expected_output: expectedOutput
            ? Buffer.from(expectedOutput).toString("base64")
            : undefined,
          cpu_time_limit: 2,
          memory_limit: 128000,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Judge0 error ${response.status}: ${errorText}`);
    }

    const result = (await response.json()) as {
      stdout?: string | null;
      stderr?: string | null;
      compile_output?: string | null;
      time?: string;
      memory?: number;
      status?: { id: number; description: string };
    };

    return {
      stdout: result.stdout
        ? Buffer.from(result.stdout, "base64").toString()
        : null,
      stderr: result.stderr
        ? Buffer.from(result.stderr, "base64").toString()
        : null,
      compile_output: result.compile_output
        ? Buffer.from(result.compile_output, "base64").toString()
        : null,
      time: result.time ?? "",
      memory: result.memory ?? 0,
      status: result.status ?? { id: 0, description: "Unknown" },
    };
  }

  async runTestCase(
    sourceCode: string,
    languageId: number,
    testCode: string,
    expectedOutput: string,
  ): Promise<{ passed: boolean; output: string; error?: string }> {
    const fullCode = `${sourceCode}\n\n${testCode}`;
    const result = await this.submitCode(
      fullCode,
      languageId,
      "",
      expectedOutput,
    );

    const passed = result.status.id === 3;
    return {
      passed,
      output: result.stdout || "",
      error: result.stderr || result.compile_output || undefined,
    };
  }
}
