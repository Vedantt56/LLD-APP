export class InvalidTypeScriptSubmissionError extends Error {
  constructor(
    message: string = 'Invalid submission. This platform supports TypeScript only. Please submit your solution in TypeScript.'
  ) {
    super(message);
    this.name = 'InvalidTypeScriptSubmissionError';
  }
}

export function isNonTypeScriptCode(code: string): boolean {
  const trimmed = code.trim();
  if (!trimmed) return false;

  // 1. Python specific patterns
  const pythonPatterns = [
    /^\s*def\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*:/m, // def func_name():
    /^\s*class\s+[a-zA-Z_]\w*(\s*\([^)]*\))?\s*:/m, // class Foo: or class Foo(Bar):
    /^\s*from\s+[a-zA-Z0-9_.]+\s+import\s+/m, // from foo import bar
    /^\s*import\s+(sys|os|math|random|json|re|datetime|typing|numpy|pandas)\b/m, // import sys
    /\bself\.[a-zA-Z_]\w*/, // self.attr
    /\bprint\s*\(/, // print(...)
    /\b__init__\b/, // __init__
    /^\s*elif\s+.*:/m, // elif condition:
    /^\s*pass\s*$/m, // pass statement
  ];

  // 2. Java / C# specific patterns
  const javaPatterns = [
    /^\s*package\s+[a-zA-Z0-9_.]+\s*;/m, // package com.foo;
    /^\s*import\s+java\.[a-zA-Z0-9_.*]+\s*;/m, // import java.util.*;
    /\bpublic\s+static\s+void\s+main\s*\(/m, // public static void main(
    /\bSystem\.(out|err)\.print/m, // System.out.println
    /\bArrayList<[a-zA-Z0-9_<>]+>\s+[a-zA-Z_]/, // ArrayList<String> list
    /\bHashMap<[a-zA-Z0-9_<,\s>]+>\s+[a-zA-Z_]/, // HashMap<K,V> map
    /\bpublic\s+class\s+[a-zA-Z0-9_]+\s*\{/m, // public class Main {
  ];

  // 3. C / C++ patterns
  const cppPatterns = [
    /^\s*#include\s*<[a-zA-Z0-9_.]+>/m, // #include <iostream>
    /\bstd::(cout|cin|endl|vector|string|map|unordered_map)\b/, // std::cout
    /\bcout\s*<</, // cout <<
    /\bprintf\s*\(/, // printf(
    /\bint\s+main\s*\(\s*(void|[a-zA-Z0-9_*\s,]*)\s*\)/m, // int main()
  ];

  // 4. Go patterns
  const goPatterns = [
    /^\s*package\s+main\b/m, // package main
    /^\s*func\s+main\s*\(\s*\)/m, // func main()
    /\bfmt\.(Println|Printf|Print)\b/, // fmt.Println
  ];

  // 5. Rust patterns
  const rustPatterns = [
    /^\s*fn\s+main\s*\(\s*\)/m, // fn main()
    /\bprintln!\s*\(/, // println!(
    /^\s*let\s+mut\s+/m, // let mut foo
  ];

  const allNonTsPatterns = [
    ...pythonPatterns,
    ...javaPatterns,
    ...cppPatterns,
    ...goPatterns,
    ...rustPatterns,
  ];

  for (const pattern of allNonTsPatterns) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }

  return false;
}

export function validateTypeScriptSubmission(code: string): void {
  if (isNonTypeScriptCode(code)) {
    throw new InvalidTypeScriptSubmissionError();
  }
}
