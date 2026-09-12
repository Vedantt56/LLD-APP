# LLD Practice Platform

A domain-driven **Low-Level Design (LLD) Practice Platform** built with **Next.js (App Router)** and **TypeScript**. 

Learners pick an Object-Oriented Low-Level Design problem (*Parking Lot System* or *Elevator Control System*), write a TypeScript solution in a blank code editor, and receive structured, explainable feedback evaluating AST structural rules (`ts-morph`) and Object-Oriented design principles (Google Gemini `gemini-flash-latest`). Learners track their improvement over time through historical attempt records per problem.

---

## Key Features & Architecture

1. **Deterministic AST Analysis (`ts-morph`)**: Evaluates concrete structural metrics including Class Count, God-Class antipatterns, Property Encapsulation (`private`/`protected`), Requirement Interface compliance, and Naming conventions. Exposes exact continuous scores per rule weighted transparently via `RULE_WEIGHTS`.
2. **LLM OO Design Review (`gemini-flash-latest`)**: Evaluates Object-Oriented design principles across 5 criteria: Single Responsibility Principle (SRP), Coupling, Extensibility, Relationships, and Naming via strict JSON schema mode.
3. **Pre-Submission Language Validation**: Validates submitted code before any Submission creation or state transition. Non-TypeScript or empty submissions are rejected immediately with HTTP 400 without modifying attempt status (it stays `DRAFT`).
4. **Mandatory Fallback Resilience**: If Gemini times out or fails (or if `GEMINI_API_KEY` is omitted), `CompositeEvaluator` gracefully falls back to deterministic-only feedback with a `PARTIAL` status rather than failing the learner's submission.
5. **Separated Feedback View**: Displays AST structural feedback and LLM design rubric feedback in two clearly separated sections.
6. **Domain-Driven Attempt State Machine**: Manages attempt lifecycle state transitions (`DRAFT` → `SUBMITTED` → `EVALUATING` → `EVALUATED` | `FAILED`) backed by a decoupled `Repository` interface.

---

## Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation & Running Locally

All commands execute from the repository root:

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set your Gemini API key
# If omitted, the platform automatically runs in Deterministic-Only Fallback Mode.
# On Windows (PowerShell):
$env:GEMINI_API_KEY="your-gemini-api-key-here"

# 3. Start the Next.js development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## Running Automated Tests

The Vitest test suite covers state machine transitions, pre-submission language validation, AST evaluator rule scoring, mocked LLM schema parsing, fallback behavior, and repository operations:

```bash
# Run unit and integration tests via Vitest
npm test
```

---

## Production Build Verification

To verify that the Next.js App Router application builds cleanly:

```bash
npm run build
```

---

## API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/problems` | List all seeded problems (*Parking Lot System* & *Elevator Control System*) |
| `GET` | `/api/problems/[id]` | Get problem details by ID (`problem-parking-lot`) or slug (`parking-lot`) |
| `POST` | `/api/attempts` | Create a new attempt for a problem (starts in `DRAFT` status) |
| `GET` | `/api/attempts/[id]` | Fetch attempt status, linked submission, and evaluation result |
| `POST` | `/api/submissions` | Submit TypeScript solution code for an attempt and trigger evaluation |
| `GET` | `/api/evaluations/[id]` | Fetch evaluation result by ID or by attempt ID |
| `GET` | `/api/problems/[id]/attempts` | Retrieve historical attempts list for a given problem |

---

## Known Limitations & Scope Boundaries

- **In-Memory Persistence**: Storage currently defaults to `InMemoryRepository` to avoid external database setup overhead. The storage layer sits behind a clean `Repository` interface, making it easily swappable for SQLite via Prisma.
- **Seeded Problems**: Seeded with 2 core problems (*Parking Lot* & *Elevator System*) to prioritize feedback depth over problem breadth.
- **Single-Learner Workspace**: Designed as a focused practice environment without multi-user auth overhead.
