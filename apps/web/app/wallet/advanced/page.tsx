/**
 * Wallet Advanced Page - Web3 details, wallet address, QR code, settings
 */

"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useVlossomWallet } from "../../../hooks/use-vlossom-wallet";
import { Button } from "../../../components/ui/button";
import { truncateAddress } from "../../../lib/wallet-client";

export default function WalletAdvancedPage() {
  const { walletAddress } = useVlossomWallet();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Network info (Base Sepolia for testnet)
  const networkInfo = {
    name: "Base Sepolia",
    chainId: 84532,
    currency: "ETH",
    rpcUrl: "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    usdcAddress: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  };

  return (
    <div className="space-y-6">
      {/* Wallet Address Section */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="wallet" size="sm" className="text-brand-rose" />
          <h2 className="text-h2 text-text-primary">Wallet Address</h2>
        </div>

        {walletAddress ? (
          <div className="space-y-4">
            {/* Full Address */}
            <div className="p-4 bg-background-secondary rounded-lg">
              <p className="text-caption text-text-tertiary mb-2">
                Your Smart Wallet Address
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-body text-text-primary font-mono break-all">
                  {walletAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(walletAddress)}
                  className="p-2 hover:bg-background-tertiary rounded-lg transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Icon name="check" size="sm" className="text-green-500" />
                  ) : (
                    <Icon name="copy" size="sm" className="text-text-tertiary" />
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowQR(!showQR)}
              >
                <Icon name="receipt" size="sm" className="mr-2" />
                {showQR ? "Hide" : "Show"} QR Code
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    `${networkInfo.explorerUrl}/address/${walletAddress}`,
                    "_blank"
                  )
                }
              >
                <Icon name="link" size="sm" className="mr-2" />
                View on Explorer
              </Button>
            </div>

            {/* QR Code Display */}
            {showQR && (
              <div className="flex flex-col items-center p-6 bg-white rounded-lg">
                <div className="w-48 h-48 bg-background-tertiary rounded-lg flex items-center justify-center mb-4">
                  {/* Placeholder for QR code - would use a QR library in production */}
                  <div className="text-center">
                    <Icon name="receipt" size="xl" className="text-text-tertiary mx-auto mb-2" />
                    <p className="text-caption text-text-tertiary">
                      QR Code for
                    </p>
                    <p className="text-caption text-text-secondary font-mono">
                      {truncateAddress(walletAddress)}
                    </p>
                  </div>
                </div>
                <p className="text-caption text-text-tertiary text-center">
                  Scan to receive USDC on Base Sepolia
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="wallet" size="xl" className="text-text-tertiary mx-auto mb-4" />
            <p className="text-body text-text-secondary">
              Wallet not connected
            </p>
          </div>
        )}
      </div>

      {/* Network Information */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="web" size="sm" className="text-brand-rose" />
          <h2 className="text-h2 text-text-primary">Network Information</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <span className="text-body text-text-secondary">Network</span>
            <span className="text-body text-text-primary font-medium">
              {networkInfo.name}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <span className="text-body text-text-secondary">Chain ID</span>
            <span className="text-body text-text-primary font-mono">
              {networkInfo.chainId}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <span className="text-body text-text-secondary">Native Currency</span>
            <span className="text-body text-text-primary">
              {networkInfo.currency}
            </span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-border-default">
            <span className="text-body text-text-secondary">USDC Contract</span>
            <div className="flex items-center gap-2">
              <span className="text-caption text-text-primary font-mono">
                {truncateAddress(networkInfo.usdcAddress)}
              </span>
              <button
                onClick={() => copyToClipboard(networkInfo.usdcAddress)}
                className="p-1 hover:bg-background-tertiary rounded transition-colors"
              >
                <Icon name="copy" size="sm" className="text-text-tertiary" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-body text-text-secondary">Block Explorer</span>
            <a
              href={networkInfo.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-rose hover:underline flex items-center gap-1"
            >
              BaseScan
              <Icon name="link" size="sm" />
            </a>
          </div>
        </div>
      </div>

      {/* Account Type */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="locked" size="sm" className="text-brand-rose" />
          <h2 className="text-h2 text-text-primary">Account Type</h2>
        </div>

        <div className="p-4 bg-background-secondary rounded-lg mb-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-brand-rose/10 rounded-lg">
              <Icon name="locked" size="sm" className="text-brand-rose" />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">
                Smart Wallet (Account Abstraction)
              </p>
              <p className="text-caption text-text-secondary mt-1">
                Your wallet uses ERC-4337 Account Abstraction for gasless
                transactions and enhanced security. No seed phrase required.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
            <Icon name="check" size="sm" className="text-green-500" />
            <span className="text-body text-text-secondary">
              Gasless transactions (sponsored by Vlossom)
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
            <Icon name="check" size="sm" className="text-green-500" />
            <span className="text-body text-text-secondary">
              Social recovery available
            </span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background-secondary rounded-lg">
            <Icon name="check" size="sm" className="text-green-500" />
            <span className="text-body text-text-secondary">
              Email-based authentication
            </span>
          </div>
        </div>
      </div>

      {/* Connected Apps (Placeholder) */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="link" size="sm" className="text-brand-rose" />
          <h2 className="text-h2 text-text-primary">Connected Apps</h2>
        </div>

        <div className="text-center py-8">
          <Icon name="link" size="xl" className="text-text-tertiary mx-auto mb-4" />
          <p className="text-body text-text-secondary mb-2">
            No external apps connected
          </p>
          <p className="text-caption text-text-tertiary">
            External wallet connections coming in future updates
          </p>
        </div>
      </div>

      {/* Developer Options */}
      <div className="bg-background-primary rounded-card shadow-vlossom p-6">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="info" size="sm" className="text-brand-rose" />
          <h2 className="text-h2 text-text-primary">Developer Options</h2>
        </div>

        <div className="space-y-3">
          <button
            disabled
            className="w-full flex items-center justify-between p-4 bg-background-secondary rounded-lg opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <span className="text-body text-text-primary">Web3 Mode</span>
              <span className="px-2 py-0.5 bg-brand-rose/10 text-brand-rose text-xs rounded-full">
                Coming Soon
              </span>
            </div>
            <Icon name="chevronRight" size="sm" className="text-text-tertiary" />
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between p-4 bg-background-secondary rounded-lg opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <span className="text-body text-text-primary">
                Export Wallet Data
              </span>
              <span className="px-2 py-0.5 bg-brand-rose/10 text-brand-rose text-xs rounded-full">
                Coming Soon
              </span>
            </div>
            <Icon name="chevronRight" size="sm" className="text-text-tertiary" />
          </button>

          <button
            disabled
            className="w-full flex items-center justify-between p-4 bg-background-secondary rounded-lg opacity-50 cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <span className="text-body text-text-primary">
                Import External Wallet
              </span>
              <span className="px-2 py-0.5 bg-brand-rose/10 text-brand-rose text-xs rounded-full">
                Coming Soon
              </span>
            </div>
            <Icon name="chevronRight" size="sm" className="text-text-tertiary" />
          </button>
        </div>
      </div>

      {/* Warning */}
      <div className="p-4 bg-status-warning/10 border border-status-warning/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon name="info" size="sm" className="text-status-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-body font-medium text-text-primary">
              Testnet Notice
            </p>
            <p className="text-caption text-text-secondary mt-1">
              This wallet is running on Base Sepolia testnet. All transactions
              and balances are for testing purposes only. Testnet tokens have no
              real value.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
