"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

/**
 * Getting Started Guide (F5.4)
 */
export default function GettingStartedPage() {
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
          Getting Started with Vlossom
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to Vlossom! This guide will help you get set up and make your
          first booking or start accepting clients.
        </p>

        {/* Step 1 */}
        <section id="create-account" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              1
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Create Your Account
            </h2>
          </div>
          <div className="ml-11">
            <p className="text-gray-600 mb-4">
              Sign up with your email address and choose whether you're a
              customer looking for styling services or a stylist offering
              services.
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can be both a customer and a stylist!
                Your account supports multiple roles.
              </p>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <Icon name="check" size="md" className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Enter your email and create a secure password
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size="md" className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Choose your display name (this is what others will see)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="check" size="md" className="text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">
                  Select your role: Customer or Stylist
                </span>
              </li>
            </ul>
          </div>
        </section>

        {/* Step 2 */}
        <section id="smart-wallet" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              2
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Understand Your Smart Wallet
            </h2>
          </div>
          <div className="ml-11">
            <p className="text-gray-600 mb-4">
              When you create an account, we automatically create a smart wallet
              for you. This is your personal wallet on the blockchain that holds
              your USDC balance.
            </p>
            <div className="bg-gray-100 rounded-lg p-6 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">
                What makes it "smart"?
              </h4>
              <ul className="space-y-2 text-gray-600">
                <li>
                  • <strong>No gas fees:</strong> We sponsor all transaction
                  fees for you
                </li>
                <li>
                  • <strong>Email login:</strong> No need for crypto wallets or
                  seed phrases
                </li>
                <li>
                  • <strong>Secure:</strong> Only you can authorize transactions
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 3 */}
        <section id="fund-wallet" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              3
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Fund Your Wallet
            </h2>
          </div>
          <div className="ml-11">
            <p className="text-gray-600 mb-4">
              To book services, you'll need USDC in your wallet. During the beta
              period, you can claim free test USDC from our faucet!
            </p>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-800">
                <strong>Beta Bonus:</strong> Claim 1,000 test USDC from the
                faucet. This is free and can be used to try out all features!
              </p>
            </div>
            <p className="text-gray-600">
              In the future, you'll be able to add funds using your credit card
              or bank transfer via our payment partner.
            </p>
          </div>
        </section>

        {/* Step 4 - Customer */}
        <section id="first-booking" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Book Your First Service (Customers)
            </h2>
          </div>
          <div className="ml-11">
            <ol className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">a.</span>
                <span>Browse available stylists in your area</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">b.</span>
                <span>
                  View their services, prices, and portfolio
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">c.</span>
                <span>Select a service and choose an available time slot</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">d.</span>
                <span>
                  Confirm your booking - funds will be held in escrow
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">e.</span>
                <span>
                  Wait for the stylist to approve, then you're all set!
                </span>
              </li>
            </ol>
          </div>
        </section>

        {/* Step 4 - Stylist */}
        <section id="first-service" className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">
              4
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">
              Set Up Your Services (Stylists)
            </h2>
          </div>
          <div className="ml-11">
            <ol className="space-y-4 text-gray-600">
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">a.</span>
                <span>Complete your stylist profile with bio and photos</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">b.</span>
                <span>
                  Add the services you offer with prices and duration
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">c.</span>
                <span>Set your availability schedule</span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">d.</span>
                <span>
                  Start receiving booking requests from customers
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-medium text-purple-600">e.</span>
                <span>
                  Complete services and get paid automatically!
                </span>
              </li>
            </ol>
          </div>
        </section>

        {/* Next Steps */}
        <div className="bg-purple-50 rounded-xl p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            What's Next?
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/help/wallet"
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-purple-600">
                Learn about payments →
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Understand escrow and how payments work
              </p>
            </Link>
            <Link
              href="/help/faq"
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <span className="font-medium text-purple-600">
                Read the FAQ →
              </span>
              <p className="text-sm text-gray-500 mt-1">
                Common questions answered
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
