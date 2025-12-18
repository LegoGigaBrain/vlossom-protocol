"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/icons";

interface TourStep {
  target: string; // CSS selector for element to highlight
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
}

interface FeatureTourProps {
  userRole: "CUSTOMER" | "STYLIST";
  onComplete: () => void;
  onSkip: () => void;
}

const customerSteps: TourStep[] = [
  {
    target: '[data-tour="wallet-balance"]',
    title: "Your Wallet",
    description:
      "This is your USDC balance. You'll use this to pay for services. Claim free test funds from the faucet to get started!",
    position: "bottom",
  },
  {
    target: '[data-tour="browse-stylists"]',
    title: "Find Stylists",
    description:
      "Browse through our talented stylists. Filter by service type, location, and availability.",
    position: "bottom",
  },
  {
    target: '[data-tour="bookings"]',
    title: "Your Bookings",
    description:
      "Track all your appointments here. See upcoming, past, and pending bookings.",
    position: "right",
  },
  {
    target: '[data-tour="notifications"]',
    title: "Stay Updated",
    description:
      "Get notified when your stylist confirms or starts your appointment.",
    position: "bottom",
  },
];

const stylistSteps: TourStep[] = [
  {
    target: '[data-tour="dashboard-stats"]',
    title: "Your Dashboard",
    description:
      "See your earnings, pending requests, and upcoming bookings at a glance.",
    position: "bottom",
  },
  {
    target: '[data-tour="services"]',
    title: "Manage Services",
    description:
      "Add and edit the services you offer. Set your prices and duration.",
    position: "right",
  },
  {
    target: '[data-tour="availability"]',
    title: "Set Availability",
    description:
      "Define your working hours and block off dates when you're unavailable.",
    position: "right",
  },
  {
    target: '[data-tour="pending-requests"]',
    title: "Booking Requests",
    description:
      "Review and approve incoming booking requests from customers.",
    position: "bottom",
  },
];

/**
 * Feature Tour Component (F5.4)
 * Interactive walkthrough of key features
 */
export function FeatureTour({ userRole, onComplete, onSkip }: FeatureTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightPosition, setHighlightPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const steps = userRole === "CUSTOMER" ? customerSteps : stylistSteps;
  const step = steps[currentStep];

  useEffect(() => {
    // Find and highlight the target element
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      setHighlightPosition({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      });

      // Scroll element into view
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // Element not found, skip to next or complete
      setHighlightPosition(null);
    }
  }, [step.target]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Calculate tooltip position
  const getTooltipStyle = () => {
    if (!highlightPosition) return {};

    const padding = 16;
    const tooltipWidth = 320;

    switch (step.position) {
      case "top":
        return {
          bottom: window.innerHeight - highlightPosition.top + padding,
          left: highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2,
        };
      case "bottom":
        return {
          top: highlightPosition.top + highlightPosition.height + padding,
          left: highlightPosition.left + highlightPosition.width / 2 - tooltipWidth / 2,
        };
      case "left":
        return {
          top: highlightPosition.top + highlightPosition.height / 2 - 60,
          right: window.innerWidth - highlightPosition.left + padding,
        };
      case "right":
        return {
          top: highlightPosition.top + highlightPosition.height / 2 - 60,
          left: highlightPosition.left + highlightPosition.width + padding,
        };
      default:
        return {};
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay with hole */}
      <div className="absolute inset-0 bg-black bg-opacity-50">
        {highlightPosition && (
          <div
            className="absolute bg-transparent"
            style={{
              top: highlightPosition.top - 8,
              left: highlightPosition.left - 8,
              width: highlightPosition.width + 16,
              height: highlightPosition.height + 16,
              boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              borderRadius: "8px",
            }}
          />
        )}
      </div>

      {/* Highlight ring */}
      {highlightPosition && (
        <div
          className="absolute border-2 border-purple-500 rounded-lg pointer-events-none animate-pulse"
          style={{
            top: highlightPosition.top - 8,
            left: highlightPosition.left - 8,
            width: highlightPosition.width + 16,
            height: highlightPosition.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute w-80 bg-white rounded-xl shadow-2xl p-6 z-10"
        style={getTooltipStyle()}
      >
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          aria-label="Close tour"
        >
          <Icon name="close" size="sm" aria-hidden="true" />
        </button>

        {/* Step indicator */}
        <div className="flex gap-1 mb-4">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${
                i <= currentStep ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {step.title}
        </h3>
        <p className="text-gray-600 text-sm mb-6">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-1 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="chevronLeft" size="sm" />
            Back
          </button>
          <span className="text-sm text-gray-500">
            {currentStep + 1} of {steps.length}
          </span>
          <button
            onClick={handleNext}
            className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
            <Icon name="chevronRight" size="sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
