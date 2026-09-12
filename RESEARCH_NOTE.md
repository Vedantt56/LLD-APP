# Phase 0 Research Note: Low-Level Design Practice & Feedback Tools

## 1. Problem Domain Overview

Object-Oriented Low-Level Design (LLD) is a core component of software engineering interviews and real-world system architecture. Candidates and learners are expected to decompose ambiguous requirements into well-structured class diagrams, domain entities, interfaces, and design patterns adhering to SOLID principles (Single Responsibility, Open/Closed, Dependency Inversion, etc.).

Despite its importance, self-study and practice for Low-Level Design suffer from significant educational gaps compared to Data Structures & Algorithms (DSA):

1. **Lack of Automated Feedback for Architectural Code**: Standard online judges (LeetCode, HackerRank) evaluate algorithm correctness using binary input/output unit tests. They do not evaluate class granularity, encapsulation, interface segregation, or coupling.
2. **Reading Static Solutions vs. Writing Active Code**: Existing LLD preparation platforms (e.g. course sites, blog posts, video tutorials) present fixed reference solutions. Learners read completed code passively rather than writing TypeScript solutions from scratch and getting objective feedback on their design choices.
3. **Subjective & Unrepeatable Evaluation**: Mock interviews provide qualitative design feedback, but they depend on human interviewer availability and consistency. Learners lack a repeatable, instant tool to grade their Object-Oriented structure.

---

## 2. Market Landscape & Qualitative Gap Analysis

A qualitative assessment of current software engineering practice tools reveals distinct categories and structural trade-offs:

| Tool Category | Feedback Scope | Strengths | Gaps for LLD Practice |
| :--- | :--- | :--- | :--- |
| **Traditional Online Judges** (LeetCode, Codeforces) | Unit test pass/fail & execution runtime | Automated, instant, objective pass/fail grading | Evaluates runtime execution behavior only; completely ignores class design, encapsulation, and SOLID principles. |
| **LLD Course Sites & Video Tutorials** | Static reference solutions & architectural diagrams | Clear conceptual walkthroughs of design patterns | Passive learning; no interactive code editor or automated feedback on custom student solutions. |
| **General AI Chatbots** (ChatGPT, Claude, Gemini web interface) | Open-ended text critique | Flexible design feedback across languages | Unstructured, non-deterministic output format; inconsistent scoring standards across attempts; no structural AST metrics. |

### The Identified Need

Learners need a dedicated practice environment combining:
- **Instant structural verification** (checking class count, encapsulation, naming conventions, and interface compliance objectively via AST parsing).
- **Qualitative Object-Oriented review** (evaluating Single Responsibility, coupling, extensibility, and domain modeling via structured LLM prompt analysis).
- **Guaranteed availability** (ensuring the learner always gets meaningful structural feedback even if external LLM APIs time out or fail).

---

## 3. Product Approach & Architectural Differentiators

This project addresses the LLD practice gap through a **dual-engine evaluation architecture**:

```
+-----------------------------------------------------------------------+
|                       Submitted TypeScript Code                       |
+-----------------------------------------------------------------------+
                                    |
                                    v
+-----------------------------------------------------------------------+
|                        Pre-Submission Validator                       |
|           (Rejects empty code & non-TS syntax immediately)            |
+-----------------------------------------------------------------------+
                                    | Valid TS
                                    v
+-----------------------------------------------------------------------+
|                          CompositeEvaluator                           |
|  +---------------------------------+ +-----------------------------+  |
|  |     DeterministicEvaluator      | |        LLMEvaluator         |  |
|  |       (ts-morph AST Engine)     | |  (Gemini API JSON Schema)   |  |
|  | Weight: 40% (Structural Rules)  | | Weight: 60% (OO Rubric)   |  |
|  +---------------------------------+ +-----------------------------+  |
+-----------------------------------------------------------------------+
                                    |
            +-----------------------+-----------------------+
            | LLM Success                                   | LLM Timeout / Failure
            v                                               v
+-----------------------+                       +-----------------------+
|  COMPLETE Evaluation  |                       |   PARTIAL Evaluation  |
| (AST + LLM 5-Rubric)  |                       | (AST Structural Only) |
+-----------------------+                       +-----------------------+
```

### Key Architectural Principles

1. **Blank Editor Practice**: The editor opens blank (`code = ""`), requiring learners to actively construct domain entities and interfaces rather than viewing preloaded reference answers.
2. **Objective AST Rule Engine**: `DeterministicEvaluator` uses `ts-morph` to inspect TypeScript AST structures deterministically, providing exact point scores for Encapsulation, Class Count, God-Class antipatterns, Interface Usage, and Naming.
3. **Structured JSON-Mode LLM Rubric**: `LLMEvaluator` prompts Google Gemini (`gemini-flash-latest`) with strict JSON schema output enforcing 5 specific criteria: Single Responsibility Principle (SRP), Coupling, Extensibility, Relationships, and Naming.
4. **Resilient Fallback Guarantee**: If the Gemini API times out or fails, `CompositeEvaluator` retains the deterministic AST score and returns a `PARTIAL` evaluation result without failing the attempt or interrupting the user workflow.
