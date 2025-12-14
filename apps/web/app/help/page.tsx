"use client";

import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  Calendar,
  HelpCircle,
  Users,
  Shield,
} from "lucide-react";

const helpCategories = [
  {
    title: "Getting Started",
    description: "New to Vlossom? Learn the basics",
    icon: BookOpen,
    href: "/help/getting-started",
    color: "bg-purple-100 text-purple-600",
  },
  {
    title: "Booking & Appointments",
    description: "How to book services and manage appointments",
    icon: Calendar,
    href: "/help/bookings",
    color: "bg-blue-100 text-blue-600",
  },
  {
    title: "Wallet & Payments",
    description: "Understanding your wallet and payment process",
    icon: CreditCard,
    href: "/help/wallet",
    color: "bg-green-100 text-green-600",
  },
  {
    title: "For Stylists",
    description: "Guides for service providers",
    icon: Users,
    href: "/help/stylists",
    color: "bg-orange-100 text-orange-600",
  },
  {
    title: "Security & Privacy",
    description: "How we keep your information safe",
    icon: Shield,
    href: "/help/security",
    color: "bg-red-100 text-red-600",
  },
  {
    title: "FAQ",
    description: "Frequently asked questions",
    icon: HelpCircle,
    href: "/help/faq",
    color: "bg-gray-100 text-gray-600",
  },
];

/**
 * Help Center Home Page (F5.4)
 */
export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-purple-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-purple-100 text-lg">
            Everything you need to know about using Vlossom
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-4xl mx-auto px-4 -mt-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {helpCategories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div
                className={`w-12 h-12 rounded-lg ${category.color} flex items-center justify-center mb-4`}
              >
                <category.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {category.title}
              </h3>
              <p className="text-gray-500 text-sm">{category.description}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Popular Articles
        </h2>
        <div className="bg-white rounded-xl shadow-sm divide-y">
          <Link
            href="/help/getting-started#create-account"
            className="block p-4 hover:bg-gray-50"
          >
            <span className="text-purple-600 font-medium">
              How to create an account
            </span>
          </Link>
          <Link
            href="/help/wallet#faucet"
            className="block p-4 hover:bg-gray-50"
          >
            <span className="text-purple-600 font-medium">
              Getting free test USDC from the faucet
            </span>
          </Link>
          <Link
            href="/help/bookings#escrow"
            className="block p-4 hover:bg-gray-50"
          >
            <span className="text-purple-600 font-medium">
              Understanding the escrow payment system
            </span>
          </Link>
          <Link
            href="/help/bookings#cancel"
            className="block p-4 hover:bg-gray-50"
          >
            <span className="text-purple-600 font-medium">
              How to cancel a booking
            </span>
          </Link>
          <Link
            href="/help/stylists#services"
            className="block p-4 hover:bg-gray-50"
          >
            <span className="text-purple-600 font-medium">
              Setting up your services as a stylist
            </span>
          </Link>
        </div>
      </div>

      {/* Contact Support */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-purple-50 rounded-xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Still need help?
          </h2>
          <p className="text-gray-600 mb-6">
            Our support team is here to assist you
          </p>
          <a
            href="mailto:support@vlossom.io"
            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
