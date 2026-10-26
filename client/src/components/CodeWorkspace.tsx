import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import type { Question, SupportedLanguage, CodeTemplates, ExecutionResponse } from '../types';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Terminal, 
  FileCode,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface CodeWorkspaceProps {
  question: Question;
}

export default function CodeWorkspace({ question }: CodeWorkspaceProps) {
  const [language, setLanguage] = useState<SupportedLanguage>('javascript');
  const [code, setCode] = useState<string>('');
  const [templates, setTemplates] = useState<CodeTemplates | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResponse | null>(null);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [activeBottomTab, setActiveBottomTab] = useState<'results' | 'custom' | 'console'>('results');
  const [customInput, setCustomInput] = useState<string>('');
  const [savedCodes, setSavedCodes] = useState<Record<string, string>>({});

  // Fetch starter code templates whenever the selected question changes
  useEffect(() => {
    let isMounted = true;
    const fetchTemplates = async () => {
      try {
        const res = await fetch(`/api/execute/templates/${question.id}`);
        if (!res.ok) throw new Error('Failed to load templates');
        const json = await res.json();
        if (json.status === 'success' && isMounted) {
          setTemplates(json.data);
          const initialCode = json.data[language] || '';
          setCode(initialCode);
          setSavedCodes((prev) => ({
            ...prev,
            [`${question.id}-${language}`]: initialCode,
          }));
        }
      } catch (err) {
        console.error('Error fetching templates:', err);
      }
    };

    setExecutionResult(null);
    setSelectedCaseIdx(0);
    fetchTemplates();

    return () => {
      isMounted = false;
    };
  }, [question.id]);

  // Handle switching languages
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    const saved = savedCodes[`${question.id}-${newLang}`];
    if (saved) {
      setCode(saved);
    } else if (templates) {
      const templateCode = templates[newLang] || '';
      setCode(templateCode);
      setSavedCodes((prev) => ({
        ...prev,
        [`${question.id}-${newLang}`]: templateCode,
      }));
    }
  };

  const handleCodeChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    setSavedCodes((prev) => ({
      ...prev,
      [`${question.id}-${language}`]: val,
    }));
  };

  const handleResetCode = () => {
    if (templates) {
      const resetCode = templates[language] || '';
      setCode(resetCode);
      setSavedCodes((prev) => ({
        ...prev,
        [`${question.id}-${language}`]: resetCode,
      }));
    }
  };

  const runCode = async (useCustom: boolean = false) => {
    setIsRunning(true);
    setActiveBottomTab('results');
    try {
      const payload: any = {
        questionId: question.id,
        language,
        code,
      };

      if (useCustom && customInput.trim()) {
        payload.customInput = customInput.trim();
      }

      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.status === 'success') {
        setExecutionResult(json.data);
        setSelectedCaseIdx(0);
      } else {
        setExecutionResult({
          summary: {
            total: 1,
            passed: 0,
            failed: 1,
            allPassed: false,
            totalRuntimeMs: 0,
            status: 'Runtime Error',
            stdout: '',
            stderr: json.message || 'Error executing code',
          },
          results: [],
        });
      }
    } catch (err: any) {
      setExecutionResult({
        summary: {
          total: 1,
          passed: 0,
          failed: 1,
          allPassed: false,
          totalRuntimeMs: 0,
          status: 'Runtime Error',
          stdout: '',
          stderr: err.message || 'Network error connecting to execution engine',
        },
        results: [],
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getMonacoLanguage = (lang: SupportedLanguage) => {
    switch (lang) {
      case 'javascript':
        return 'javascript';
      case 'typescript':
        return 'typescript';
      case 'python':
        return 'python';
      default:
        return 'javascript';
    }
  };

  const selectedCaseResult = executionResult?.results?.[selectedCaseIdx];

  return (
    <div className="flex flex-col h-full bg-slate-900/60 border-0 lg:border-0 overflow-hidden shadow-xl">
      {/* Top Action & Language Toolbar */}
      <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between gap-3">
        {/* Language selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
              className="appearance-none bg-slate-900 border border-slate-700/80 text-xs font-medium text-slate-200 rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer transition hover:bg-slate-800"
            >
              <option value="javascript">JavaScript (Node.js 20)</option>
              <option value="typescript">TypeScript 5.x</option>
              <option value="python">Python 3.12</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2 pointer-events-none" />
          </div>

          <button
            onClick={handleResetCode}
            title="Reset code to default template"
            aria-label="Reset code to default template"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        {/* Execution Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => runCode(false)}
            disabled={isRunning || !code.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : 'fill-white'}`} />
            {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>

      {/* Code Editor Pane */}
      <div className="flex-1 min-h-[260px] w-full bg-[#1e1e1e] relative">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          theme="vs-dark"
          value={code}
          onChange={handleCodeChange}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
            suggestOnTriggerCharacters: true,
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>

      {/* Bottom Console & Results Section */}
      <div className="flex flex-col border-t border-slate-800 bg-slate-950/90 flex-1 min-h-[220px]">
        {/* Console Nav Tabs */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900/40 border-b border-slate-800/80">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveBottomTab('results')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                activeBottomTab === 'results'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Test Results
              {executionResult && (
                <span
                  className={`w-2 h-2 rounded-full ${
                    executionResult.summary.allPassed ? 'bg-emerald-400' : 'bg-rose-400'
                  }`}
                />
              )}
            </button>

            <button
              onClick={() => setActiveBottomTab('custom')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                activeBottomTab === 'custom'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              Custom Input
            </button>

            <button
              onClick={() => setActiveBottomTab('console')}
              className={`px-3 py-1 text-xs font-medium rounded-lg transition flex items-center gap-1.5 ${
                activeBottomTab === 'console'
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              Logs & Stdout
              {executionResult?.summary.stdout && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>

          {executionResult && (
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 text-slate-400">
                <Clock className="w-3 h-3 text-slate-500" />
                {executionResult.summary.totalRuntimeMs}ms
              </span>
            </div>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-4 flex-1 overflow-y-auto">
          {activeBottomTab === 'results' && (
            <div>
              {!executionResult ? (
                <div className="flex flex-col items-center justify-center py-8 text-slate-500 text-xs">
                  <Play className="w-6 h-6 mb-2 text-slate-600" />
                  <p>Click "Run Code" above to execute your solution against test cases.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {executionResult.summary.status === 'Accepted' ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 text-sm font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          Accepted
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-rose-400 text-sm font-semibold">
                          <XCircle className="w-4 h-4" />
                          {executionResult.summary.status}
                        </div>
                      )}
                      <span className="text-xs text-slate-400">
                        ({executionResult.summary.passed}/{executionResult.summary.total} test cases passed)
                      </span>
                    </div>

                    {executionResult.summary.allPassed && (
                      <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <Sparkles className="w-3 h-3" /> All Passed
                      </span>
                    )}
                  </div>

                  {/* Stderr / Error Banner if any */}
                  {executionResult.summary.stderr && (
                    <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 font-mono text-xs whitespace-pre-wrap">
                      <div className="flex items-center gap-1.5 font-sans font-semibold mb-1 text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Error Trace
                      </div>
                      {executionResult.summary.stderr}
                    </div>
                  )}

                  {/* Test Cases Pill Bar */}
                  {executionResult.results.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {executionResult.results.map((r, idx) => (
                        <button
                          key={r.testCaseId || idx}
                          onClick={() => setSelectedCaseIdx(idx)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${
                            selectedCaseIdx === idx
                              ? 'bg-indigo-600 text-white'
                              : r.passed
                              ? 'bg-slate-900 text-emerald-400 border border-emerald-500/20 hover:bg-slate-800'
                              : 'bg-slate-900 text-rose-400 border border-rose-500/20 hover:bg-slate-800'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              r.passed ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                          />
                          Case {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Detailed Selected Case Breakdown */}
                  {selectedCaseResult && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                          Input
                        </span>
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
                          {selectedCaseResult.input}
                        </div>
                      </div>

                      {selectedCaseResult.expectedOutput && (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            Expected Output
                          </span>
                          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 overflow-x-auto">
                            {selectedCaseResult.expectedOutput}
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-2 flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                            Your Output
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Runtime: {selectedCaseResult.runtimeMs}ms
                          </span>
                        </div>
                        <div
                          className={`p-2.5 rounded-lg border font-mono text-xs overflow-x-auto ${
                            selectedCaseResult.passed
                              ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                              : 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                          }`}
                        >
                          {selectedCaseResult.error
                            ? `Error: ${selectedCaseResult.error}`
                            : selectedCaseResult.actualOutput !== null && selectedCaseResult.actualOutput !== undefined
                            ? typeof selectedCaseResult.actualOutput === 'object'
                              ? JSON.stringify(selectedCaseResult.actualOutput)
                              : String(selectedCaseResult.actualOutput)
                            : 'No output returned (undefined)'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeBottomTab === 'custom' && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-slate-400">
                Specify custom input variables to execute against your solution (e.g.{' '}
                <code className="text-indigo-400">nums = [1, 5, 9], target = 6</code>):
              </p>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="nums = [1, 5, 9], target = 6"
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => runCode(true)}
                disabled={isRunning || !customInput.trim()}
                className="self-start px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition disabled:opacity-50 cursor-pointer"
              >
                Run Custom Input
              </button>
            </div>
          )}

          {activeBottomTab === 'console' && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Standard Output (console.log / print)
              </span>
              {executionResult?.summary.stdout ? (
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap">
                  {executionResult.summary.stdout}
                </pre>
              ) : (
                <p className="text-xs text-slate-500 italic">No stdout logs generated.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Icon helper for sliders
function Sliders(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="4" y1="21" y2="14" />
      <line x1="4" x2="4" y1="10" y2="3" />
      <line x1="12" x2="12" y1="21" y2="12" />
      <line x1="12" x2="12" y1="8" y2="3" />
      <line x1="20" x2="20" y1="21" y2="16" />
      <line x1="20" x2="20" y1="12" y2="3" />
      <line x1="2" x2="6" y1="14" y2="14" />
      <line x1="10" x2="14" y1="8" y2="8" />
      <line x1="18" x2="22" y1="16" y2="16" />
    </svg>
  );
}
