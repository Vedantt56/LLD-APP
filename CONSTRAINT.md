# CONSTRAINT.md — Hard Rules for This Project

Read this before every task. If a task would violate one of these, stop and flag it instead of proceeding.

## 1. This is a 2-day MVP, not a production system
- No Kubernetes, no microservices, no multi-region deployment, no sharding, no CDN design, no message queues (Kafka/RabbitMQ), no distributed job workers.
- A single Next.js monolith is the entire architecture. If evaluation needs to be "async," implement it as an in-process status field (`Evaluating` → `Evaluated`) with simple polling — NOT a real job queue or worker service.
- Do not introduce Docker, Kubernetes manifests, or CI/CD pipelines unless explicitly asked.

## 2. This is an LLD exercise, not an HLD exercise
- Time and effort go into: classes, objects, responsibilities, interfaces, relationships, patterns, extensibility, code-level decisions.
- HLD concerns (scaling to more users, slower AI evaluation, load balancing) get **at most one paragraph in the design note** — never actual infrastructure code.
- If asked to "make it scalable," respond with a written trade-off note, not new infrastructure.

## 3. Fixed tech stack — do not substitute without asking
- Framework: Next.js (App Router), single project.
- Submission language: TypeScript only. Do not add support for Python, Java, or other languages.
- Deterministic parser: `ts-morph`. Do not switch to a different AST library mid-project.
- LLM: Google Gemini API (free tier) only. Do not call OpenAI or Anthropic APIs — no paid keys are available.
- Storage: SQLite via Prisma OR in-memory repository behind an interface. No other database.
- Do not add new major dependencies without a clear one-line justification.

## 4. Exactly 2 problems in the MVP
- Parking Lot and Elevator System. Do not add a third problem, a problem-authoring UI, or an admin panel. Depth of feedback beats breadth of problems.

## 5. Evaluation must stay pluggable
- All evaluation logic sits behind a single `EvaluationStrategy` interface with `DeterministicEvaluator`, `LLMEvaluator`, and `CompositeEvaluator` as implementations.
- Never hardcode Gemini-specific logic outside `LLMEvaluator`. Never hardcode `ts-morph`-specific logic outside `DeterministicEvaluator`.
- LLM output must be structured JSON against a fixed rubric — never accept or store freeform prose as the final feedback.
- If the LLM call fails or times out, the system must fall back to deterministic-only feedback with a "partial" status. This fallback path is required, not optional — do not skip it to save time.

## 6. No scope creep on features
Do NOT build, even if it seems easy or "nice to have":
- User authentication / accounts / login system
- Multiple learners, roles, or permissions
- A problem-authoring or admin CMS
- Diagram/UML drawing canvas for submissions (text-based TypeScript only)
- Real-time collaboration or multiplayer features
- Leaderboards, gamification, badges
- Email notifications
- Payment/billing of any kind

If a request would add one of these, point out it's out of scope before building it.

## 7. Functionality over polish
- Prioritize: working end-to-end flow > correct evaluator logic > test coverage > UI. In that order.
- Basic, clean UI is enough. Do not spend time on animations, themes, custom design systems, or responsive breakpoints beyond "usable on a laptop screen."
- Do not use frontend-design skill or heavy design system unless explicitly asked — plain, functional Tailwind/CSS is sufficient.

## 8. Testing scope
- Cover: state machine transitions, each evaluator individually, and these edge cases specifically — empty submission, code that fails to parse/compile, LLM timeout/error.
- Do not aim for full coverage of trivial code (getters, simple UI components).

## 9. Documentation is mandatory, not optional
- `AI_USAGE.md` must be updated as real AI-assisted decisions happen — 3 to 5 entries, each with what was suggested, what was accepted/rejected, and why. Do not fabricate this at the end from memory.
- `README.md` must explain how to run the project, key decisions, and known limitations.
- Every deliberate trade-off (why TypeScript, why 2 problems, why monolith, why sync-with-fallback instead of a queue) must be written down explicitly, not left implicit in code.

## 10. When in doubt
Choose the option that:
1. Keeps the `EvaluationStrategy` interface clean and swappable,
2. Keeps the domain model (`Problem`, `Attempt`, `Submission`, `EvaluationResult`) explicit and well-named,
3. Takes less implementation time,
in that priority order. Do not gold-plate any single part at the expense of finishing the end-to-end flow.
