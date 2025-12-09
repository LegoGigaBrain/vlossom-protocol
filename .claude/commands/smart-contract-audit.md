# smart-contract-review

You are running the **Smart Contract Review** workflow in LEGO Agent OS.

Goal:
Perform a focused security and correctness review of one or more smart contracts, using structured findings and clear recommendations.

Primary Agents:
- @security-auditor
- @solidity-protocol-engineer

Supporting Agents:
- @defi-risk-engineer (for economic risks, if applicable)
- @senior-architect (for protocol-level concerns)

Skills:
- Solidity Style & Security
- Smart Contract Auditor
- Test Author
- Documentation Style (for writing clear findings)

---

## STEP 1 – Clarify Scope

Ask the user:

- Which contracts or folder to review?
- What changed recently (if reviewing a diff)?
- Any known areas of concern (e.g. liquidity, fees, specific flows)?

Summarize scope and assumptions.

---

## STEP 2 – Gather Context

Read:

- Relevant specs under `docs/specs/<feature>/`
- Any mechanism / DeFi docs (if present)
- `docs/project/mission.md`, `tech-stack.md` (for high-level context)
- The contract files and tests themselves.

---

## STEP 3 – Threat Model

Briefly identify:

- Actors (users, admins, external protocols)
- Assets (funds, positions, configuration)
- Trust boundaries (oracles, external calls, upgradeability)
- Critical invariants (what must never be broken)

---

## STEP 4 – Audit with Skills

Using **Solidity Style & Security** and **Smart Contract Auditor**:

- Scan for:
  - access control issues
  - reentrancy and interaction ordering issues
  - arithmetic / overflow risks
  - griefing / DoS vectors
  - oracle / external dependency risk
  - invariant / logic errors
  - upgradeability / proxy pitfalls (if used)
  - economic abuse vectors (with defi-risk-engineer if needed)

---

## STEP 5 – Findings (Structured)

For each finding, output:

- Title
- Severity (Critical / High / Medium / Low)
- Likelihood (High / Medium / Low)
- Description
- Impact
- Exploit Scenario (if applicable)
- Recommended Fix
- Tests to Add (using Test Author skill)

Group findings by severity.

---

## STEP 6 – Summary & Recommendations

Provide:

- Overall risk assessment (e.g. “No critical issues, some Medium/Low”)
- Key themes (e.g. “access control unclear”, “events missing”, “tests incomplete”)
- Recommended next actions:
  - must-fix before deployment
  - nice-to-fix
  - additional tests to write

Indicate reviewer confidence (Low / Medium / High).
