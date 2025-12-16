"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConnect, useAccount, useDisconnect, useBalance, useSwitchChain } from "wagmi";
import {
  isTestnet,
  getCurrentChain,
  getExplorerAddressUrl,
  CHAIN_CONFIG,
  getSupportedChains,
} from "@/lib/wagmi-config";

interface ConnectWalletDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Step = "select-wallet" | "connecting" | "connected";

// Wallet icons
const WalletIcon = {
  MetaMask: () => (
    <svg className="w-8 h-8" viewBox="0 0 35 33" fill="none">
      <path d="M32.9582 1L19.8241 10.7183L22.2665 4.99099L32.9582 1Z" fill="#E17726" stroke="#E17726" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M2.66296 1L15.6886 10.809L13.3541 4.99098L2.66296 1Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M28.2295 23.5334L24.7346 28.872L32.2173 30.9323L34.3821 23.6501L28.2295 23.5334Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.2478 23.6501L3.40357 30.9323L10.8769 28.872L7.39096 23.5334L1.2478 23.6501Z" fill="#E27625" stroke="#E27625" strokeWidth="0.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  Coinbase: () => (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#0052FF"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6ZM13.5 13.5C13.5 13.224 13.724 13 14 13H18C18.276 13 18.5 13.224 18.5 13.5V18.5C18.5 18.776 18.276 19 18 19H14C13.724 19 13.5 18.776 13.5 18.5V13.5Z" fill="white"/>
    </svg>
  ),
  WalletConnect: () => (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill="#3B99FC"/>
      <path d="M10.5 12.5C13.5 9.5 18.5 9.5 21.5 12.5L22 13L24.5 10.5C20 6 12 6 7.5 10.5L10.5 12.5Z" fill="white"/>
      <path d="M25 14L22.5 16.5L25 19L27.5 16.5L25 14Z" fill="white"/>
      <path d="M7 14L9.5 16.5L7 19L4.5 16.5L7 14Z" fill="white"/>
      <path d="M10.5 19.5C13.5 22.5 18.5 22.5 21.5 19.5L24.5 22.5C20 27 12 27 7.5 22.5L10.5 19.5Z" fill="white"/>
    </svg>
  ),
};

export function ConnectWalletDialog({ open, onOpenChange }: ConnectWalletDialogProps) {
  const { connect, connectors, isPending, error } = useConnect();
  const { address, isConnected, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChain, chains } = useSwitchChain();
  const { data: balance } = useBalance({ address });

  const [step, setStep] = useState<Step>("select-wallet");
  const [connectingWallet, setConnectingWallet] = useState<string | null>(null);

  // Reset to initial state when dialog opens
  useEffect(() => {
    if (open) {
      setStep(isConnected ? "connected" : "select-wallet");
      setConnectingWallet(null);
    }
  }, [open, isConnected]);

  // Update step when connection changes
  useEffect(() => {
    if (isConnected && step === "connecting") {
      setStep("connected");
    }
  }, [isConnected, step]);

  const handleConnect = async (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) return;

    setConnectingWallet(connector.name);
    setStep("connecting");

    try {
      connect({ connector });
    } catch (err) {
      console.error("Connection error:", err);
      setStep("select-wallet");
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setStep("select-wallet");
  };

  const handleSwitchChain = (chainId: number) => {
    switchChain({ chainId });
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getConnectorIcon = (name: string) => {
    if (name.toLowerCase().includes("metamask")) return <WalletIcon.MetaMask />;
    if (name.toLowerCase().includes("coinbase")) return <WalletIcon.Coinbase />;
    if (name.toLowerCase().includes("walletconnect")) return <WalletIcon.WalletConnect />;
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-primary font-bold">{name[0]}</span>
      </div>
    );
  };

  const supportedChains = getSupportedChains();
  const currentChains = isTestnet() ? supportedChains.testnets : supportedChains.mainnets;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {step === "connected" ? "Wallet Connected" : "Connect Wallet"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-wallet" && "Choose a wallet to connect"}
            {step === "connecting" && `Connecting to ${connectingWallet}...`}
            {step === "connected" && "Manage your wallet connection"}
          </DialogDescription>
        </DialogHeader>

        {/* Testnet Warning */}
        {isTestnet() && step !== "connecting" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-700">
              <span className="font-medium">Testnet Mode</span> - Connected to {CHAIN_CONFIG.chainName}
            </p>
          </div>
        )}

        {/* Step 1: Select Wallet */}
        {step === "select-wallet" && (
          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector.id)}
                disabled={isPending}
                className="w-full p-4 rounded-lg border-2 border-border hover:border-primary transition-colors flex items-center gap-4"
              >
                {getConnectorIcon(connector.name)}
                <div className="flex-1 text-left">
                  <div className="font-medium">{connector.name}</div>
                  <div className="text-sm text-text-secondary">
                    {connector.name.includes("Injected") ? "Browser Wallet" : "Connect"}
                  </div>
                </div>
                <svg
                  className="w-5 h-5 text-text-secondary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Connecting */}
        {step === "connecting" && (
          <div className="py-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <p className="text-text-secondary">
              Please confirm the connection in your wallet
            </p>
            <Button
              variant="outline"
              onClick={() => setStep("select-wallet")}
              className="mt-4"
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Step 3: Connected */}
        {step === "connected" && address && (
          <div className="space-y-4">
            {/* Address & Balance */}
            <div className="p-4 bg-surface rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-text-secondary">Connected Address</span>
                <button
                  onClick={() => window.open(getExplorerAddressUrl(address), "_blank")}
                  className="text-xs text-primary hover:underline"
                >
                  View on Explorer
                </button>
              </div>
              <div className="font-mono text-lg">{truncateAddress(address)}</div>
              {balance && (
                <div className="mt-2 text-sm text-text-secondary">
                  Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                </div>
              )}
            </div>

            {/* Network Selector */}
            <div>
              <label className="block text-sm text-text-secondary mb-2">Network</label>
              <div className="grid grid-cols-2 gap-2">
                {currentChains.map((chainOption) => (
                  <button
                    key={chainOption.id}
                    onClick={() => handleSwitchChain(chainOption.chainId)}
                    className={`p-3 rounded-lg border-2 text-sm transition-colors ${
                      chain?.id === chainOption.chainId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {chainOption.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDisconnect}
                className="flex-1"
              >
                Disconnect
              </Button>
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ConnectWalletDialog;
