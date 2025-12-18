"use client";

/**
 * Theme Toggle Component
 *
 * Design P0: Dark mode toggle for user preference
 * Reference: Design Review - Only 9/100+ components have dark: variants
 *
 * Features:
 * - Toggle between light and dark mode
 * - System preference detection
 * - Persists preference to localStorage
 * - Animated icon transition
 */

import { useState } from "react";
import { useThemeMode } from "@/lib/theme/use-theme";
import { Icon } from "@/components/icons";
import { Button } from "./button";

interface ThemeToggleProps {
  /** Show as icon-only button (default) or with label */
  variant?: "icon" | "labeled";
  /** Size of the toggle */
  size?: "sm" | "default" | "lg";
}

/**
 * Simple theme toggle button (light/dark only)
 */
export function ThemeToggle({ variant = "icon", size = "default" }: ThemeToggleProps) {
  const { mode, toggleMode } = useThemeMode();

  const iconSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  if (variant === "labeled") {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={toggleMode}
        className="gap-2"
        aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      >
        {mode === "light" ? (
          <>
            <Icon name="rest" size={iconSize} />
            <span>Dark mode</span>
          </>
        ) : (
          <>
            <Icon name="active" size={iconSize} />
            <span>Light mode</span>
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleMode}
      aria-label={`Switch to ${mode === "light" ? "dark" : "light"} mode`}
      className="relative h-10 w-10"
    >
      <Icon
        name="active"
        size={iconSize}
        className="absolute transition-transform duration-200 rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
      />
      <Icon
        name="rest"
        size={iconSize}
        className="absolute transition-transform duration-200 rotate-90 scale-0 dark:rotate-0 dark:scale-100"
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

/**
 * Theme selector with system preference option (inline buttons)
 */
export function ThemeSelector({ size = "default" }: Pick<ThemeToggleProps, "size">) {
  const { mode, setMode, isSystemPreference, resetToSystemPreference } = useThemeMode();
  const [isOpen, setIsOpen] = useState(false);

  const iconSize = size === "sm" ? "sm" : "md";

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme"
        aria-expanded={isOpen}
        className="relative h-10 w-10"
      >
        <Icon
          name="active"
          size="md"
          className="absolute transition-transform duration-200 rotate-0 scale-100 dark:-rotate-90 dark:scale-0"
        />
        <Icon
          name="rest"
          size="md"
          className="absolute transition-transform duration-200 rotate-90 scale-0 dark:rotate-0 dark:scale-100"
        />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[140px] rounded-md bg-background-primary dark:bg-surface-dark border border-border shadow-card dark:shadow-card-dark p-1">
            <button
              onClick={() => {
                setMode("light");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary dark:hover:bg-surface-elevated-dark ${
                mode === "light" && !isSystemPreference ? "bg-secondary dark:bg-surface-elevated-dark" : ""
              }`}
            >
              <Icon name="active" size={iconSize} />
              Light
            </button>
            <button
              onClick={() => {
                setMode("dark");
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary dark:hover:bg-surface-elevated-dark ${
                mode === "dark" && !isSystemPreference ? "bg-secondary dark:bg-surface-elevated-dark" : ""
              }`}
            >
              <Icon name="rest" size={iconSize} />
              Dark
            </button>
            <button
              onClick={() => {
                resetToSystemPreference();
                setIsOpen(false);
              }}
              className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm hover:bg-secondary dark:hover:bg-surface-elevated-dark ${
                isSystemPreference ? "bg-secondary dark:bg-surface-elevated-dark" : ""
              }`}
            >
              <Icon name="settings" size={iconSize} />
              System
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ThemeToggle;
