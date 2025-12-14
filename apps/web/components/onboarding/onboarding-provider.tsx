"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { WelcomeModal } from "./welcome-modal";
import { FeatureTour } from "./feature-tour";

interface OnboardingContextValue {
  isOnboarding: boolean;
  hasCompletedOnboarding: boolean;
  startTour: () => void;
  skipOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
}

interface OnboardingProviderProps {
  children: ReactNode;
  user?: {
    id: string;
    displayName: string;
    roles: string[];
  } | null;
}

const ONBOARDING_KEY = "vlossom_onboarding_complete";

/**
 * Onboarding Provider (F5.4)
 * Manages first-time user onboarding experience
 */
export function OnboardingProvider({
  children,
  user,
}: OnboardingProviderProps) {
  const [showWelcome, setShowWelcome] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Check if user has completed onboarding
    const completed = localStorage.getItem(`${ONBOARDING_KEY}_${user.id}`);
    if (!completed) {
      setHasCompleted(false);
      setShowWelcome(true);
    }
  }, [user]);

  const markComplete = () => {
    if (user) {
      localStorage.setItem(`${ONBOARDING_KEY}_${user.id}`, "true");
    }
    setHasCompleted(true);
  };

  const handleWelcomeClose = () => {
    setShowWelcome(false);
    markComplete();
  };

  const handleStartTour = () => {
    setShowWelcome(false);
    setShowTour(true);
  };

  const handleTourComplete = () => {
    setShowTour(false);
    markComplete();
  };

  const handleSkipOnboarding = () => {
    setShowWelcome(false);
    setShowTour(false);
    markComplete();
  };

  const startTour = () => {
    setShowTour(true);
  };

  const userRole = user?.roles?.includes("STYLIST") ? "STYLIST" : "CUSTOMER";

  return (
    <OnboardingContext.Provider
      value={{
        isOnboarding: showWelcome || showTour,
        hasCompletedOnboarding: hasCompleted,
        startTour,
        skipOnboarding: handleSkipOnboarding,
      }}
    >
      {children}

      {/* Welcome Modal */}
      {showWelcome && user && (
        <WelcomeModal
          userRole={userRole}
          userName={user.displayName.split(" ")[0]}
          onClose={handleWelcomeClose}
          onStartTour={handleStartTour}
        />
      )}

      {/* Feature Tour */}
      {showTour && user && (
        <FeatureTour
          userRole={userRole}
          onComplete={handleTourComplete}
          onSkip={handleSkipOnboarding}
        />
      )}
    </OnboardingContext.Provider>
  );
}
