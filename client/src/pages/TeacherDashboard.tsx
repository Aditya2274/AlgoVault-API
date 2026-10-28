import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Question, Difficulty, RosterStudent, ClassSession, ApiResponse } from '../types';
import { useAuth } from '../auth/AuthContext';
import { getDifficultyBadge } from '../lib/difficulty';
import SessionRoom from '../components/SessionRoom';
import {
  Code2,
  Plus,
  Trash2,
  Pencil,
  Users,
  BookOpen,
  LogOut,
  GraduationCap,
  Save,
  X,
  Layers,
  RefreshCw,
  Radio,
} from 'lucide-react';

interface TestCaseDraft {
  input: string;
  expectedOutput: string;
}

const EMPTY_QUESTION = {
  title: '',
  description: '',
  difficulty: 'Easy' as Difficulty,
  tags: '',
  testCases: [{ input: '', expectedOutput: '' }] as TestCaseDraft[],
};

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'questions' | 'roster' | 'sessions'>('questions');

  // Question management state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Roster state
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [rosterMessage, setRosterMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [addingStudent, setAddingStudent] = useState(false);

  // Sessions state
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionQuestionId, setSessionQuestionId] = useState('');
  const [sessionMessage, setSessionMessage] = useState<{ kind: 'error' | 'success'; text: string } | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [openSessionId, setOpenSessionId] = useState<string | null>(null);

  const loadQuestions = async () => {
    setQuestionsLoading(true);
    try {
      const res = await fetch('/api/questions?limit=100');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResponse<Question[]> = await res.json();
      if (json.status === 'success') setQuestions(json.data ?? []);
    } catch {
      /* keep existing list; header health reflects connectivity */
    } finally {
      setQuestionsLoading(false);
    }
  };

  const loadRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await fetch('/api/cohort/roster');
      const json = await res.json();
      if (res.ok && json.status === 'success') setRoster(json.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setRosterLoading(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/sessions');
      const json = await res.json();
      if (res.ok && json.status === 'success') setSessions(json.data ?? []);
    } catch {
      /* ignore */
    } finally {
      setSessionsLoading(false);
    }
  };

  const submitSession = async (e: FormEvent) => {
    e.preventDefault();
    setCreatingSession(true);
    setSessionMessage(null);
    try {
      const payload: { title: string; questionId?: string } = { title: sessionTitle.trim() };
      if (sessionQuestionId) payload.questionId = sessionQuestionId;
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Failed to start session');
      }
      setSessionTitle('');
      setSessionQuestionId('');
      setSessionMessage({ kind: 'success', text: 'Session started.' });
      await loadSessions();
    } catch (err: any) {
      setSessionMessage({ kind: 'error', text: err?.message || 'Failed to start session' });
    } finally {
      setCreatingSession(false);
    }
  };

  const endSession = async (id: string) => {
    try {
      const res = await fetch(`/api/sessions/${id}/end`, { method: 'POST' });
      if (res.ok) await loadSessions();
    } catch {
      /* ignore */
    }
  };

  const handleSessionEnded = () => {
    setOpenSessionId(null);
    loadSessions();
  };

  useEffect(() => {
    loadQuestions();
    loadRoster();
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_QUESTION);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (q: Question) => {
    setEditing(q);
    setForm({
      title: q.title,
      description: q.description,
      difficulty: q.difficulty,
      tags: q.tags.join(', '),
      testCases: q.testCases.length
        ? q.testCases.map((tc) => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
        : [{ input: '', expectedOutput: '' }],
    });
    setFormError(null);
    setFormOpen(true);
  };

  const submitQuestion = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      tags: form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      testCases: form.testCases.filter((tc) => tc.input.trim() || tc.expectedOutput.trim()),
    };

    try {
      const url = editing ? `/api/questions/${editing.id}` : '/api/questions';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || json.errors?.[0]?.message || 'Failed to save question');
      }
      setFormOpen(false);
      setEditing(null);
      await loadQuestions();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save question');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!window.confirm('Delete this question? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/questions/${id}`, { method: 'DELETE' });
      if (res.ok) await loadQuestions();
    } catch {
      /* ignore */
    }
  };

  const submitStudent = async (e: FormEvent) => {
    e.preventDefault();
    setAddingStudent(true);
    setRosterMessage(null);
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: studentName.trim(), email: studentEmail.trim(), password: studentPassword }),
      });
      const regJson = await regRes.json();
      if (!regRes.ok || regJson.status !== 'success') {
        throw new Error(regJson.message || regJson.errors?.[0]?.message || 'Failed to create student');
      }

      const enrollRes = await fetch('/api/cohort/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: regJson.data.id }),
      });
      const enrollJson = await enrollRes.json();
      if (!enrollRes.ok || enrollJson.status !== 'success') {
        throw new Error(enrollJson.message || 'Student created but enrollment failed');
      }

      setStudentName('');
      setStudentEmail('');
      setStudentPassword('');
      setRosterMessage({ kind: 'success', text: `${regJson.data.name} enrolled into the cohort.` });
      await loadRoster();
    } catch (err: any) {
      setRosterMessage({ kind: 'error', text: err?.message || 'Failed to add student' });
    } finally {
      setAddingStudent(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600/20 text-indigo-400 p-2 rounded-lg border border-indigo-500/30">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                AlgoVault
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Teacher
                </span>
              </span>
              <p className="text-xs text-slate-400">Mentorship Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">{user?.name}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setTab('questions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'questions'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Questions
          </button>
          <button
            onClick={() => setTab('roster')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'roster'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            Roster
          </button>
          <button
            onClick={() => setTab('sessions')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${
              tab === 'sessions'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Radio className="w-4 h-4" />
            Sessions
          </button>
        </div>

        {tab === 'questions' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Problem Library</h2>
              <button
                onClick={openCreate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
              >
                <Plus className="w-4 h-4" />
                New question
              </button>
            </div>

            {formOpen && (
              <form
                onSubmit={submitQuestion}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200">
                    {editing ? 'Edit question' : 'Create question'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="text-slate-400 hover:text-slate-200 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400">Title</label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-slate-400">Difficulty</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value as Difficulty })}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    rows={4}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-400">Tags (comma-separated)</label>
                  <input
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    placeholder="arrays, hash map"
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-400">Test cases</label>
                  {form.testCases.map((tc, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        value={tc.input}
                        onChange={(e) => {
                          const next = [...form.testCases];
                          next[i] = { ...next[i], input: e.target.value };
                          setForm({ ...form, testCases: next });
                        }}
                        placeholder="input  (e.g. nums = [2,7,11,15], target = 9)"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <input
                        value={tc.expectedOutput}
                        onChange={(e) => {
                          const next = [...form.testCases];
                          next[i] = { ...next[i], expectedOutput: e.target.value };
                          setForm({ ...form, testCases: next });
                        }}
                        placeholder="expected output"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, testCases: form.testCases.filter((_, j) => j !== i) })}
                        className="px-2 text-slate-500 hover:text-rose-400"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setForm({ ...form, testCases: [...form.testCases, { input: '', expectedOutput: '' }] })
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 self-start"
                  >
                    + Add test case
                  </button>
                </div>

                {formError && (
                  <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                    {formError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 self-start px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving…' : editing ? 'Save changes' : 'Create question'}
                </button>
              </form>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {questionsLoading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : questions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No questions yet.</div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {questions.map((q) => (
                    <div key={q.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${getDifficultyBadge(q.difficulty)}`}>
                          {q.difficulty}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{q.title}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {q.testCases?.length || 0} test cases
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteQuestion(q.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : tab === 'roster' ? (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-400" />
                Student Roster
              </h2>
              <span className="text-xs text-slate-400">{roster.length} enrolled</span>
            </div>

            <form
              onSubmit={submitStudent}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
            >
              <h3 className="text-sm font-semibold text-slate-200">Add student</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="password"
                  value={studentPassword}
                  onChange={(e) => setStudentPassword(e.target.value)}
                  placeholder="Temporary password (min 8 chars)"
                  required
                  minLength={8}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
              {rosterMessage && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    rosterMessage.kind === 'success'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {rosterMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={addingStudent}
                className="flex items-center gap-2 self-start px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition"
              >
                <Plus className="w-4 h-4" />
                {addingStudent ? 'Adding…' : 'Create & enroll'}
              </button>
            </form>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {rosterLoading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : roster.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No students enrolled yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 border-b border-slate-800">
                      <th className="px-4 py-3 font-medium">Name</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Solved</th>
                      <th className="px-4 py-3 font-medium">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {roster.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 text-slate-200 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-slate-400">{s.email}</td>
                        <td className="px-4 py-3 text-slate-300">{s.completedCount}</td>
                        <td className="px-4 py-3 text-slate-300">{s.totalScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-indigo-400" />
                Live Sessions
              </h2>
            </div>

            <form
              onSubmit={submitSession}
              className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-4"
            >
              <h3 className="text-sm font-semibold text-slate-200">Start a class session</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="Session title (e.g. Two Sum walkthrough)"
                  required
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
                <select
                  value={sessionQuestionId}
                  onChange={(e) => setSessionQuestionId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="">No linked question</option>
                  {questions.map((q) => (
                    <option key={q.id} value={q.id}>
                      {q.title}
                    </option>
                  ))}
                </select>
              </div>
              {sessionMessage && (
                <div
                  className={`text-xs px-3 py-2 rounded-lg border ${
                    sessionMessage.kind === 'success'
                      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      : 'text-rose-400 bg-rose-500/10 border-rose-500/30'
                  }`}
                >
                  {sessionMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={creatingSession}
                className="flex items-center gap-2 self-start px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white transition"
              >
                <Plus className="w-4 h-4" />
                {creatingSession ? 'Starting…' : 'Start session'}
              </button>
            </form>

            {openSessionId && (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setOpenSessionId(null)}
                  className="self-start flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  <X className="w-3.5 h-3.5" />
                  Close chat
                </button>
                <SessionRoom sessionId={openSessionId} onEnded={handleSessionEnded} />
              </div>
            )}

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
              {sessionsLoading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              ) : sessions.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No sessions yet — start one above.</div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {sessions.map((s) => (
                    <div key={s.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            s.isActive
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700/50'
                          }`}
                        >
                          {s.isActive ? 'Live' : 'Ended'}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-200">{s.title}</p>
                          <p className="text-[11px] text-slate-500">
                            {s.question ? s.question.title : 'Free-form session'}
                          </p>
                        </div>
                      </div>
                      {s.isActive && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setOpenSessionId(s.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
                          >
                            Open chat
                          </button>
                          <button
                            onClick={() => endSession(s.id)}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 border border-rose-500/30 transition"
                          >
                            End
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
