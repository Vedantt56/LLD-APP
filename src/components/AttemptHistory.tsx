'use client';

import React from 'react';
import { Attempt } from '../domain/attempt';

interface AttemptHistoryProps {
  attempts: Attempt[];
  activeAttemptId: string | null;
  onSelectAttempt: (attempt: Attempt) => void;
  onStartNewAttempt: () => void;
}

export function AttemptHistory({
  attempts,
  activeAttemptId,
  onSelectAttempt,
  onStartNewAttempt,
}: AttemptHistoryProps) {
  const getStatusBadge = (status: Attempt['status']) => {
    switch (status) {
      case 'EVALUATED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'EVALUATING':
        return 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse';
      case 'SUBMITTED':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-md font-bold text-gray-800">Attempt History</h3>
        <button
          onClick={onStartNewAttempt}
          className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200 transition"
        >
          + New Attempt
        </button>
      </div>

      {attempts.length === 0 ? (
        <p className="text-xs text-gray-500 italic py-2">No prior attempts for this problem.</p>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {attempts.map((attempt, index) => {
            const isActive = attempt.id === activeAttemptId;
            const attemptNum = attempts.length - index;

            return (
              <button
                key={attempt.id}
                onClick={() => onSelectAttempt(attempt)}
                className={`w-full text-left p-3 rounded-md border text-xs transition flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                }`}
              >
                <div>
                  <div className="font-bold text-gray-800">Attempt #{attemptNum}</div>
                  <div className="text-gray-500 mt-0.5">
                    {new Date(attempt.createdAt).toLocaleString()}
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded font-mono text-2xs font-semibold border ${getStatusBadge(
                    attempt.status
                  )}`}
                >
                  {attempt.status}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
