# LEGO OS – Pragmatic Code Review Workflow

Use this workflow to run high-quality code reviews using LEGO’s multi-agent system.

## When to use it
- Reviewing a PR before merge
- Reviewing generated code
- Refactoring legacy areas
- Checking spec compliance
- Auditing critical flows

## How to run
Call:
`/pragmatic-code-review`

Provide:
- diff/PR path
- goals
- concerns
- test files if relevant

The system will:
- load context
- run Pass 1 (summary, strengths, concerns)
- run Pass 2 (detailed findings)
- provide dimensions scores
- provide next actions
