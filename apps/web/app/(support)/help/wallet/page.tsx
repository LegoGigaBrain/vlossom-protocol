"use client";

import Link from "next/link";
import { ChevronLeft, Wallet, ChevronRight } from "lucide-react";

const articles = [
  {
    id: "add-funds",
    title: "How to add funds to my wallet",
    content: `
      <p>There are several ways to add funds to your Vlossom wallet:</p>
      <h4>From Another Wallet</h4>
      <ol>
        <li>Go to your <strong>Wallet</strong> page</li>
        <li>Tap <strong>Receive</strong></li>
        <li>Copy your wallet address or scan the QR code</li>
        <li>Send USDC from any compatible wallet</li>
      </ol>
      <h4>Testnet Faucet</h4>
      <p>On testnet, you can claim free test USDC:</p>
      <ol>
        <li>Go to your Wallet page</li>
        <li>Scroll to the "Testnet Faucet" section</li>
        <li>Click "Get Test USDC"</li>
        <li>You can claim 1000 USDC every 24 hours</li>
      </ol>
    `,
  },
  {
    id: "send-funds",
    title: "How to send money to someone",
    content: `
      <p>To send USDC to another wallet:</p>
      <ol>
        <li>Go to your <strong>Wallet</strong> page</li>
        <li>Tap <strong>Send</strong></li>
        <li>Enter the recipient's wallet address</li>
        <li>Enter the amount to send</li>
        <li>Review and confirm the transaction</li>
      </ol>
      <p><strong>Note:</strong> Transactions are processed on the blockchain and may take a few moments to confirm.</p>
    `,
  },
  {
    id: "escrow",
    title: "How does payment escrow work?",
    content: `
      <p>Escrow protects both customers and stylists:</p>
      <ul>
        <li><strong>When you book:</strong> Your payment is held securely in escrow</li>
        <li><strong>During service:</strong> Funds remain protected</li>
        <li><strong>After completion:</strong> You confirm the service, releasing payment to the stylist</li>
        <li><strong>Auto-release:</strong> If you don't confirm within 48 hours, payment is automatically released</li>
      </ul>
      <p>If there's a dispute, funds remain in escrow until resolved.</p>
    `,
  },
  {
    id: "refunds",
    title: "How do refunds work?",
    content: `
      <p>Refunds are processed in the following situations:</p>
      <ul>
        <li><strong>Cancellation:</strong> Based on our cancellation policy (24+ hours = full refund)</li>
        <li><strong>Stylist cancels:</strong> Automatic full refund</li>
        <li><strong>No-show:</strong> Full refund when reported</li>
        <li><strong>Dispute resolved in your favor:</strong> Full or partial refund</li>
      </ul>
      <p>Refunds are credited back to your Vlossom wallet immediately.</p>
    `,
  },
  {
    id: "withdraw",
    title: "How to withdraw funds",
    content: `
      <p>To withdraw funds from your Vlossom wallet:</p>
      <ol>
        <li>Go to your <strong>Wallet</strong> page</li>
        <li>Tap <strong>Withdraw</strong></li>
        <li>Enter your external wallet address</li>
        <li>Enter the amount to withdraw</li>
        <li>Review fees and confirm</li>
      </ol>
      <p>Withdrawals are processed on the blockchain and typically complete within a few minutes.</p>
    `,
  },
  {
    id: "transaction-history",
    title: "Where can I see my transaction history?",
    content: `
      <p>Your transaction history is available on the Wallet page:</p>
      <ul>
        <li>Scroll down to see recent transactions</li>
        <li>Each transaction shows the type, amount, and date</li>
        <li>Tap any transaction to see details</li>
        <li>Use the "View on BaseScan" link to see blockchain confirmation</li>
      </ul>
    `,
  },
];

export default function WalletHelpPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-rose/5 border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/help"
            className="inline-flex items-center gap-1 text-sm text-brand-rose hover:text-brand-clay transition-gentle mb-4"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Help Center
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-brand-rose" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-text-primary">
                Wallet & Payments
              </h1>
              <p className="text-text-secondary">
                Managing your wallet, payments, and refunds
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
                <ChevronRight className="w-5 h-5 text-text-muted transition-transform group-open:rotate-90" />
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
