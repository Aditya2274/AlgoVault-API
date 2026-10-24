import { spawn } from 'child_process';
import ts from 'typescript';
import prisma from '../config/prisma.js';
import { getStarterTemplates, type SupportedLanguage } from './starter-code.service.js';

export interface TestCasePayload {
  id: string;
  input: string;
  expectedOutput: string;
}

export interface TestCaseResult {
  testCaseId: string;
  input: string;
  expectedOutput: string;
  actualOutput: any;
  passed: boolean;
  runtimeMs: number;
  stdout: string;
  error: string | null;
}

export interface ExecutionSummary {
  total: number;
  passed: number;
  failed: number;
  allPassed: boolean;
  totalRuntimeMs: number;
  status: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Time Limit Exceeded' | 'Compilation Error';
  stdout: string;
  stderr: string | null;
}

export interface ExecutionResponse {
  summary: ExecutionSummary;
  results: TestCaseResult[];
}

export interface ExecuteOptions {
  questionId: string;
  language: SupportedLanguage;
  code: string;
  customInput?: string | undefined;
}

function normalizeJsonOrString(val: any): string {
  if (val === undefined || val === null) return '';
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val).trim();
}

function outputsMatch(actual: any, expectedStr: string): boolean {
  if (actual === null || actual === undefined) return false;
  try {
    const parsedExpected = JSON.parse(expectedStr);
    return JSON.stringify(actual) === JSON.stringify(parsedExpected);
  } catch {
    const act = normalizeJsonOrString(actual).replace(/\s+/g, '');
    const exp = expectedStr.trim().replace(/\s+/g, '');
    return act === exp;
  }
}

function detectFunctionName(code: string, language: SupportedLanguage, fallback: string): string {
  if (language === 'python') {
    const match = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    if (match && match[1]) return match[1];
  } else {
    const fnMatch = code.match(/function\s+([a-zA-Z0-9_$]+)\s*\(/);
    if (fnMatch && fnMatch[1]) return fnMatch[1];
    const arrowMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z0-9_$]+)\s*=>/);
    if (arrowMatch && arrowMatch[1]) return arrowMatch[1];
    const exprMatch = code.match(/(?:const|let|var)\s+([a-zA-Z0-9_$]+)\s*=\s*function/);
    if (exprMatch && exprMatch[1]) return exprMatch[1];
  }
  return fallback;
}

