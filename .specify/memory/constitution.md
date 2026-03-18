<!--
SYNC IMPACT REPORT
==================
Version change: [TEMPLATE] → 1.0.0 (initial ratification)

Added sections:
- Core Principles (I–V): Code Quality, Testing Standards, UX Consistency,
  Performance Requirements, Simplicity & YAGNI
- Git & Collaboration Workflow (branch strategy, PR policy, issue tracking)
- Commit & Branch Conventions (Naver Git Flow)
- Governance

Modified principles: N/A (initial population from blank template)
Removed sections: N/A

Templates requiring updates:
  ✅ .specify/memory/constitution.md — written now
  ✅ .specify/templates/plan-template.md — Constitution Check section already
     references "constitution file"; no structural change required
  ✅ .specify/templates/spec-template.md — requirements format compatible
  ✅ .specify/templates/tasks-template.md — task format compatible; branch/PR
     guidance now codified in this constitution

Follow-up TODOs:
  - None; all fields resolved.
-->

# Meeting Minutes Constitution

## Core Principles

### I. Code Quality (NON-NEGOTIABLE)

All code MUST meet the following quality standards before merge:

- Every function/method MUST have a single, clearly defined responsibility
  (Single Responsibility Principle).
- Cyclomatic complexity per function MUST NOT exceed 10.
- Dead code, commented-out blocks, and TODO stubs MUST NOT be merged into
  the main or develop branch without an associated GitHub Issue.
- Code reviews are MANDATORY for every PR; self-merge without review is
  prohibited except for trivial documentation fixes.
- Linting and static analysis checks MUST pass in CI before a PR can be merged.

**Rationale**: Maintainability degrades rapidly without enforced quality gates.
Consistent standards reduce onboarding friction and bug introduction rate.

### II. Testing Standards

- Unit tests MUST cover all business-logic functions and edge cases.
- Integration tests MUST be written for any feature that touches external
  systems (APIs, databases, file I/O).
- Tests MUST be written before or alongside implementation — no feature is
  "done" without passing tests.
- Test coverage MUST NOT decrease across PRs; any reduction requires explicit
  justification in the PR description.
- Tests MUST be deterministic; flaky tests MUST be fixed or quarantined
  immediately and tracked via a GitHub Issue.

**Rationale**: Tests are the primary safety net for refactoring and evolution.
Untested code is unfinished code.

### III. User Experience Consistency

- UI components and interaction patterns MUST follow the established design
  system; ad-hoc styling is prohibited.
- Error messages shown to users MUST be human-readable and actionable —
  raw stack traces or error codes MUST NOT be exposed.
- Navigation flows and information hierarchy MUST remain consistent across
  equivalent screens/views.
- Accessibility (a11y) requirements (keyboard navigation, sufficient color
  contrast, ARIA labels) MUST be met for all user-facing features.

**Rationale**: Inconsistency erodes user trust and increases support burden.
A coherent experience is a product requirement, not a nice-to-have.

### IV. Performance Requirements

- API response time MUST be ≤ 200 ms at p95 under expected load.
- Page/screen initial load time MUST be ≤ 2 s on a standard broadband
  connection.
- Performance regressions exceeding 20 % of a baseline metric MUST be
  caught in CI and block the PR until resolved.
- Database queries MUST use appropriate indexes; N+1 query patterns are
  prohibited.
- Memory leaks MUST be investigated and resolved before release.

**Rationale**: Performance is a feature. Users abandon slow products, and
performance issues compound as data grows.

### V. Simplicity & YAGNI

- Implement only what is required by the current specification; do not build
  for hypothetical future needs.
- Abstractions MUST be justified by at least two concrete use cases at the
  time of introduction.
- Dependencies MUST be evaluated for necessity; adding a library requires
  explicit justification in the PR description.

**Rationale**: Unnecessary complexity is the leading cause of technical debt
and maintenance burden.

## Git & Collaboration Workflow

Every significant unit of work MUST follow this workflow:

1. **Issue First**: Create a GitHub Issue before starting any non-trivial work.
   The issue MUST describe the problem/goal, acceptance criteria, and relevant
   labels (feat, fix, docs, refactor, etc.).
2. **Branch per Major Unit**: Each feature, bug fix, or refactor MUST be
   developed on its own branch (see naming conventions below). Long-lived
   feature branches that diverge significantly from `develop` MUST be
   rebased regularly.
3. **PR per Feature**: Each GitHub Pull Request MUST correspond to a single,
   coherent unit of functionality. Mixing unrelated changes in one PR is
   prohibited.
4. **PR Description**: Every PR MUST reference the related Issue (`Closes #N`),
   include a summary of changes, and list any testing steps.
5. **Review Required**: At least one approval is required before merge; the
   author MUST NOT approve their own PR.

## Commit & Branch Conventions (Naver Git Flow)

### Commit Message Format

```
<type>: <subject>

[optional body]

[optional footer: Closes #N]
```

**Types** (must be lowercase):

| Type       | When to use                                      |
|------------|--------------------------------------------------|
| `feat`     | New feature                                      |
| `fix`      | Bug fix                                          |
| `docs`     | Documentation only                               |
| `style`    | Formatting, whitespace — no logic change         |
| `refactor` | Code restructure without feature/fix             |
| `test`     | Adding or correcting tests                       |
| `chore`    | Build scripts, CI config, tooling                |
| `perf`     | Performance improvement                          |
| `revert`   | Reverting a previous commit                      |

**Rules**:
- Subject MUST be written in the imperative mood, lowercase, ≤ 72 characters.
- Do NOT end the subject with a period.
- Body MUST be wrapped at 72 characters.

### Branch Naming

```
<type>/#<issue-number>-<short-description>
```

Examples:
- `feat/#12-user-authentication`
- `fix/#34-null-pointer-on-login`
- `docs/#7-update-readme`
- `refactor/#45-extract-auth-service`
- `hotfix/#99-payment-crash`

**Permanent Branches**:

| Branch    | Purpose                                      |
|-----------|----------------------------------------------|
| `main`    | Production-ready code; direct push forbidden |
| `develop` | Integration branch; merge target for PRs     |

**Flow**: `feature branch` → PR → `develop` → (release) → `main`

Hotfixes branch from `main` and MUST be merged into both `main` and
`develop`.

## Governance

This constitution supersedes all informal practices and verbal agreements.
Any deviation requires an explicit amendment.

**Amendment Procedure**:
1. Open a GitHub Issue labeled `constitution` describing the proposed change
   and rationale.
2. Discuss and reach consensus (or majority approval on teams > 1).
3. Update `.specify/memory/constitution.md` and increment the version per
   semantic versioning rules (MAJOR/MINOR/PATCH as defined below).
4. Commit with message: `docs: amend constitution to vX.Y.Z (<summary>)`

**Versioning Policy**:
- **MAJOR**: Removal or incompatible redefinition of an existing principle.
- **MINOR**: New principle or section added; material expansion of guidance.
- **PATCH**: Clarification, wording fix, typo correction.

**Compliance**:
- All PRs MUST be reviewed against this constitution.
- Constitution Check in `plan-template.md` MUST be completed before Phase 0.
- Violations not justified in the Complexity Tracking table are grounds for
  PR rejection.

**Version**: 1.0.0 | **Ratified**: 2026-03-18 | **Last Amended**: 2026-03-18
