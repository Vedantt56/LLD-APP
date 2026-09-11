'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Problem } from '@/domain/problem';
import { Attempt } from '@/domain/attempt';
import { EvaluationResult } from '@/domain/evaluation';
import { ProblemPicker } from '@/components/ProblemPicker';
import { CodeEditor } from '@/components/CodeEditor';
import { FeedbackView } from '@/components/FeedbackView';
import { AttemptHistory } from '@/components/AttemptHistory';

export default function LLDPlatformPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState<string>('');
  const [activeAttempt, setActiveAttempt] = useState<Attempt | null>(null);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [attemptsHistory, setAttemptsHistory] = useState<Attempt[]>([]);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Fetch available problems
  useEffect(() => {
    async function loadProblems() {
      try {
        const res = await fetch('/api/problems');
        if (!res.ok) throw new Error('Failed to load problems');
        const data: Problem[] = await res.json();
        setProblems(data);
        if (data.length > 0) {
          handleSelectProblem(data[0]);
        }
      } catch (err) {
        setErrorMsg((err as Error).message);
      }
    }
    loadProblems();
  }, []);

  // Fetch attempt history for problem
  const fetchAttemptHistory = useCallback(async (problemId: string) => {
    try {
      const res = await fetch(`/api/problems/${problemId}/attempts`);
      if (res.ok) {
        const history: Attempt[] = await res.json();
        setAttemptsHistory(history);
      }
    } catch (err) {
      console.error('Failed to load attempt history', err);
    }
  }, []);

  // Handle Problem Selection
  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setCode('');
    setActiveAttempt(null);
    setEvaluationResult(null);
    setErrorMsg(null);
    fetchAttemptHistory(problem.id);
  };

  // Clear code editor
  const handleResetStarterCode = () => {
    if (selectedProblem) {
      setCode('');
      setActiveAttempt(null);
      setEvaluationResult(null);
      setErrorMsg(null);
    }
  };

  // Start new attempt explicitly
  const handleStartNewAttempt = () => {
    setActiveAttempt(null);
    setEvaluationResult(null);
    setErrorMsg(null);
    if (selectedProblem) {
      setCode('');
    }
  };

  // Select historical attempt
  const handleSelectAttempt = async (attempt: Attempt) => {
    try {
      setErrorMsg(null);
      setActiveAttempt(attempt);
      const res = await fetch(`/api/attempts/${attempt.id}`);
      if (!res.ok) throw new Error('Failed to load attempt details');
      const data = await res.json();

      if (data.submission) {
        setCode(data.submission.code);
      }
      if (data.evaluationResult) {
        setEvaluationResult(data.evaluationResult);
      } else {
        setEvaluationResult(null);
      }
    } catch (err) {
      setErrorMsg((err as Error).message);
    }
  };

  // Submit Solution handler
  const handleSubmitSolution = async () => {
    if (!selectedProblem || !code.trim()) return;

    setIsEvaluating(true);
    setErrorMsg(null);

    try {
      let attemptId = activeAttempt?.id;

      // Create new attempt if needed or if previous attempt is already evaluated
      if (!attemptId || activeAttempt?.status === 'EVALUATED' || activeAttempt?.status === 'FAILED') {
        const createRes = await fetch('/api/attempts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ problemId: selectedProblem.id }),
        });
        if (!createRes.ok) throw new Error('Failed to initialize attempt');
        const newAttempt: Attempt = await createRes.json();
        attemptId = newAttempt.id;
        setActiveAttempt(newAttempt);
      }

      // Submit solution and trigger evaluation via AttemptService API
      const subRes = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, code }),
      });

      if (!subRes.ok) {
        const errorData = await subRes.json();
        throw new Error(errorData.details || errorData.error || 'Submission failed');
      }

      const resultData = await subRes.json();
      setActiveAttempt(resultData.attempt);
      setEvaluationResult(resultData.evaluationResult);

      // Refresh attempt history list
      fetchAttemptHistory(selectedProblem.id);
    } catch (err) {
      setErrorMsg((err as Error).message);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-12">
      {/* Navigation Header */}
      <header className="bg-gray-900 text-white border-b border-gray-800 py-4 px-6 mb-6 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center space-x-2">
              <span className="text-blue-500">LLD</span>
              <span>Practice Platform</span>
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Object-Oriented Design Grader & Evaluator (TypeScript)
            </p>
          </div>
          <div className="text-xs font-mono bg-gray-800 text-gray-300 px-3 py-1.5 rounded border border-gray-700">
            MVP Engine v1.0
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm flex items-center justify-between">
            <div>
              <span className="font-bold">Error: </span> {errorMsg}
            </div>
            <button
              onClick={() => setErrorMsg(null)}
              className="text-xs font-bold text-red-600 hover:text-red-800"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column (2 spans): Problem Picker + Code Editor */}
          <div className="lg:col-span-2 space-y-6">
            <ProblemPicker
              problems={problems}
              selectedProblem={selectedProblem}
              onSelectProblem={handleSelectProblem}
              onResetStarterCode={handleResetStarterCode}
            />

            <CodeEditor
              code={code}
              onChangeCode={setCode}
              onSubmit={handleSubmitSolution}
              isEvaluating={isEvaluating}
            />

            <FeedbackView evaluationResult={evaluationResult} />
          </div>

          {/* Sidebar (1 span): Attempt History */}
          <div className="space-y-6">
            <AttemptHistory
              attempts={attemptsHistory}
              activeAttemptId={activeAttempt?.id || null}
              onSelectAttempt={handleSelectAttempt}
              onStartNewAttempt={handleStartNewAttempt}
            />

            {/* Platform Scope Boundaries Card */}
            <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-2 text-xs text-gray-600">
              <h4 className="font-bold text-gray-800 text-sm border-b pb-2">Evaluation Architecture</h4>
              <p>
                This platform uses a pluggable <code className="font-mono text-blue-600">EvaluationStrategy</code>:
              </p>
              <ul className="list-disc list-inside space-y-1 pt-1">
                <li>
                  <strong className="text-gray-800">ts-morph AST</strong>: Structural class, encapsulation, naming, and interface rules.
                </li>
                <li>
                  <strong className="text-gray-800">Gemini 2.0 Flash</strong>: Structured JSON-mode rubric evaluation (SRP, coupling, extensibility).
                </li>
                <li>
                  <strong className="text-gray-800">Composite Fallback</strong>: Automatic fallback to deterministic-only results if LLM times out.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
