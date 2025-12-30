'use client';

/**
 * LandingFooter
 *
 * Multi-column footer with links, social, and legal.
 */

import React from 'react';
import Link from 'next/link';
import { VlossomWordmark } from '../ui/vlossom-logo';
import { Icon, type IconName } from '@/components/icons';

const footerLinks = {
  product: [
    { label: 'Book Appointment', href: '/search' },
    { label: 'Become a Stylist', href: '/onboarding?role=stylist' },
    { label: 'List Your Space', href: '/onboarding?role=owner' },
    { label: 'Pricing', href: '#' },
  ],
  company: [
    { label: 'About Us', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  resources: [
    { label: 'Help Center', href: '/help' },
    { label: 'Safety', href: '#' },
    { label: 'Blog', href: '#' },
    { label: 'Community', href: '#' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Cookie Policy', href: '#' },
  ],
};

const socialLinks: { label: string; href: string; icon: IconName }[] = [
  { label: 'Twitter', href: '#', icon: 'x' },
  { label: 'Instagram', href: '#', icon: 'instagram' },
  { label: 'LinkedIn', href: '#', icon: 'linkedin' },
];

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-purple text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <VlossomWordmark height={28} variant="cream" />
            </Link>
            <p className="text-body text-white/70 mb-4">
              Where you blossom.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="text-white/60 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <Icon name={social.icon} size="md" weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-medium text-white mb-4">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-medium text-white mb-4">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-medium text-white mb-4">Resources</h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-medium text-white mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-body text-white/70 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-caption text-white/60">
              &copy; {currentYear} Vlossom Protocol. All rights reserved.
            </p>
            <p className="text-caption text-white/60">
              Built with trust on Base
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
