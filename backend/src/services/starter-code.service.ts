export type SupportedLanguage = 'javascript' | 'typescript' | 'python';

export interface CodeTemplates {
  javascript: string;
  typescript: string;
  python: string;
  functionName: string;
}

function toCamelCase(text: string): string {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/[\s\-_]+/g, '');
}

/**
 * Generates starter code templates 100% dynamically from the question title
 * and test case inputs. No questions are hardcoded in the codebase.
 */
export function getStarterTemplates(title: string, testCaseInputs: string[] = []): CodeTemplates {
  // 1. Generate canonical function name dynamically (e.g. "Two Sum" -> "twoSum", "Trapping Rain Water" -> "trappingRainWater")
  const fnName = toCamelCase(title) || 'solution';

  // 2. Extract parameter names dynamically from the first testcase input
  // e.g. "nums = [2,7,11,15], target = 9" -> ["nums", "target"]
  // e.g. "s = \"abcabcbb\"" -> ["s"]
  // e.g. "height = [0,1,0,2]" -> ["height"]
  let paramNames: string[] = [];
  const firstInput = testCaseInputs[0];
  if (firstInput) {
    const matches = [...firstInput.matchAll(/(?:^|[,;])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/g)];
    paramNames = matches.map((m) => m[1]).filter((p): p is string => Boolean(p));
  }

  // Fallback if inputs don't use variable assignment syntax
  if (paramNames.length === 0) {
    paramNames = ['input'];
  }

  const jsParams = paramNames.join(', ');
  const tsParams = paramNames.map((p) => `${p}: any`).join(', ');

  return {
    functionName: fnName,
    javascript: `/**
 * @param {${paramNames.map((p) => `* ${p}`).join(', ')}}
 * @return {*}
 */
function ${fnName}(${jsParams}) {
  // Write your code here
  
}`,
    typescript: `function ${fnName}(${tsParams}): any {
  // Write your code here
  return null;
}`,
    python: `def ${fnName}(${jsParams}):
    # Write your code here
    pass
`,
  };
}
