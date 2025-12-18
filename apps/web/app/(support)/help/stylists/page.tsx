"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

const articles = [
  {
    id: "find-stylist",
    title: "How do I find a stylist?",
    content: `
      <p>Finding the perfect stylist is easy:</p>
      <ol>
        <li>Go to the <strong>Discover</strong> page from the navigation</li>
        <li>Browse all available stylists or use filters</li>
        <li>Filter by category (Hair, Nails, Makeup, Skincare)</li>
        <li>Sort by rating, distance, or price</li>
        <li>Tap on any stylist to view their full profile</li>
      </ol>
    `,
  },
  {
    id: "reviews",
    title: "How do I leave a review?",
    content: `
      <p>You can leave a review after your appointment is complete:</p>
      <ol>
        <li>After confirming service completion, you'll be prompted to leave a review</li>
        <li>Select a star rating (1-5 stars)</li>
        <li>Optionally write about your experience</li>
        <li>Submit your review</li>
      </ol>
      <p>Your honest feedback helps other customers make informed decisions and helps stylists improve their services.</p>
    `,
  },
  {
    id: "stylist-profile",
    title: "What information is on a stylist profile?",
    content: `
      <p>Stylist profiles include:</p>
      <ul>
        <li><strong>About:</strong> Bio and experience</li>
        <li><strong>Services:</strong> List of services with prices and duration</li>
        <li><strong>Gallery:</strong> Photos of their work</li>
        <li><strong>Reviews:</strong> Ratings and feedback from customers</li>
        <li><strong>Availability:</strong> When they're available for bookings</li>
        <li><strong>Location:</strong> Where they're based</li>
      </ul>
    `,
  },
  {
    id: "reputation",
    title: "What do reputation badges mean?",
    content: `
      <p>Reputation badges indicate a stylist's track record:</p>
      <ul>
        <li><strong>New:</strong> Just started on Vlossom</li>
        <li><strong>Rising:</strong> Building a positive reputation</li>
        <li><strong>Trusted:</strong> Consistently good reviews</li>
        <li><strong>Verified:</strong> Excellent track record and verified identity</li>
        <li><strong>Elite:</strong> Top-tier performance with exceptional ratings</li>
      </ul>
      <p>Reputation is calculated based on reviews, completed bookings, and cancellation rate.</p>
    `,
  },
  {
    id: "contact-stylist",
    title: "Can I message a stylist before booking?",
    content: `
      <p>Currently, messaging is only available after you've made a booking. This helps:</p>
      <ul>
        <li>Keep communication focused on confirmed appointments</li>
        <li>Protect stylists from spam</li>
        <li>Ensure all important details are tied to specific bookings</li>
      </ul>
      <p>Once you book, you can message your stylist about specific requests or questions.</p>
    `,
  },
];

export default function StylistsHelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-rose/5 border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-sm text-brand-rose hover:text-brand-clay transition-gentle mb-4"
          >
            <Icon name="chevronLeft" size="sm" />
            Back to Help Center
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Icon name="profile" size="lg" className="text-brand-rose" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Finding Stylists
              </h1>
              <p className="text-text-secondary">
                Discovering and choosing the right stylist
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Article List */}
        <div className="space-y-4">
          {articles.map((article) => (
            <details
              key={article.id}
              id={article.id}
              className="group bg-background-secondary rounded-card overflow-hidden"
            >
              <summary className="flex items-center justify-between p-4 cursor-pointer list-none hover:bg-background-tertiary transition-gentle">
                <span className="font-medium text-text-primary">
                  {article.title}
                </span>
                <Icon name="chevronRight" size="md" className="text-text-muted transition-transform group-open:rotate-90" />
              </summary>
              <div
                className="px-4 pb-4 prose prose-sm max-w-none text-text-secondary"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </details>
          ))}
        </div>

        {/* Contact */}
        <div className="mt-8 p-6 bg-background-tertiary rounded-card text-center">
          <p className="text-text-secondary mb-3">
            Didn't find what you're looking for?
          </p>
          <Link
            href="/contact"
            className="text-brand-rose hover:text-brand-clay transition-gentle font-medium"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
