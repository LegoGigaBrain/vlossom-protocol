'use client';

/**
 * ForCustomersSection
 *
 * Value proposition section for customers/clients.
 */

import React from 'react';
import { AnimatedSection } from './AnimatedSection';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    title: 'Verified Stylists',
    description:
      'Every stylist is background-checked and verified. Browse portfolios and reviews before booking.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Your Location, Your Choice',
    description:
      'Get styled at home, at a salon, or anywhere you're comfortable. Mobile stylists come to you.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    ),
  },
  {
    title: 'Secure Payments',
    description:
      'Your payment is held in escrow until your appointment is complete. No surprises, no stress.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="1" y="4" width="22" height="16" rx="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Hair Journey Tracking',
    description:
      'Document your transformations, track your hair health, and celebrate your growth milestones.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <polyline points="22,7 13.5,15.5 8.5,10.5 2,17" />
        <polyline points="16,7 22,7 22,13" />
      </svg>
    ),
  },
];

export function ForCustomersSection() {
  return (
    <section id="for-customers" className="py-24 bg-background-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <AnimatedSection>
              <span className="text-caption font-medium text-accent uppercase tracking-wider">
                For Customers
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-brand-purple mt-2 mb-4">
                Beauty on Your Terms
              </h2>
              <p className="text-body text-text-secondary mb-8">
                Finding the right stylist shouldn't be a gamble. Vlossom gives
                you the tools to discover, vet, and book talented professionals
                who understand your unique hair needs.
              </p>
            </AnimatedSection>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <AnimatedSection
                  key={feature.title}
                  animation="settle"
                  delay={index * 75}
                >
                  <FeatureCard
                    icon={feature.icon}
                    title={feature.title}
                    description={feature.description}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Visual */}
          <AnimatedSection animation="unfold" delay={200}>
            <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
              {/* Placeholder for illustration - could be replaced with actual image */}
              <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/10 to-accent/10 rounded-3xl" />
              <div className="absolute inset-8 bg-white rounded-2xl shadow-card flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-background-secondary flex items-center justify-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-brand-purple"
                    >
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <p className="font-display text-xl text-brand-purple mb-2">
                    Your Perfect Stylist
                  </p>
                  <p className="text-caption text-text-muted">
                    Awaits discovery
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}
