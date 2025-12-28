'use client';

/**
 * CTASection
 *
 * Final conversion banner with orange "Launch App" CTA.
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { AnimatedSection } from './AnimatedSection';

export function CTASection() {
  return (
    <section className="py-24 bg-background-secondary">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection animation="unfold">
          <h2 className="font-display text-3xl sm:text-4xl text-brand-purple mb-4">
            Ready to Blossom?
          </h2>
        </AnimatedSection>

        <AnimatedSection animation="settle" delay={100}>
          <p className="text-body sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            Join thousands of stylists and clients who are transforming the
            beauty industry together. Your journey starts with one tap.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="settle" delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white text-lg px-10"
              >
                Launch App
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="text-lg px-10">
                Sign In
              </Button>
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade" delay={400}>
          <div className="mt-12 flex items-center justify-center gap-8 text-text-muted">
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-caption">Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              <span className="text-caption">Verified Stylists</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                <line x1="9" y1="9" x2="9.01" y2="9" />
                <line x1="15" y1="9" x2="15.01" y2="9" />
              </svg>
              <span className="text-caption">Happy Clients</span>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
