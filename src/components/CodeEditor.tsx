'use client';

import React from 'react';

interface CodeEditorProps {
  code: string;
  onChangeCode: (code: string) => void;
  onSubmit: () => void;
  isEvaluating: boolean;
}

export function CodeEditor({
  code,
  onChangeCode,
  onSubmit,
  isEvaluating,
}: CodeEditorProps) {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h2 className="text-xl font-bold text-gray-800">2. Write TypeScript Solution</h2>
        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-200">
          TypeScript (.ts)
        </span>
      </div>

      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => onChangeCode(e.target.value)}
          disabled={isEvaluating}
          placeholder="// Write your TypeScript solution classes and interfaces here..."
          className="w-full h-96 p-4 font-mono text-sm bg-slate-900 text-slate-50 selection:bg-blue-600 selection:text-white rounded-md border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none leading-relaxed shadow-inner"
          spellCheck={false}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {code.split('\n').length} lines | {code.length} characters
        </span>

        <button
          onClick={onSubmit}
          disabled={isEvaluating || !code.trim()}
          className={`px-6 py-2.5 rounded-md font-semibold text-sm shadow transition flex items-center space-x-2 ${
            isEvaluating || !code.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isEvaluating ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Submitting & Evaluating...</span>
            </>
          ) : (
            <span>Submit Solution for Evaluation</span>
          )}
        </button>
      </div>
    </div>
  );
}
