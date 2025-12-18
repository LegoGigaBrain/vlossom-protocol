"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/icons";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQItem[] = [
  // General
  {
    category: "General",
    question: "What is Vlossom?",
    answer:
      "Vlossom is a marketplace connecting customers with hair stylists. We use blockchain technology to ensure secure, escrow-protected payments so both customers and stylists are protected.",
  },
  {
    category: "General",
    question: "Is Vlossom available in my area?",
    answer:
      "During beta, Vlossom is available in South Africa. We're expanding to more regions soon. Sign up to be notified when we launch in your area!",
  },
  {
    category: "General",
    question: "Do I need any crypto knowledge to use Vlossom?",
    answer:
      "No! We've designed Vlossom to be as simple as any other booking app. Your smart wallet is created automatically, and we handle all the blockchain complexity behind the scenes.",
  },

  // Payments
  {
    category: "Payments",
    question: "What is USDC?",
    answer:
      "USDC is a stablecoin - a digital currency that's always worth $1 USD. We use USDC for payments because it provides fast, low-cost transactions while maintaining a stable value.",
  },
  {
    category: "Payments",
    question: "How does escrow work?",
    answer:
      "When you book a service, your payment is held in a secure escrow smart contract. The funds are only released to the stylist after the service is completed. If there's a cancellation, the funds are returned to you based on our cancellation policy.",
  },
  {
    category: "Payments",
    question: "What is the faucet?",
    answer:
      "The faucet is a way to get free test USDC during our beta period. You can claim 1,000 test USDC once every 24 hours. This lets you try out all features of the platform without spending real money.",
  },
  {
    category: "Payments",
    question: "Are there any fees?",
    answer:
      "Vlossom charges a small platform fee (typically 5-10%) on completed bookings. This fee is included in the quoted price, so there are no surprises. We also cover all blockchain transaction fees for you!",
  },

  // Bookings
  {
    category: "Bookings",
    question: "How do I cancel a booking?",
    answer:
      "You can cancel a booking from your bookings page. If you cancel more than 24 hours before the appointment, you'll receive a full refund. Cancellations within 24 hours may be subject to a partial fee.",
  },
  {
    category: "Bookings",
    question: "What happens if a stylist cancels?",
    answer:
      "If a stylist cancels your booking, you'll receive a full refund automatically. The funds will be returned to your wallet immediately.",
  },
  {
    category: "Bookings",
    question: "Can I modify my booking?",
    answer:
      "You can request to change the time or date of your booking. The stylist will need to approve the change. If approved, the booking will be updated without any additional fees.",
  },

  // Stylists
  {
    category: "For Stylists",
    question: "How do I become a stylist on Vlossom?",
    answer:
      "Sign up and select 'Stylist' as your role. Then complete your profile, add your services, and set your availability. Once your profile is live, customers can start booking with you!",
  },
  {
    category: "For Stylists",
    question: "When do I get paid?",
    answer:
      "You receive payment automatically when you mark a service as complete. The funds go directly to your wallet, minus the platform fee. You can then withdraw to your bank account.",
  },
  {
    category: "For Stylists",
    question: "Can I set my own prices?",
    answer:
      "Yes! You have full control over your service prices. Set prices that reflect your skills and experience. You can also offer different pricing tiers for different services.",
  },

  // Security
  {
    category: "Security",
    question: "Is my payment information secure?",
    answer:
      "Absolutely. We never store card details on our servers. All payments are processed through secure, verified payment providers. Your wallet is protected by blockchain-level security.",
  },
  {
    category: "Security",
    question: "What is a smart wallet?",
    answer:
      "A smart wallet is a blockchain wallet that's created just for you when you sign up. It holds your USDC balance and enables secure transactions. Unlike traditional crypto wallets, you don't need to manage seed phrases or private keys.",
  },
];

/**
 * FAQ Page (F5.4)
 */
export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  // Group FAQs by category
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <Icon name="chevronLeft" size="sm" />
            Back to Help Center
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Frequently Asked Questions
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Find answers to common questions about Vlossom
        </p>

        {/* FAQ Categories */}
        {categories.map((category) => (
          <div key={category} className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {category}
            </h2>
            <div className="bg-white rounded-xl shadow-sm divide-y">
              {faqs
                .filter((faq) => faq.category === category)
                .map((faq, index) => {
                  const globalIndex = faqs.indexOf(faq);
                  const isOpen = openItems.has(globalIndex);

                  return (
                    <div key={index}>
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50"
                      >
                        <span className="font-medium text-gray-900 pr-4">
                          {faq.question}
                        </span>
                        {isOpen ? (
                          <Icon name="chevronUp" size="md" className="text-gray-400 flex-shrink-0" />
                        ) : (
                          <Icon name="chevronDown" size="md" className="text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4">
                          <p className="text-gray-600">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}

        {/* Still have questions */}
        <div className="bg-purple-50 rounded-xl p-8 text-center mt-12">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Still have questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Can't find what you're looking for? Reach out to our support team.
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
