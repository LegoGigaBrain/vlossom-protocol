'use client';

/**
 * HeroSection
 *
 * Full-height hero section with main value proposition and CTAs.
 * Orange "Launch App" CTA for growth/celebration moment.
 */

import React from 'react';
import Link from 'next/link';
import { Button } from '../ui/button';
import { AnimatedSection } from './AnimatedSection';

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-background-secondary to-white pt-16">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-purple/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <AnimatedSection animation="unfold">
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-brand-purple mb-6 leading-tight">
            Where You Blossom
          </h1>
        </AnimatedSection>

        <AnimatedSection animation="settle" delay={100}>
          <p className="text-body sm:text-xl text-text-secondary max-w-2xl mx-auto mb-8">
            The trust-first beauty marketplace connecting you with talented
            mobile stylists. Book appointments, discover new looks, and pay
            securely—all in one place.
          </p>
        </AnimatedSection>

        <AnimatedSection animation="settle" delay={200}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding">
              <Button
                size="lg"
                className="bg-accent hover:bg-accent/90 text-white text-lg px-8"
              >
                Launch App
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline" size="lg" className="text-lg px-8">
                Book Appointment
              </Button>
            </Link>
            <Link href="/onboarding?role=stylist">
              <Button variant="secondary" size="lg" className="text-lg px-8">
                Offer Services
              </Button>
            </Link>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade" delay={400}>
          <p className="mt-8 text-caption text-text-muted">
            V7.5.0 - Base Sepolia Testnet
          </p>
        </AnimatedSection>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-breathe">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          className="text-text-muted"
        >
          <path
            d="M12 5v14M19 12l-7 7-7-7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </section>
  );
}
