"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";

const articles = [
  {
    id: "reset-password",
    title: "How to reset my password",
    content: `
      <p>If you've forgotten your password:</p>
      <ol>
        <li>Go to the login page</li>
        <li>Click <strong>"Forgot password?"</strong></li>
        <li>Enter your email address</li>
        <li>Check your email for the reset link</li>
        <li>Click the link and enter a new password</li>
      </ol>
      <p>Reset links expire after 1 hour for security.</p>
    `,
  },
  {
    id: "change-password",
    title: "How to change my password",
    content: `
      <p>To change your password while logged in:</p>
      <ol>
        <li>Go to <strong>Profile Settings</strong></li>
        <li>Scroll to the <strong>Security</strong> section</li>
        <li>Click <strong>"Change password"</strong></li>
        <li>Enter your current password</li>
        <li>Enter and confirm your new password</li>
        <li>Save changes</li>
      </ol>
      <p>Use a strong password with at least 8 characters, including numbers and symbols.</p>
    `,
  },
  {
    id: "wallet-login",
    title: "How to sign in with my wallet",
    content: `
      <p>You can sign in using your Ethereum wallet:</p>
      <ol>
        <li>Go to the login page</li>
        <li>Click <strong>"Connect Wallet"</strong></li>
        <li>Choose your wallet (MetaMask, WalletConnect, etc.)</li>
        <li>Sign the verification message when prompted</li>
        <li>You're now logged in!</li>
      </ol>
      <p>This method uses Sign-In with Ethereum (SIWE) - no password needed.</p>
    `,
  },
  {
    id: "link-accounts",
    title: "How to link my email and wallet",
    content: `
      <p>You can link both email and wallet to your account:</p>
      <ol>
        <li>Go to <strong>Profile Settings</strong></li>
        <li>Scroll to the <strong>Security</strong> section</li>
        <li>Under "Connected Accounts", click to add email or wallet</li>
        <li>Follow the prompts to verify</li>
      </ol>
      <p>Linking both gives you multiple ways to access your account.</p>
    `,
  },
  {
    id: "two-factor",
    title: "Is two-factor authentication available?",
    content: `
      <p>Currently, Vlossom supports:</p>
      <ul>
        <li><strong>Email verification</strong> for password resets</li>
        <li><strong>Wallet signatures</strong> for SIWE authentication</li>
      </ul>
      <p>Full 2FA with authenticator apps is coming soon. For now, we recommend using wallet-based login for maximum security.</p>
    `,
  },
  {
    id: "delete-account",
    title: "How to delete my account",
    content: `
      <p>To permanently delete your account:</p>
      <ol>
        <li>Go to <strong>Profile Settings</strong></li>
        <li>Scroll to the <strong>Danger Zone</strong> section</li>
        <li>Click <strong>"Delete account"</strong></li>
        <li>Type DELETE to confirm</li>
        <li>Your account will be permanently removed</li>
      </ol>
      <p><strong>Warning:</strong> This action cannot be undone. All data and any remaining wallet balance will be lost.</p>
    `,
  },
  {
    id: "suspicious-activity",
    title: "I noticed suspicious activity on my account",
    content: `
      <p>If you notice unauthorized activity:</p>
      <ol>
        <li>Change your password immediately</li>
        <li>Check for any unauthorized bookings or transactions</li>
        <li>Review your connected accounts in settings</li>
        <li>Contact our support team</li>
      </ol>
      <p>We take security seriously and will help you secure your account.</p>
    `,
  },
];

export default function SecurityHelpPage() {
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
              <Icon name="trusted" size="lg" className="text-brand-rose" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Account & Security
              </h1>
              <p className="text-text-secondary">
                Login, passwords, and account settings
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