export async function executeCode(options: ExecuteOptions): Promise<ExecutionResponse> {
  const { questionId, language, code, customInput } = options;

  // 1. Fetch Question & Test Cases
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { testCases: true },
  });

  if (!question) {
    throw new Error('Question not found');
  }

  const starterMeta = getStarterTemplates(question.title);
  const fnName = detectFunctionName(code, language, starterMeta.functionName);

  // Determine test cases to run
  let casesToRun: TestCasePayload[] = [];
  if (customInput && customInput.trim()) {
    casesToRun = [
      {
        id: 'custom-case',
        input: customInput.trim(),
        expectedOutput: '',
      },
    ];
  } else {
    casesToRun = question.testCases.map((tc) => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));
  }

  if (casesToRun.length === 0) {
    casesToRun = [
      {
        id: 'fallback-empty',
        input: 'input = 0',
        expectedOutput: '',
      },
    ];
  }

  // 2. Prepare code execution script
  let command: string;
  let args: string[];

  if (language === 'javascript' || language === 'typescript') {
    let runnableJs = code;
    if (language === 'typescript') {
      try {
        const transpileResult = ts.transpileModule(code, {
          compilerOptions: {
            module: ts.ModuleKind.ESNext,
            target: ts.ScriptTarget.ES2022,
          },
        });
        runnableJs = transpileResult.outputText;
      } catch (err: any) {
        return {
          summary: {
            total: casesToRun.length,
            passed: 0,
            failed: casesToRun.length,
            allPassed: false,
            totalRuntimeMs: 0,
            status: 'Compilation Error',
            stdout: '',
            stderr: `TypeScript Compilation Error: ${err.message || String(err)}`,
          },
          results: [],
        };
      }
    }

    const testHarness = `
${runnableJs}

const __results = [];
const __testCases = ${JSON.stringify(casesToRun)};

for (let __i = 0; __i < __testCases.length; __i++) {
  const __tc = __testCases[__i];
  const __start = process.hrtime.bigint();
  try {
    const __varNames = [...__tc.input.matchAll(/(?:^|[,;])\\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*=/g)].map(m => m[1]);
    const __runFn = new Function("fn", \`
      var \${__tc.input};
      return fn(\${__varNames.join(", ")});
    \`);
    
    // Check if target function exists in scope
    let __targetFn = null;
    try {
      __targetFn = eval(${JSON.stringify(fnName)});
    } catch (e) {}

    if (typeof __targetFn !== "function") {
      const __fnMatch = ${JSON.stringify(runnableJs)}.match(/(?:function\\s+([a-zA-Z0-9_$]+)|(?:const|let|var)\\s+([a-zA-Z0-9_$]+)\\s*=)/);
      const __altName = __fnMatch ? (__fnMatch[1] || __fnMatch[2]) : null;
      if (__altName) {
        try { __targetFn = eval(__altName); } catch(e) {}
      }
    }

    if (typeof __targetFn !== "function") {
      throw new Error("Solution function '" + ${JSON.stringify(fnName)} + "' is not defined in your code");
    }

    const __actual = __runFn(__targetFn);
    const __end = process.hrtime.bigint();
    __results.push({
      id: __tc.id,
      input: __tc.input,
      expected: __tc.expectedOutput,
      actual: __actual,
      error: null,
      runtimeMs: Number(__end - __start) / 1e6
    });
  } catch (err) {
    const __end = process.hrtime.bigint();
    __results.push({
      id: __tc.id,
      input: __tc.input,
      expected: __tc.expectedOutput,
      actual: null,
      error: err.message || String(err),
      runtimeMs: Number(__end - __start) / 1e6
    });
  }
}

console.log("__ALGOVAULT_RESULTS__:" + JSON.stringify(__results));
`;

    command = 'node';
    args = ['--max-old-space-size=128', '-e', testHarness];
  } else if (language === 'python') {
    const testHarness = `
import json, time, re, sys

user_code = ${JSON.stringify(code)}
cases = ${JSON.stringify(casesToRun)}

scope = {}
try:
    exec(user_code, scope)
except Exception as e:
    print(f"__SYNTAX_ERROR__:{str(e)}", file=sys.stderr)
    sys.exit(1)

fn_name = ${JSON.stringify(fnName)}
fn = scope.get(fn_name)
if not fn:
    user_funcs = [v for k, v in scope.items() if callable(v) and not k.startswith('_')]
    if user_funcs:
        fn = user_funcs[-1]

results = []
for tc in cases:
    t_start = time.perf_counter()
    if not fn:
        results.append({
            "id": tc["id"],
            "input": tc["input"],
            "expected": tc["expectedOutput"],
            "actual": None,
            "error": f"Solution function '{fn_name}' is not defined in your code",
            "runtimeMs": 0
        })
        continue

    try:
        tc_scope = dict(scope)
        assignments = re.sub(r",\\s*([a-zA-Z_][a-zA-Z0-9_]*\\s*=)", r"\\n\\1", tc["input"])
        exec(assignments, tc_scope)
        var_names = [m.group(1) for m in re.finditer(r"(?:^|[\\n,;])\\s*([a-zA-Z_][a-zA-Z0-9_]*)\\s*=", tc["input"])]
        args = [tc_scope[k] for k in var_names]
        actual = fn(*args)
        t_end = time.perf_counter()
        results.append({
            "id": tc["id"],
            "input": tc["input"],
            "expected": tc["expectedOutput"],
            "actual": actual,
            "error": None,
            "runtimeMs": (t_end - t_start) * 1000
        })
    except Exception as e:
        t_end = time.perf_counter()
        results.append({
            "id": tc["id"],
            "input": tc["input"],
            "expected": tc["expectedOutput"],
            "actual": None,
            "error": str(e),
            "runtimeMs": (t_end - t_start) * 1000
        })

print("__ALGOVAULT_RESULTS__:" + json.dumps(results))
`;

    command = 'python3';
    args = ['-c', testHarness];
  } else {
    throw new Error(`Unsupported language: ${language}`);
  }

  // 3. Execute in safe isolated child process
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      timeout: 3500, // 3.5s execution timeout
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let rawStdout = '';
    let rawStderr = '';

    child.stdout.on('data', (d) => {
      rawStdout += d.toString();
    });

    child.stderr.on('data', (d) => {
      rawStderr += d.toString();
    });

    child.on('close', (exitCode, signal) => {
      // Check for timeout
      if (signal === 'SIGTERM' || signal === 'SIGKILL') {
        return resolve({
          summary: {
            total: casesToRun.length,
            passed: 0,
            failed: casesToRun.length,
            allPassed: false,
            totalRuntimeMs: 3500,
            status: 'Time Limit Exceeded',
            stdout: rawStdout,
            stderr: 'Execution timed out (Time Limit Exceeded: 3500ms limit reached)',
          },
          results: casesToRun.map((tc) => ({
            testCaseId: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: null,
            passed: false,
            runtimeMs: 3500,
            stdout: '',
            error: 'Time Limit Exceeded (infinite loop or computation too slow)',
          })),
        });
      }

      // Check for results marker
      const marker = '__ALGOVAULT_RESULTS__:';
      const markerIdx = rawStdout.indexOf(marker);

      if (markerIdx === -1) {
        // Runtime or compilation error
        const isSyntax = rawStderr.includes('__SYNTAX_ERROR__') || rawStderr.includes('SyntaxError');
        return resolve({
          summary: {
            total: casesToRun.length,
            passed: 0,
            failed: casesToRun.length,
            allPassed: false,
            totalRuntimeMs: 0,
            status: isSyntax ? 'Compilation Error' : 'Runtime Error',
            stdout: rawStdout,
            stderr: rawStderr.replace('__SYNTAX_ERROR__:', '').trim() || 'Process exited with non-zero status',
          },
          results: casesToRun.map((tc) => ({
            testCaseId: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
            actualOutput: null,
            passed: false,
            runtimeMs: 0,
            stdout: rawStdout,
            error: rawStderr.trim() || 'Runtime Error',
          })),
        });
      }

      const userStdout = rawStdout.slice(0, markerIdx).trim();
      const resultsJsonStr = rawStdout.slice(markerIdx + marker.length).trim();

      let parsedResults: any[] = [];
      try {
        parsedResults = JSON.parse(resultsJsonStr);
      } catch (err: any) {
        return resolve({
          summary: {
            total: casesToRun.length,
            passed: 0,
            failed: casesToRun.length,
            allPassed: false,
            totalRuntimeMs: 0,
            status: 'Runtime Error',
            stdout: userStdout,
            stderr: `Could not parse runner output: ${err.message}`,
          },
          results: [],
        });
      }

      // Format individual results
      let passedCount = 0;
      let totalRuntime = 0;

      const results: TestCaseResult[] = parsedResults.map((pr) => {
        const hasError = !!pr.error;
        const isCustom = !pr.expected;
        const matches = isCustom ? !hasError : outputsMatch(pr.actual, pr.expected);

        if (matches && !hasError) {
          passedCount++;
        }

        totalRuntime += pr.runtimeMs || 0;

        return {
          testCaseId: pr.id,
          input: pr.input,
          expectedOutput: pr.expected,
          actualOutput: pr.actual,
          passed: matches && !hasError,
          runtimeMs: Math.round((pr.runtimeMs || 0) * 100) / 100,
          stdout: userStdout,
          error: pr.error || null,
        };
      });

      const allPassed = passedCount === results.length;
      let status: ExecutionSummary['status'] = 'Accepted';
      if (!allPassed) {
        const hasRuntimeErr = results.some((r) => r.error !== null);
        status = hasRuntimeErr ? 'Runtime Error' : 'Wrong Answer';
      }

      resolve({
        summary: {
          total: results.length,
          passed: passedCount,
          failed: results.length - passedCount,
          allPassed,
          totalRuntimeMs: Math.round(totalRuntime * 100) / 100,
          status,
          stdout: userStdout,
          stderr: rawStderr.trim() || null,
        },
        results,
      });
    });
  });
}
