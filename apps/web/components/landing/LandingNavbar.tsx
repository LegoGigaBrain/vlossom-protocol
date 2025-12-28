'use client';

/**
 * LandingNavbar
 *
 * Fixed navigation bar for landing page with glass effect on scroll.
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { VlossomWordmark } from '../ui/vlossom-logo';

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-sticky transition-all duration-300',
        scrolled
          ? 'bg-white/90 backdrop-blur-md shadow-soft'
          : 'bg-transparent'
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <VlossomWordmark height={24} variant="auto" />
          </Link>

          {/* Navigation Links - Hidden on mobile */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-body text-text-secondary hover:text-text-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#for-customers"
              className="text-body text-text-secondary hover:text-text-primary transition-colors"
            >
              For Customers
            </a>
            <a
              href="#for-stylists"
              className="text-body text-text-secondary hover:text-text-primary transition-colors"
            >
              For Stylists
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">
                Log In
              </Button>
            </Link>
            <Link href="/onboarding">
              <Button
                size="sm"
                className="bg-accent hover:bg-accent/90 text-white"
              >
                Launch App
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
