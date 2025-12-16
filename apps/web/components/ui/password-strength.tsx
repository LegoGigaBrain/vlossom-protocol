"use client";

/**
 * Password Strength Indicator Component
 *
 * Visual feedback for password strength during registration/password change.
 * Provides real-time feedback as user types.
 */

import * as React from "react";
import { useMemo } from "react";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface StrengthResult {
  score: number; // 0-4
  label: string;
  feedback: string[];
  color: string;
}

function calculatePasswordStrength(password: string): StrengthResult {
  const feedback: string[] = [];
  let score = 0;

  if (!password) {
    return { score: 0, label: "", feedback: [], color: "" };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push("At least 8 characters");
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push("Add lowercase letters");
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push("Add uppercase letters");
  }

  // Number check
  if (/\d/.test(password)) {
    score += 0.5;
  } else {
    feedback.push("Add numbers");
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 0.5;
  } else {
    feedback.push("Add special characters");
  }

  // Common patterns penalty
  const commonPatterns = [
    /^123/,
    /password/i,
    /qwerty/i,
    /abc123/i,
    /letmein/i,
    /welcome/i,
  ];
  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score = Math.max(0, score - 1);
    feedback.push("Avoid common patterns");
  }

  // Map score to label and color
  const normalizedScore = Math.min(4, Math.floor(score));

  const strengthMap: Record<number, { label: string; color: string }> = {
    0: { label: "Very weak", color: "bg-status-error" },
    1: { label: "Weak", color: "bg-status-error" },
    2: { label: "Fair", color: "bg-status-warning" },
    3: { label: "Good", color: "bg-status-success" },
    4: { label: "Strong", color: "bg-status-success" },
  };

  return {
    score: normalizedScore,
    label: strengthMap[normalizedScore].label,
    feedback: feedback.slice(0, 2), // Show max 2 suggestions
    color: strengthMap[normalizedScore].color,
  };
}

export function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  if (!password) {
    return null;
  }

  return (
    <div
      className={`space-y-2 ${className || ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Password strength: ${strength.label}`}
    >
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index <= strength.score - 1
                ? strength.color
                : "bg-background-tertiary"
            }`}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Label and feedback */}
      <div className="flex items-center justify-between">
        <span
          className={`text-caption font-medium ${
            strength.score >= 3 ? "text-status-success" :
            strength.score >= 2 ? "text-status-warning" : "text-status-error"
          }`}
        >
          {strength.label}
        </span>
        {strength.feedback.length > 0 && (
          <span className="text-caption text-text-tertiary">
            {strength.feedback[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export { calculatePasswordStrength };
