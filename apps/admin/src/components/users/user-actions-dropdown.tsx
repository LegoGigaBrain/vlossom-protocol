/**
 * User Actions Dropdown (V7.0.0)
 *
 * Dropdown menu for user management actions.
 */

"use client";

import { useState } from "react";
import { ConfirmDialog } from "../ui/confirm-dialog";
import { useUpdateUser } from "../../hooks/use-users";
import type { User } from "../../lib/users-client";

interface UserActionsDropdownProps {
  user: User;
  onViewDetails: () => void;
}

export function UserActionsDropdown({ user, onViewDetails }: UserActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"freeze" | "unfreeze" | "verify" | null>(null);

  const updateUser = useUpdateUser();

  const isFrozen = user.verificationStatus === "REJECTED";
  const isVerified = user.verificationStatus === "VERIFIED";

  const handleAction = async () => {
    if (!confirmAction) return;

    try {
      if (confirmAction === "freeze") {
        await updateUser.mutateAsync({
          id: user.id,
          data: { verificationStatus: "REJECTED" },
        });
      } else if (confirmAction === "unfreeze") {
        await updateUser.mutateAsync({
          id: user.id,
          data: { verificationStatus: "PENDING" },
        });
      } else if (confirmAction === "verify") {
        await updateUser.mutateAsync({
          id: user.id,
          data: { verificationStatus: "VERIFIED" },
        });
      }
      setConfirmAction(null);
    } catch (error) {
      console.error("Failed to update user:", error);
    }
  };

  const getConfirmMessage = () => {
    switch (confirmAction) {
      case "freeze":
        return `This will freeze ${user.displayName || user.email}'s account. They will not be able to access the platform until unfrozen.`;
      case "unfreeze":
        return `This will unfreeze ${user.displayName || user.email}'s account, restoring their access to the platform.`;
      case "verify":
        return `This will verify ${user.displayName || user.email}'s account.`;
      default:
        return "";
    }
  };

  const getConfirmTitle = () => {
    switch (confirmAction) {
      case "freeze":
        return "Freeze Account";
      case "unfreeze":
        return "Unfreeze Account";
      case "verify":
        return "Verify Account";
      default:
        return "";
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown menu */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            <button
              onClick={() => {
                onViewDetails();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              View Details
            </button>

            <div className="border-t border-gray-100 my-1" />

            {!isVerified && (
              <button
                onClick={() => {
                  setConfirmAction("verify");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
              >
                Verify Account
              </button>
            )}

            {isFrozen ? (
              <button
                onClick={() => {
                  setConfirmAction("unfreeze");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50"
              >
                Unfreeze Account
              </button>
            ) : (
              <button
                onClick={() => {
                  setConfirmAction("freeze");
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Freeze Account
              </button>
            )}
          </div>
        </>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        isOpen={confirmAction !== null}
        title={getConfirmTitle()}
        message={getConfirmMessage()}
        confirmLabel={confirmAction === "freeze" ? "Freeze" : confirmAction === "unfreeze" ? "Unfreeze" : "Verify"}
        variant={confirmAction === "freeze" ? "danger" : confirmAction === "verify" ? "info" : "warning"}
        isLoading={updateUser.isPending}
        onConfirm={handleAction}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
