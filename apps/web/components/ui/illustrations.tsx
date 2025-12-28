/**
 * Custom SVG Illustrations for Empty States
 * V2.0.0 Sprint 4 - UX Polish
 */

import * as React from "react";

interface IllustrationProps {
  className?: string;
}

/**
 * Calendar illustration for "no upcoming bookings" state
 */
export function CalendarIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Calendar body */}
      <rect
        x="20"
        y="30"
        width="80"
        height="70"
        rx="8"
        className="fill-secondary stroke-primary"
        strokeWidth="2"
      />
      {/* Calendar top bar */}
      <rect
        x="20"
        y="30"
        width="80"
        height="20"
        rx="8"
        className="fill-primary"
      />
      <rect
        x="20"
        y="42"
        width="80"
        height="8"
        className="fill-primary"
      />
      {/* Calendar hangers */}
      <rect x="35" y="22" width="6" height="16" rx="3" className="fill-primary" />
      <rect x="79" y="22" width="6" height="16" rx="3" className="fill-primary" />
      {/* Calendar grid lines */}
      <line x1="20" y1="65" x2="100" y2="65" className="stroke-border-subtle" strokeWidth="1" />
      <line x1="20" y1="80" x2="100" y2="80" className="stroke-border-subtle" strokeWidth="1" />
      <line x1="47" y1="50" x2="47" y2="100" className="stroke-border-subtle" strokeWidth="1" />
      <line x1="73" y1="50" x2="73" y2="100" className="stroke-border-subtle" strokeWidth="1" />
      {/* Sparkle accent */}
      <circle cx="95" cy="25" r="3" className="fill-accent" />
      <path
        d="M95 18V22M95 28V32M88 25H92M98 25H102"
        className="stroke-accent"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Checkmark/completed illustration
 */
export function CompletedIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Background circle */}
      <circle cx="60" cy="60" r="45" className="fill-secondary" />
      {/* Inner circle */}
      <circle cx="60" cy="60" r="35" className="fill-status-success/20" />
      {/* Checkmark */}
      <path
        d="M42 62L54 74L78 50"
        className="stroke-status-success"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Sparkles */}
      <circle cx="95" cy="30" r="4" className="fill-tertiary" />
      <circle cx="25" cy="40" r="3" className="fill-accent/60" />
      <circle cx="100" cy="75" r="2" className="fill-primary-soft" />
    </svg>
  );
}

/**
 * Search/discovery illustration for "no stylists found"
 */
export function SearchIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Magnifying glass circle */}
      <circle
        cx="52"
        cy="52"
        r="30"
        className="fill-secondary stroke-primary"
        strokeWidth="3"
      />
      {/* Magnifying glass handle */}
      <line
        x1="74"
        y1="74"
        x2="95"
        y2="95"
        className="stroke-primary"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Inner detail - stylized person */}
      <circle cx="52" cy="45" r="8" className="fill-primary-soft" />
      <path
        d="M40 62C40 55.4 45.4 50 52 50C58.6 50 64 55.4 64 62"
        className="stroke-primary-soft"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sparkle accent */}
      <circle cx="28" cy="28" r="3" className="fill-accent" />
      <path
        d="M28 22V25M28 31V34M22 28H25M31 28H34"
        className="stroke-accent"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Wallet illustration for empty wallet state
 */
export function WalletIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Wallet body */}
      <rect
        x="15"
        y="35"
        width="75"
        height="50"
        rx="8"
        className="fill-secondary stroke-primary"
        strokeWidth="2"
      />
      {/* Wallet flap */}
      <path
        d="M15 55H90V43C90 39.6863 87.3137 37 84 37H21C17.6863 37 15 39.6863 15 43V55Z"
        className="fill-primary"
      />
      {/* Card slot */}
      <rect
        x="70"
        y="52"
        width="25"
        height="18"
        rx="4"
        className="fill-background-primary stroke-border-subtle"
        strokeWidth="1"
      />
      {/* Clasp circle */}
      <circle cx="82" cy="61" r="5" className="fill-accent" />
      {/* Coins floating */}
      <circle cx="100" cy="45" r="8" className="fill-tertiary/40 stroke-tertiary" strokeWidth="2" />
      <text x="97" y="49" className="fill-tertiary text-[10px] font-bold">$</text>
      <circle cx="105" cy="70" r="6" className="fill-tertiary/30 stroke-tertiary" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Scissors illustration for stylists/services
 */
