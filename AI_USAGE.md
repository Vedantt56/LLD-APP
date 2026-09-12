# AI Usage Log — LLD Practice Platform

This document logs real AI-assisted architectural decisions made during the development of this LLD Practice Platform. Each entry details what was suggested by the AI agent (Antigravity), what was accepted or rejected by the engineer, and the technical rationale.

---

### Decision 1: Separation of Attempt Lifecycle Status vs. Evaluation Outcome Status

- **What was suggested**: AI suggested adding `'EVALUATED_PARTIAL'` as an enum value directly inside `AttemptStatus` to represent attempts that received deterministic-only feedback when LLM timed out.
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: Adding fallback flags to `AttemptStatus` couples the domain lifecycle state machine with specific evaluation execution details. The engineer directed that `AttemptStatus` remain strictly `'DRAFT' | 'SUBMITTED' | 'EVALUATING' | 'EVALUATED' | 'FAILED'`, while partial evaluation fallback is captured cleanly inside `EvaluationResult.status` (`'COMPLETE' | 'PARTIAL'`).

---

### Decision 2: Domain-Driven State Machine Transition Validation

- **What was suggested**: AI suggested directly mutating `attempt.status = 'SUBMITTED'` inside the `POST /api/submissions` Next.js API route handler.
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: State transitions must be validated and performed inside domain logic (`transitionAttempt()`) rather than direct property assignment in API routes. This ensures invalid state jumps (e.g., `DRAFT` directly to `EVALUATED`) throw an `InvalidStateTransitionError` and allows the state machine to be unit tested in isolation without HTTP route dependencies.

---

### Decision 3: Objective, Requirement-Driven Interface Evaluation

- **What was suggested**: AI suggested hardcoding specific interface string names (`'IParkingStrategy'`, `'IBillingStrategy'`, `'IElevatorDispatcher'`) inside `DeterministicEvaluator` checks.
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: Evaluators should evaluate objective facts against the problem's declared requirements rather than inventing hardcoded interface requirements inside the evaluation engine. The evaluator was modified to dynamically read `problem.requirements.expectedInterfaces` and check the AST accordingly.

---

### Decision 4: Application Service Layer (`AttemptService`) for Decoupled Orchestration

- **What was suggested**: AI suggested placing submission creation, state transitions, evaluator invocation, and repository persistence directly inside the `POST /api/submissions` API route.
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: Placing orchestration inside an API route creates a bloated monolithic handler. The engineer directed the creation of an `AttemptService` application layer to handle the workflow, keeping Next.js API routes as thin HTTP adapters that validate input and format responses.

---

### Decision 5: Disambiguating LLM Fallback from System Failure

- **What was suggested**: AI suggested transitioning attempt status to `'FAILED'` whenever `LLMEvaluator` threw an error or timed out.
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: LLM timeouts/failures are an expected fallback path where deterministic feedback is retained and returned with `EvaluationResult.status = 'PARTIAL'`, so the attempt status correctly transitions to `'EVALUATED'`. Only catastrophic unhandled system failures transition attempt status to `'FAILED'`.

---

### Decision 6: Single Rolling Model Alias (`gemini-flash-latest`) & Pre-Submission Language Validation

- **What was suggested**: AI initially suggested a multi-model cascade loop trying multiple model strings in sequence inside `LLMEvaluator`, and catching language validation errors inside `AttemptService`'s evaluation try/catch (which transitioned attempts to `FAILED`).
- **Accepted / Rejected**: **REJECTED** by human engineer.
- **Rationale**: The engineer directed using a single rolling model alias (`gemini-flash-latest`) configured in one constant inside `LLMEvaluator` to avoid recurring model deprecations without complex cascade loops. Furthermore, pre-submission language validation (`validateTypeScriptSubmission`) was moved to run before any submission creation or attempt state transition, ensuring invalid language submissions return HTTP 400 while leaving attempt status unchanged in `DRAFT`.
