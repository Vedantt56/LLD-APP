'use client';

import React from 'react';
import { Problem } from '../domain/problem';

interface ProblemPickerProps {
  problems: Problem[];
  selectedProblem: Problem | null;
  onSelectProblem: (problem: Problem) => void;
  onResetStarterCode: () => void;
}

export function ProblemPicker({
  problems,
  selectedProblem,
  onSelectProblem,
  onResetStarterCode,
}: ProblemPickerProps) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">1. Select Problem</h2>
        <button
          onClick={onResetStarterCode}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded transition"
          title="Clear code editor"
        >
          Clear Code
        </button>
      </div>

      {/* Problem Selection Tabs */}
      <div className="flex space-x-2">
        {problems.map((problem) => {
          const isSelected = selectedProblem?.id === problem.id;
          return (
            <button
              key={problem.id}
              onClick={() => onSelectProblem(problem)}
              className={`flex-1 py-2 px-4 rounded-md font-medium text-sm border transition text-left ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
              }`}
            >
              <div className="font-semibold">{problem.title}</div>
              <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                Slug: {problem.slug}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Problem Description & Requirements */}
      {selectedProblem && (
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-3">
          <div>
            <h3 className="text-md font-semibold text-gray-900">{selectedProblem.title}</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line mt-1">
              {selectedProblem.description}
            </p>
          </div>

          {selectedProblem.requirements.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Design Requirements:
              </h4>
              <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                {selectedProblem.requirements.map((req) => (
                  <li key={req.id}>
                    <span className="font-medium">{req.description}</span>
                    {req.expectedInterfaces && req.expectedInterfaces.length > 0 && (
                      <span className="text-xs text-blue-600 ml-2 font-mono">
                        [Interfaces: {req.expectedInterfaces.join(', ')}]
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
