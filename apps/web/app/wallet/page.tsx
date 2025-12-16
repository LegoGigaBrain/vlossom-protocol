"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useAuth } from "../../hooks/use-auth";
import { useWallet } from "../../hooks/use-wallet";
import { useTransactions } from "../../hooks/use-transactions";
import { Button } from "../../components/ui/button";
import { CopyButton } from "../../components/ui/copy-button";
import { BalanceCard } from "../../components/wallet/balance-card";
import { TransactionList } from "../../components/wallet/transaction-list";
import { claimFaucet } from "../../lib/wallet-client";

// Lazy load dialogs - only loaded when opened
const SendDialog = dynamic(
  () => import("../../components/wallet/send-dialog").then(mod => ({ default: mod.SendDialog })),
  { ssr: false }
);
const ReceiveDialog = dynamic(
  () => import("../../components/wallet/receive-dialog").then(mod => ({ default: mod.ReceiveDialog })),
  { ssr: false }
);
const AddMoneyDialog = dynamic(
  () => import("../../components/wallet/add-money-dialog").then(mod => ({ default: mod.AddMoneyDialog })),
  { ssr: false }
);
const WithdrawDialog = dynamic(
  () => import("../../components/wallet/withdraw-dialog").then(mod => ({ default: mod.WithdrawDialog })),
  { ssr: false }
);

export default function WalletPage() {
  const { user, logout } = useAuth();
  const { data: wallet, isLoading, refetch } = useWallet();
  const { data: transactionsData, isLoading: txLoading } = useTransactions();
  const [claiming, setClaiming] = useState(false);
  const [faucetMessage, setFaucetMessage] = useState<string | null>(null);
  const [faucetError, setFaucetError] = useState<string | null>(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [addMoneyDialogOpen, setAddMoneyDialogOpen] = useState(false);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);

  const handleClaimFaucet = async () => {
    setClaiming(true);
    setFaucetMessage(null);
    setFaucetError(null);

    const result = await claimFaucet();

    if (result.success) {
      setFaucetMessage(result.message || "Successfully claimed 1000 USDC!");
      await refetch(); // Refresh balance
    } else {
      setFaucetError(result.error || "Failed to claim faucet");
    }

    setClaiming(false);
  };

  return (
    <div className="min-h-screen bg-background-secondary p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-h1 text-brand-rose">Wallet</h1>
            <p className="text-body text-text-secondary">
              Welcome, {user?.displayName || user?.email}
            </p>
          </div>
          <Button variant="ghost" onClick={logout}>
            Log Out
          </Button>
        </div>

        {/* Balance Card */}
        {wallet && (
          <BalanceCard balance={wallet.balance} isLoading={isLoading} />
        )}

        {/* Wallet Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => setAddMoneyDialogOpen(true)}
            className="flex-1 bg-brand-rose text-background-primary hover:bg-brand-rose/90"
          >
            Fund
          </Button>
          <Button
            onClick={() => setSendDialogOpen(true)}
            className="flex-1"
          >
            Send
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setReceiveDialogOpen(true)}
          >
            Receive
          </Button>
          <Button
            onClick={() => setWithdrawDialogOpen(true)}
            className="flex-1"
          >
            Withdraw
          </Button>
        </div>

        <AddMoneyDialog
          open={addMoneyDialogOpen}
          onOpenChange={setAddMoneyDialogOpen}
        />
        <SendDialog open={sendDialogOpen} onOpenChange={setSendDialogOpen} />
        {user?.walletAddress && (
          <ReceiveDialog
            open={receiveDialogOpen}
            onOpenChange={setReceiveDialogOpen}
            walletAddress={user.walletAddress}
          />
        )}
        <WithdrawDialog
          open={withdrawDialogOpen}
          onOpenChange={setWithdrawDialogOpen}
        />

        {/* Faucet Button (Testnet Only) */}
        <div className="bg-background-primary rounded-card shadow-vlossom p-6">
          <p className="text-caption text-text-secondary mb-2">
            Testnet Faucet
          </p>
          <p className="text-body text-text-tertiary mb-4">
            Get free test USDC to try out the platform (1000 USDC per 24 hours)
          </p>
          <Button
            onClick={handleClaimFaucet}
            disabled={claiming}
            className="w-full bg-brand-rose text-background-primary hover:bg-brand-rose/90"
          >
            {claiming ? "Claiming..." : "Get Test USDC"}
          </Button>

          {/* Success Message */}
          {faucetMessage && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-caption text-green-800 dark:text-green-200">{faucetMessage}</p>
            </div>
          )}

          {/* Error Message */}
          {faucetError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-caption text-red-800 dark:text-red-200">{faucetError}</p>
            </div>
          )}
        </div>

        {/* Wallet Address */}
        <div className="bg-background-primary rounded-card shadow-vlossom p-6">
          <p className="text-caption text-text-secondary mb-2">Wallet Address</p>
          <div className="flex items-center gap-2">
            <p className="text-body text-text-primary font-mono break-all flex-1">
              {user?.walletAddress}
            </p>
            {user?.walletAddress && (
              <CopyButton
                textToCopy={user.walletAddress}
                successMessage="Wallet address copied!"
                variant="ghost"
                size="icon"
                className="shrink-0"
              />
            )}
          </div>
          <p className="text-caption text-text-tertiary mt-2">
            {wallet?.isDeployed ? "Deployed" : "Not yet deployed (counterfactual)"}
          </p>
        </div>

        {/* Transaction History */}
        {transactionsData && (
          <TransactionList
            transactions={transactionsData.transactions}
            hasMore={transactionsData.hasMore}
            isLoading={txLoading}
          />
        )}
      </div>
    </div>
  );
}
