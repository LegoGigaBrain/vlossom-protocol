/**
 * Settings - Advanced Page
 * V3.4: Web3 mode and developer options
 */

"use client";

import { useState, useEffect } from "react";
import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { Skeleton } from "../../../components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Switch } from "../../../components/ui/switch";
import { toast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { Icon } from "@/components/icons";

export default function AdvancedSettingsPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-56 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return <AdvancedSettingsContent />;
}

function AdvancedSettingsContent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const [web3Mode, setWeb3Mode] = useState(false);
  const [devMode, setDevMode] = useState(false);
  const [showTestnets, setShowTestnets] = useState(true);
  const [copied, setCopied] = useState(false);
  const [storageSize, setStorageSize] = useState(0);

  // Calculate storage size
  const calculateStorageSize = () => {
    try {
      let total = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          total += localStorage.getItem(key)?.length || 0;
        }
      }
      return total;
    } catch {
      return 0;
    }
  };

  // Load preferences (only on client)
  useEffect(() => {
    const saved = localStorage.getItem("vlossom_advanced");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setWeb3Mode(parsed.web3Mode ?? false);
        setDevMode(parsed.devMode ?? false);
        setShowTestnets(parsed.showTestnets ?? true);
      } catch {
        // Use defaults
      }
    }
    setStorageSize(calculateStorageSize());
  }, []);

  // Save preferences
  const savePreferences = () => {
    if (typeof window === "undefined") return;
    localStorage.setItem(
      "vlossom_advanced",
      JSON.stringify({ web3Mode, devMode, showTestnets })
    );
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSwitchNetwork = () => {
    try {
      // Switch to Base Sepolia (84532)
      switchChain({ chainId: 84532 });
      toast.success("Network switch requested", "Please confirm in your wallet.");
    } catch (error) {
      toast.error("Network switch failed", "Please try again.");
    }
  };

  const getNetworkName = (id: number) => {
    switch (id) {
      case 1:
        return "Ethereum Mainnet";
      case 8453:
        return "Base";
      case 84532:
        return "Base Sepolia";
      case 11155111:
        return "Sepolia";
      default:
        return `Chain ${id}`;
    }
  };

  const clearLocalStorage = () => {
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("vlossom_"));
    keys.forEach((k) => localStorage.removeItem(k));
    toast.success("Cache cleared", `Cleared ${keys.length} cached items.`);
  };

  return (
    <div className="space-y-6">
      {/* Web3 Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="wallet" />
            Web3 Mode
            <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-700 rounded-full">
              Beta
            </span>
          </CardTitle>
          <CardDescription>
            Advanced wallet controls for experienced users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Web3 Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">Enable Web3 Mode</p>
              <p className="text-sm text-text-secondary">
                Access raw transaction signing and contract interactions
              </p>
            </div>
            <Switch
              checked={web3Mode}
              onCheckedChange={(checked) => {
                setWeb3Mode(checked);
                savePreferences();
                toast.info(
                  checked ? "Web3 Mode enabled" : "Web3 Mode disabled",
                  checked
                    ? "You now have access to advanced Web3 features."
                    : "Switched back to simplified mode."
                );
              }}
            />
          </div>

          {web3Mode && (
            <>
              {/* Wallet Connection Status */}
              <div className="p-4 rounded-lg border border-border-default">
                <h4 className="font-medium text-sm mb-3">Wallet Status</h4>
                {isConnected ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono bg-background-tertiary px-2 py-1 rounded">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={copyAddress}
                          className="h-8 w-8 p-0"
                        >
                          {copied ? (
                            <Icon name="check" size="sm" className="text-status-success" />
                          ) : (
                            <Icon name="copy" size="sm" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-secondary">Network</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            chainId === 84532
                              ? "bg-status-success"
                              : "bg-status-warning"
                          )}
                        />
                        <span className="text-sm">{getNetworkName(chainId)}</span>
                      </div>
                    </div>
                    {chainId !== 84532 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={handleSwitchNetwork}
                        loading={isSwitchingChain}
                      >
                        <Icon name="web" size="sm" className="mr-2" />
                        Switch to Base Sepolia
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">No wallet connected</p>
                )}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`https://sepolia.basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="link" size="sm" className="mr-2" />
                    View on Explorer
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a
                    href="https://www.alchemy.com/faucets/base-sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Icon name="energy" size="sm" className="mr-2" />
                    Get Test ETH
                  </a>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Developer Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="settings" />
            Developer Options
          </CardTitle>
          <CardDescription>
            Options for testing and debugging
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Dev Mode Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">Developer Mode</p>
              <p className="text-sm text-text-secondary">
                Show debug information and console logs
              </p>
            </div>
            <Switch
              checked={devMode}
              onCheckedChange={(checked) => {
                setDevMode(checked);
                savePreferences();
              }}
            />
          </div>

          {/* Show Testnets Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">Show Testnets</p>
              <p className="text-sm text-text-secondary">
                Display testnet options in network selector
              </p>
            </div>
            <Switch
              checked={showTestnets}
              onCheckedChange={(checked) => {
                setShowTestnets(checked);
                savePreferences();
              }}
            />
          </div>

          {devMode && (
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="flex items-start gap-3">
                <Icon name="info" className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Developer Mode Active
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Debug logs are now visible in the browser console. Performance may be affected.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cache & Storage */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="settings" />
            Cache & Storage
          </CardTitle>
          <CardDescription>
            Manage local data and cache
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Info */}
          <div className="p-4 rounded-lg bg-background-secondary">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Local Storage</span>
              <span className="text-sm text-text-secondary">
                ~{Math.round(storageSize / 1024)} KB used
              </span>
            </div>
            <div className="w-full bg-background-tertiary rounded-full h-2">
              <div
                className="bg-brand-rose h-2 rounded-full"
                style={{
                  width: `${Math.min(
                    (storageSize / (5 * 1024 * 1024)) * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Clear Cache */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-background-secondary">
            <div>
              <p className="font-medium">Clear App Cache</p>
              <p className="text-sm text-text-secondary">
                Remove locally stored preferences and data
              </p>
            </div>
            <Button variant="outline" onClick={clearLocalStorage}>
              <Icon name="delete" size="sm" className="mr-2" />
              Clear cache
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* API Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API & Version</CardTitle>
          <CardDescription>
            Technical information about the app
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-text-secondary">App Version</span>
              <span className="font-mono">v3.4.0-beta</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-text-secondary">API Version</span>
              <span className="font-mono">v1</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border-subtle">
              <span className="text-text-secondary">Network</span>
              <span className="font-mono">Base Sepolia (Testnet)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-text-secondary">Smart Contracts</span>
              <a
                href="https://sepolia.basescan.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-rose hover:underline flex items-center gap-1"
              >
                View on BaseScan
                <Icon name="link" size="sm" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-status-error/30">
        <CardHeader>
          <CardTitle className="text-lg text-status-error flex items-center gap-2">
            <Icon name="calmError" />
            Reset Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg bg-status-error/5 border border-status-error/20">
            <div>
              <p className="font-medium">Reset all settings</p>
              <p className="text-sm text-text-secondary">
                Restore all settings to their default values
              </p>
            </div>
            <Button
              variant="destructive-outline"
              size="sm"
              onClick={() => {
                if (confirm("Are you sure you want to reset all settings?")) {
                  localStorage.clear();
                  window.location.reload();
                }
              }}
            >
              Reset all
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
