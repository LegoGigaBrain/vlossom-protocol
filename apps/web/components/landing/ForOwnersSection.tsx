'use client';

/**
 * ForOwnersSection
 *
 * Value proposition section for property/salon owners.
 */

import React from 'react';
import { AnimatedSection } from './AnimatedSection';

const features = [
  {
    title: 'Monetize Your Space',
    description:
      'Turn empty chairs into revenue. Rent your salon space to mobile stylists by the hour or day.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    title: 'Vetted Professionals',
    description:
      "Only verified stylists can book your space. Maintain your salon's reputation.",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22,4 12,14.01 9,11.01" />
      </svg>
    ),
  },
  {
    title: 'Flexible Scheduling',
    description:
      'Set your own availability windows. Block times for your own team or open up for rentals.',
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    title: 'Passive Income',
    description:
      'Earn while you focus on your own clients. Payments handled automatically through the platform.',
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
        <path d="M16 8h-6a2 2 0 100 4h4a2 2 0 110 4H8" />
        <path d="M12 18V6" />
      </svg>
    ),
  },
];

export function ForOwnersSection() {
  return (
    <section id="for-owners" className="py-24 bg-brand-purple text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedSection className="text-center mb-16">
          <span className="text-caption font-medium text-accent uppercase tracking-wider">
            For Salon Owners
          </span>
          <h2 className="font-display text-3xl sm:text-4xl text-white mt-2 mb-4">
            Your Space, New Revenue
          </h2>
          <p className="text-body text-white/80 max-w-2xl mx-auto">
            Own a salon or have extra chair space? Partner with Vlossom to connect
            with mobile stylists looking for professional spaces to serve their
            clients.
          </p>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <AnimatedSection
              key={feature.title}
              animation="settle"
              delay={index * 75}
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 h-full hover:bg-white/15 transition-colors">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center mb-4 text-white">
                  {feature.icon}
                </div>
                <h3 className="font-display text-lg text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-body text-white/70">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
