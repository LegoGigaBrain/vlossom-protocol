"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

const articles = [
  {
    id: "how-to-book",
    title: "How do I book an appointment?",
    content: `
      <p>Booking an appointment on Vlossom is easy:</p>
      <ol>
        <li><strong>Find a stylist</strong> - Browse our directory or search for specific services</li>
        <li><strong>Select services</strong> - Choose the services you want from their menu</li>
        <li><strong>Pick a date and time</strong> - Select from available slots on their calendar</li>
        <li><strong>Add payment</strong> - Your payment is held securely in escrow until service completion</li>
        <li><strong>Confirm booking</strong> - Review details and confirm your appointment</li>
      </ol>
      <p>You'll receive a confirmation notification and email with your booking details.</p>
    `,
  },
  {
    id: "cancellation-policy",
    title: "What is the cancellation policy?",
    content: `
      <p>Our cancellation policy is designed to be fair to both customers and stylists:</p>
      <ul>
        <li><strong>24+ hours before:</strong> Full refund, no questions asked</li>
        <li><strong>12-24 hours before:</strong> 50% refund</li>
        <li><strong>Less than 12 hours:</strong> No refund (unless stylist cancels)</li>
      </ul>
      <p>If a stylist cancels your appointment, you'll always receive a full refund.</p>
    `,
  },
  {
    id: "reschedule",
    title: "How do I reschedule my appointment?",
    content: `
      <p>To reschedule an upcoming appointment:</p>
      <ol>
        <li>Go to <strong>My Bookings</strong> from the navigation</li>
        <li>Find the booking you want to change</li>
        <li>Tap <strong>Reschedule</strong></li>
        <li>Select a new date and time from available slots</li>
        <li>Confirm the changes</li>
      </ol>
      <p>Free rescheduling is available up to 24 hours before your appointment.</p>
    `,
  },
  {
    id: "stylist-cancels",
    title: "What happens if my stylist cancels?",
    content: `
      <p>If your stylist cancels your appointment:</p>
      <ul>
        <li>You'll receive an immediate notification</li>
        <li>Your payment will be fully refunded to your wallet</li>
        <li>We'll suggest alternative stylists with similar availability</li>
      </ul>
      <p>We take cancellations seriously - stylists with frequent cancellations may face account restrictions.</p>
    `,
  },
  {
    id: "confirm-completion",
    title: "How do I confirm service completion?",
    content: `
      <p>After your appointment, you'll need to confirm the service was completed:</p>
      <ol>
        <li>You'll receive a notification after your scheduled appointment time</li>
        <li>Open the booking and tap <strong>Confirm Service</strong></li>
        <li>Optionally add a tip for your stylist</li>
        <li>Your payment will be released from escrow to the stylist</li>
      </ol>
      <p>If you don't confirm within 48 hours, the payment is automatically released.</p>
    `,
  },
  {
    id: "report-issue",
    title: "How do I report a problem with my booking?",
    content: `
      <p>If something went wrong with your appointment:</p>
      <ol>
        <li>Go to the booking in <strong>My Bookings</strong></li>
        <li>Tap <strong>Report Issue</strong></li>
        <li>Select the type of problem</li>
        <li>Provide details and any photos if relevant</li>
        <li>Submit the report</li>
      </ol>
      <p>Our team will review your report within 24 hours and work to resolve the issue.</p>
    `,
  },
  {
    id: "dispute",
    title: "How do disputes work?",
    content: `
      <p>If you can't resolve an issue directly with your stylist, you can file a dispute:</p>
      <ul>
        <li>Your payment will be held in escrow until resolved</li>
        <li>Both parties can submit evidence</li>
        <li>Our team reviews and makes a fair decision</li>
        <li>Resolution typically happens within 24-48 hours</li>
      </ul>
      <p>Possible outcomes include full refund, partial refund, or payment to stylist.</p>
    `,
  },
  {
    id: "no-show",
    title: "What if my stylist doesn't show up?",
    content: `
      <p>If your stylist fails to show up for your appointment:</p>
      <ol>
        <li>Wait 15 minutes past the scheduled time</li>
        <li>Try to contact the stylist through the app</li>
        <li>If no response, report a no-show through the booking</li>
        <li>You'll receive an automatic full refund</li>
      </ol>
      <p>No-shows are taken very seriously and may result in stylist account suspension.</p>
    `,
  },
];

export default function BookingsHelpPage() {
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
              <Icon name="calendar" size="lg" className="text-brand-rose" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Bookings & Appointments
              </h1>
              <p className="text-text-secondary">
                How to book, reschedule, or cancel appointments
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
            Didn&apos;t find what you&apos;re looking for?
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
