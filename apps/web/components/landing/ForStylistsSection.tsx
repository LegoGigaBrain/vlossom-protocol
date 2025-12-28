'use client';

/**
 * ForStylistsSection
 *
 * Value proposition section for stylists.
 */

import React from 'react';
import { AnimatedSection } from './AnimatedSection';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    title: 'Be Your Own Boss',
    description:
      'Set your own hours, prices, and availability. Build your brand on your terms.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12,6 12,12 16,14" />
      </svg>
    ),
  },
  {
    title: 'Guaranteed Payments',
    description:
      'Get paid reliably through our escrow system. No chasing clients, no payment drama.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
      </svg>
    ),
  },
  {
    title: 'Grow Your Clientele',
    description:
      'Get discovered by new clients searching for your specialty. Build lasting relationships.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: 'Professional Tools',
    description:
      'Manage bookings, track earnings, and communicate with clients—all in one place.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
];

export function ForStylistsSection() {
  return (
    <section id="for-stylists" className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Visual - Left side on desktop */}
          <AnimatedSection animation="unfold" className="order-2 lg:order-1">
            <div className="relative aspect-square max-w-md mx-auto lg:max-w-none">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-brand-purple/10 rounded-3xl" />
              <div className="absolute inset-8 bg-background-secondary rounded-2xl shadow-card flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white flex items-center justify-center">
                    <svg
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      className="text-brand-purple"
                    >
                      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
                    </svg>
                  </div>
                  <p className="font-display text-xl text-brand-purple mb-2">
                    Your Craft, Your Business
                  </p>
                  <p className="text-caption text-text-muted">
                    Freedom to create
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* Content - Right side on desktop */}
          <div className="order-1 lg:order-2">
            <AnimatedSection>
              <span className="text-caption font-medium text-accent uppercase tracking-wider">
                For Stylists
              </span>
              <h2 className="font-display text-3xl sm:text-4xl text-brand-purple mt-2 mb-4">
                Build Your Empire
              </h2>
              <p className="text-body text-text-secondary mb-8">
                You're more than just a stylist—you're a business owner. Vlossom
                gives you the platform to showcase your talent, manage your
                schedule, and grow your income.
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
        </div>
      </div>
    </section>
  );
}
