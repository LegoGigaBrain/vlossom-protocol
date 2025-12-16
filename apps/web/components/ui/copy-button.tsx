"use client";

/**
 * Copy Button Component
 *
 * A button that copies text to clipboard with visual feedback.
 */

import * as React from "react";
import { useState, useCallback } from "react";
import { Button, type ButtonProps } from "./button";
import { toast } from "sonner";

interface CopyButtonProps extends Omit<ButtonProps, "onClick"> {
  /**
   * The text to copy to clipboard
   */
  textToCopy: string;
  /**
   * Success message to show in toast
   */
  successMessage?: string;
  /**
   * Duration to show the "Copied" state in ms
   */
  copiedDuration?: number;
  /**
   * Children to render when not copied
   */
  children?: React.ReactNode;
  /**
   * Content to show when copied (defaults to "Copied!")
   */
  copiedContent?: React.ReactNode;
}

export function CopyButton({
  textToCopy,
  successMessage = "Copied to clipboard",
  copiedDuration = 2000,
  children,
  copiedContent,
  ...props
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success(successMessage);

      setTimeout(() => {
        setCopied(false);
      }, copiedDuration);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  }, [textToCopy, successMessage, copiedDuration]);

  const defaultContent = (
    <>
      <CopyIcon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Copy to clipboard</span>
    </>
  );

  const defaultCopiedContent = (
    <>
      <CheckIcon className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Copied</span>
    </>
  );

  return (
    <Button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy to clipboard"}
      {...props}
    >
      {copied
        ? copiedContent || defaultCopiedContent
        : children || defaultContent}
    </Button>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
      />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
