"use client";

import { useState } from "react";
import Image from "next/image";
import * as Dialog from "@radix-ui/react-dialog";
import { Icon } from "@/components/icons";
import { Button } from "../ui/button";
import { toast } from "../../hooks/use-toast";

interface ShareProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName: string;
  profileUrl: string;
  profileImage?: string | null;
}

export function ShareProfileDialog({
  open,
  onOpenChange,
  profileName,
  profileUrl,
  profileImage,
}: ShareProfileDialogProps) {
  const [copied, setCopied] = useState(false);

  const fullUrl = `${window.location.origin}${profileUrl}`;
  const shareText = `Check out ${profileName} on Vlossom!`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success("Link copied", "Profile link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Copy failed", "Please try again");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profileName} on Vlossom`,
          text: shareText,
          url: fullUrl,
        });
      } catch (error) {
        // User cancelled or share failed
        if ((error as Error).name !== "AbortError") {
          toast.error("Share failed", "Please try again");
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      shareText
    )}&url=${encodeURIComponent(fullUrl)}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      fullUrl
    )}`;
    window.open(facebookUrl, "_blank", "width=550,height=420");
  };

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `${shareText} ${fullUrl}`
    )}`;
    window.open(whatsappUrl, "_blank");
  };

  const initials = profileName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50 animate-fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-background-primary rounded-card shadow-elevated z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border-default">
            <Dialog.Title className="text-lg font-semibold text-text-primary">
              Share Profile
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                className="p-1 rounded-full hover:bg-background-tertiary transition-gentle"
                aria-label="Close"
              >
                <Icon name="close" size="sm" className="text-text-secondary" />
              </button>
            </Dialog.Close>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Profile Preview */}
            <div className="flex items-center gap-3 p-3 bg-background-tertiary rounded-lg">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-background-secondary shrink-0">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={profileName}
                    className="w-full h-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-text-secondary">
                    {initials}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-text-primary truncate">
                  {profileName}
                </p>
                <p className="text-xs text-text-muted truncate">{fullUrl}</p>
              </div>
            </div>

            {/* Copy Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Profile link
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-background-tertiary rounded-lg text-sm text-text-secondary truncate">
                  {fullUrl}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Icon name="success" size="sm" className="text-status-success" />
                  ) : (
                    <Icon name="copy" size="sm" />
                  )}
                </Button>
              </div>
            </div>

            {/* Share Options */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-primary">
                Share via
              </label>
              <div className="grid grid-cols-4 gap-2">
                {/* Native Share (if available) */}
                {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                  <button
                    onClick={handleNativeShare}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-gentle"
                  >
                    <div className="w-10 h-10 rounded-full bg-brand-rose/10 flex items-center justify-center">
                      <Icon name="share" size="sm" className="text-brand-rose" />
                    </div>
                    <span className="text-xs text-text-secondary">Share</span>
                  </button>
                )}

                {/* Twitter/X */}
                <button
                  onClick={handleTwitterShare}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-gentle"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1DA1F2]/10 flex items-center justify-center">
                    <Icon name="x" size="sm" weight="fill" className="text-[#1DA1F2]" />
                  </div>
                  <span className="text-xs text-text-secondary">Twitter</span>
                </button>

                {/* Facebook */}
                <button
                  onClick={handleFacebookShare}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-gentle"
                >
                  <div className="w-10 h-10 rounded-full bg-[#1877F2]/10 flex items-center justify-center">
                    <Icon name="facebook" size="sm" weight="fill" className="text-[#1877F2]" />
                  </div>
                  <span className="text-xs text-text-secondary">Facebook</span>
                </button>

                {/* WhatsApp */}
                <button
                  onClick={handleWhatsAppShare}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-background-tertiary hover:bg-background-secondary transition-gentle"
                >
                  <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center">
                    <Icon name="whatsapp" size="sm" weight="fill" className="text-[#25D366]" />
                  </div>
                  <span className="text-xs text-text-secondary">WhatsApp</span>
                </button>
              </div>
            </div>

            {/* Done Button */}
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Done
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