export function ScissorsIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Background shape */}
      <ellipse cx="60" cy="60" rx="45" ry="40" className="fill-secondary" />
      {/* Scissor blade 1 */}
      <path
        d="M30 45C30 45 45 55 60 60C75 65 95 60 95 60"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Scissor blade 2 */}
      <path
        d="M30 75C30 75 45 65 60 60C75 55 95 60 95 60"
        className="stroke-primary"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Handle rings */}
      <circle cx="30" cy="45" r="10" className="fill-background-primary stroke-primary" strokeWidth="3" />
      <circle cx="30" cy="75" r="10" className="fill-background-primary stroke-primary" strokeWidth="3" />
      {/* Pivot point */}
      <circle cx="60" cy="60" r="5" className="fill-accent" />
      {/* Sparkle */}
      <circle cx="85" cy="35" r="4" className="fill-tertiary" />
      <path
        d="M85 28V32M85 38V42M78 35H82M88 35H92"
        className="stroke-tertiary"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Star rating illustration for reviews
 */
export function ReviewsIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Background */}
      <rect x="20" y="30" width="80" height="60" rx="8" className="fill-secondary" />
      {/* Stars */}
      <path
        d="M40 55L42.5 50L45 55L50 55.5L46.5 59L47.5 64L43 61.5L38.5 64L39.5 59L36 55.5L40 55Z"
        className="fill-status-warning"
      />
      <path
        d="M60 50L63 44L66 50L72 50.5L68 55L69 61L64 58L59 61L60 55L56 50.5L60 50Z"
        className="fill-status-warning"
      />
      <path
        d="M80 55L82.5 50L85 55L90 55.5L86.5 59L87.5 64L83 61.5L78.5 64L79.5 59L76 55.5L80 55Z"
        className="fill-primary-soft"
      />
      {/* Lines representing text */}
      <rect x="30" y="72" width="40" height="4" rx="2" className="fill-border-subtle" />
      <rect x="30" y="80" width="60" height="3" rx="1.5" className="fill-border-subtle" />
    </svg>
  );
}

/**
 * House/property illustration for property owner
 */
export function PropertyIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Roof */}
      <path
        d="M60 20L20 55H100L60 20Z"
        className="fill-primary"
      />
      {/* House body */}
      <rect x="25" y="55" width="70" height="45" className="fill-secondary" />
      {/* Door */}
      <rect x="50" y="70" width="20" height="30" rx="2" className="fill-primary" />
      <circle cx="65" cy="85" r="2" className="fill-accent" />
      {/* Windows */}
      <rect x="30" y="62" width="15" height="12" rx="2" className="fill-background-primary stroke-primary" strokeWidth="2" />
      <rect x="75" y="62" width="15" height="12" rx="2" className="fill-background-primary stroke-primary" strokeWidth="2" />
      {/* Chimney */}
      <rect x="75" y="30" width="12" height="20" className="fill-primary" />
      {/* Smoke */}
      <circle cx="81" cy="22" r="3" className="fill-border-subtle" />
      <circle cx="85" cy="17" r="2" className="fill-border-subtle" />
    </svg>
  );
}

/**
 * Message illustration for reviews/comments
 */
export function MessageIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Speech bubble */}
      <path
        d="M20 35C20 30.5817 23.5817 27 28 27H82C86.4183 27 90 30.5817 90 35V65C90 69.4183 86.4183 73 82 73H50L35 88V73H28C23.5817 73 20 69.4183 20 65V35Z"
        className="fill-secondary stroke-primary"
        strokeWidth="2"
      />
      {/* Text lines */}
      <rect x="30" y="40" width="50" height="4" rx="2" className="fill-primary-soft" />
      <rect x="30" y="50" width="40" height="4" rx="2" className="fill-border-subtle" />
      <rect x="30" y="60" width="30" height="4" rx="2" className="fill-border-subtle" />
      {/* Sparkle */}
      <circle cx="100" cy="35" r="4" className="fill-accent" />
      <path
        d="M100 28V32M100 38V42M93 35H97M103 35H107"
        className="stroke-accent"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Notification/inbox illustration
 */
export function InboxIllustration({ className = "" }: IllustrationProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={true}
    >
      {/* Main inbox shape */}
      <path
        d="M20 50L35 30H85L100 50V85C100 89.4183 96.4183 93 92 93H28C23.5817 93 20 89.4183 20 85V50Z"
        className="fill-secondary stroke-primary"
        strokeWidth="2"
      />
      {/* Top opening detail */}
      <path
        d="M20 50H40L50 60H70L80 50H100"
        className="stroke-primary"
        strokeWidth="2"
        fill="none"
      />
      {/* Envelope inside */}
      <rect x="35" y="60" width="50" height="25" rx="4" className="fill-background-primary stroke-border-subtle" strokeWidth="1" />
      <path d="M35 64L60 77L85 64" className="stroke-primary" strokeWidth="2" fill="none" />
      {/* Notification dot */}
      <circle cx="90" cy="35" r="8" className="fill-accent" />
      <text x="87" y="39" className="fill-white text-[10px] font-bold">!</text>
    </svg>
  );
}
