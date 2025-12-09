# LEGO OS Review Framework

This framework defines how all reviews are performed across the OS.  
Each review uses:
- Reviewer Voice  
- Review Structure  
- Review Dimensions  
- Relevant standards  
- Appropriate agents  

---

# Review Philosophy

1. **High signal, low noise**  
2. **Explain why, not just what**  
3. **Be actionable**  
4. **Focus on business and user impact**  
5. **Use consistent structure**  

---

# Unified Review Structure

All reviews follow the same format:

1. Summary  
2. Strengths  
3. Primary Concerns  
4. Detailed Findings  
5. Impact Analysis  
6. Recommendations  
7. Next Actions  
8. Reviewer Confidence  
9. Dimensions Score  

---

# The Six Review Modes

## 1. Pragmatic Code Review
Agents:  
- pragmatic-code-reviewer  
- subagent  
- security reviewer (optional)  

Focus:
- correctness  
- maintainability  
- clarity  
- tests  

---

## 2. Design Review
Agents:  
- design-reviewer  
- ux-product-strategist  

Focus:
- hierarchy  
- clarity  
- spacing  
- consistency  
- accessibility  

---

## 3. UX Review
Agents:  
- ux-product-strategist  
- design-reviewer  

Focus:
- friction  
- task completion  
- onboarding  
- cognitive load  

---

## 4. Security Review
Agents:  
- security-reviewer  
- pragmatic-code-reviewer  

Focus:
- permission boundaries  
- attack surfaces  
- invariant risks  
- DoS / griefing vectors  

---

## 5. Smart Contract Review
Agents:  
- solidity-protocol-engineer  
- security-reviewer  
- senior architect  

Focus:
- correctness  
- invariants  
- fund flows  
- oracle trust  
- state transitions  

---

## 6. Architecture Review
Agents:
- senior-architect  
- backend-engineer  
- security-reviewer  

Focus:
- decomposition  
- scalability  
- data boundaries  
- system clarity  

---

# How Reviews Work Together

Architecture review → guides spec  
Spec review → guides implementation  
Code/design reviews → ensure correctness  
Security review → ensures safety  
Docs → ensure clarity and onboarding  

It creates a virtuous cycle of continuous improvement.
