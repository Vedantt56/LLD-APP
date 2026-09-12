'use client';

import React from 'react';
import { EvaluationResult, RULE_WEIGHTS } from '../domain/evaluation';

interface FeedbackViewProps {
  evaluationResult: EvaluationResult | null;
}

export function FeedbackView({ evaluationResult }: FeedbackViewProps) {
  if (!evaluationResult) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm text-center text-gray-500">
        <p className="text-sm">No evaluation result yet. Submit a solution above to view detailed LLD feedback.</p>
      </div>
    );
  }

  const { status, feedback, overallScore } = evaluationResult;
  const { deterministic, llm } = feedback;

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-6">
      {/* Overall Score Header */}
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">3. Evaluation Feedback</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Evaluated at {new Date(evaluationResult.evaluatedAt).toLocaleTimeString()}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {status === 'PARTIAL' && (
            <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded border border-amber-300">
              Partial Evaluation
            </span>
          )}

          <div className="text-right">
            <div className="text-3xl font-extrabold text-blue-700">
              {overallScore} <span className="text-lg font-medium text-gray-400">/ 100</span>
            </div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Overall Score
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Deterministic AST Analysis Card */}
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-md flex items-center space-x-2">
            <span>Deterministic Structural Analysis</span>
            <span className="text-xs font-normal text-gray-500">(ts-morph AST)</span>
          </h3>
          <span className="text-sm font-semibold text-gray-700">
            {deterministic.score} / 100
          </span>
        </div>

        <div className="p-4 space-y-3">
          {deterministic.ruleFeedbacks.map((rule) => {
            const weight = RULE_WEIGHTS[rule.category as keyof typeof RULE_WEIGHTS] || 0.20;
            const maxPoints = Math.round(weight * 100);
            const earnedPoints = Math.round((rule.score * maxPoints) / 100);

            return (
              <div
                key={rule.ruleId}
                className={`p-3 rounded-md border text-sm flex items-start justify-between ${
                  rule.passed
                    ? 'bg-green-50 border-green-200 text-green-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-start space-x-2.5">
                  <span className="text-lg font-bold">
                    {rule.passed ? '✓' : '⚠'}
                  </span>
                  <div>
                    <div className="font-semibold">{rule.ruleId}</div>
                    <div className="text-xs mt-0.5 opacity-90">{rule.message}</div>
                  </div>
                </div>

                <div className="font-mono text-xs font-bold bg-white px-2 py-1 rounded border shadow-xs ml-3 whitespace-nowrap">
                  {earnedPoints} / {maxPoints}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: LLM Design Review Card */}
      <div className="border rounded-lg overflow-hidden bg-gray-50">
        <div className="bg-gray-100 px-4 py-3 border-b flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-md flex items-center space-x-2">
            <span>LLM OO Design Review</span>
            <span className="text-xs font-normal text-gray-500">(gemini-flash-latest)</span>
          </h3>
          {llm && (
            <span className="text-sm font-semibold text-gray-700">
              {llm.overallScore} / 100
            </span>
          )}
        </div>

        <div className="p-4">
          {status === 'PARTIAL' || !llm ? (
            /* LLM Fallback Callout */
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-sm space-y-1">
              <div className="font-bold flex items-center space-x-1.5 text-amber-900">
                <span>⚠ Partial Evaluation</span>
              </div>
              <p>Deterministic analysis completed successfully.</p>
              <p className="text-xs text-amber-700">
                LLM design review was unavailable or timed out. System safely fell back to deterministic-only results.
              </p>
            </div>
          ) : (
            /* LLM Rubric Breakdown */
            <div className="space-y-4">
              {/* Criteria Scores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {llm.rubricScores.map((item) => (
                  <div
                    key={item.criterion}
                    className="p-3 bg-white border rounded-md shadow-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-800">{item.criterion}</span>
                      <span className="font-mono text-xs font-bold bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        {item.score} / 5
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 leading-snug">{item.reasoning}</p>
                  </div>
                ))}
              </div>

              {/* Strengths & Improvements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {llm.strengths && llm.strengths.length > 0 && (
                  <div className="bg-green-50 p-3 rounded-md border border-green-200">
                    <h4 className="text-xs font-bold text-green-900 uppercase tracking-wider mb-2">
                      Key Strengths
                    </h4>
                    <ul className="list-disc list-inside text-xs text-green-800 space-y-1">
                      {llm.strengths.map((st, idx) => (
                        <li key={idx}>{st}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {llm.improvements && llm.improvements.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-2">
                      Suggested Improvements
                    </h4>
                    <ul className="list-disc list-inside text-xs text-blue-800 space-y-1">
                      {llm.improvements.map((imp, idx) => (
                        <li key={idx}>{imp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
