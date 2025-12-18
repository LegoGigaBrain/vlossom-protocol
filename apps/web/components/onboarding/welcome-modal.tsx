"use client";

import { useState, useEffect } from "react";
import { Icon, type IconName } from "@/components/icons";

interface WelcomeModalProps {
  userRole: "CUSTOMER" | "STYLIST";
  userName?: string;
  onClose: () => void;
  onStartTour?: () => void;
}

/**
 * Welcome Modal Component (F5.4)
 * Shown on first login to introduce the platform
 */
export function WelcomeModal({
  userRole,
  userName,
  onClose,
  onStartTour,
}: WelcomeModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const features: Array<{ iconName: IconName; title: string; description: string }> =
    userRole === "CUSTOMER"
      ? [
          {
            iconName: "calendar",
            title: "Easy Booking",
            description: "Browse stylists and book appointments in seconds",
          },
          {
            iconName: "wallet",
            title: "Secure Payments",
            description: "Your funds are held in escrow until service completion",
          },
          {
            iconName: "secure",
            title: "Protected Transactions",
            description: "Smart contracts ensure fair payments for everyone",
          },
        ]
      : [
          {
            iconName: "calendar",
            title: "Manage Bookings",
            description: "Accept, schedule, and complete appointments easily",
          },
          {
            iconName: "wallet",
            title: "Guaranteed Payments",
            description: "Get paid automatically when you complete services",
          },
          {
            iconName: "secure",
            title: "Build Your Business",
            description: "Showcase your work and grow your client base",
          },
        ];

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`relative w-full max-w-lg bg-white rounded-2xl shadow-xl transform transition-all duration-300 ${
            isVisible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
          }`}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close welcome modal"
          >
            <Icon name="close" size="sm" aria-hidden="true" />
          </button>

          {/* Content */}
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">👋</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Welcome to Vlossom{userName ? `, ${userName}` : ""}!
              </h2>
              <p className="text-gray-500 mt-2">
                {userRole === "CUSTOMER"
                  ? "Your journey to beautiful hair starts here"
                  : "Ready to grow your styling business?"}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4 mb-8">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Icon name={feature.iconName} size="sm" className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{feature.title}</h3>
                    <p className="text-sm text-gray-500">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Wallet info */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <Icon name="wallet" size="sm" className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">
                    Your Smart Wallet
                  </h4>
                  <p className="text-sm text-blue-700">
                    We've created a secure wallet for you. Claim free test USDC
                    from the faucet to try out the platform!
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-3">
              {onStartTour && (
                <button
                  onClick={() => {
                    handleClose();
                    onStartTour();
                  }}
                  className="w-full py-3 px-4 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Take a Quick Tour
                </button>
              )}
              <button
                onClick={handleClose}
                className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                {onStartTour ? "Skip for Now" : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
