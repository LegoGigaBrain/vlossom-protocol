'use client';

/**
 * HowItWorksSection
 *
 * 3-step process showing how Vlossom works: Discover → Book → Blossom
 */

import React from 'react';
import { AnimatedSection } from './AnimatedSection';

const steps = [
  {
    number: '01',
    title: 'Discover',
    description:
      'Browse verified stylists in your area. View portfolios, read reviews, and find the perfect match for your hair goals.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Book',
    description:
      'Schedule an appointment that fits your life. Choose your location—home, salon, or wherever you feel comfortable.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Blossom',
    description:
      'Experience your transformation. Pay securely with built-in escrow protection, and leave a review to help others discover great stylists.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 2c.3 0 .5.2.6.4l1.9 4.8 5.2.4c.2 0 .4.2.5.4.1.2 0 .4-.2.6l-4 3.4 1.3 5c0 .2 0 .4-.2.6-.2.1-.4.1-.6 0L12 14.8l-4.5 2.8c-.2.1-.4.1-.6 0-.2-.2-.2-.4-.2-.6l1.3-5-4-3.4c-.2-.2-.3-.4-.2-.6.1-.2.3-.4.5-.4l5.2-.4 1.9-4.8c.1-.2.3-.4.6-.4z" />
      </svg>
    ),
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-purple mb-4">
            How It Works
          </h2>
          <p className="text-body text-text-secondary max-w-2xl mx-auto">
            Getting your hair done should be simple. Here&apos;s how Vlossom makes it
            happen.
          </p>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <AnimatedSection
              key={step.number}
              animation="settle"
              delay={index * 100}
              className="relative"
            >
              {/* Connector line - hidden on mobile and last item */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-px bg-border-default -translate-x-1/2 z-0" />
              )}

              <div className="relative bg-background-secondary rounded-xl p-8 text-center h-full">
                {/* Step number */}
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand-purple text-white text-caption font-medium px-3 py-1 rounded-pill">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-white flex items-center justify-center text-brand-purple shadow-soft">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="font-display text-xl text-brand-purple mb-3">
                  {step.title}
                </h3>
                <p className="text-body text-text-secondary">
                  {step.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
