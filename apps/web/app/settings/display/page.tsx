/**
 * Settings - Display Page
 * V3.4: Currency and appearance preferences
 */

"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { toast } from "../../../hooks/use-toast";
import { cn } from "../../../lib/utils";
import { Icon } from "@/components/icons";

// Currency options
const currencies = [
  { code: "ZAR", symbol: "R", name: "South African Rand", flag: "🇿🇦" },
  { code: "USD", symbol: "$", name: "US Dollar", flag: "🇺🇸" },
  { code: "USDC", symbol: "USDC", name: "USD Coin (Stablecoin)", flag: "💵" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling", flag: "🇰🇪" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", flag: "🇳🇬" },
  { code: "GHS", symbol: "₵", name: "Ghanaian Cedi", flag: "🇬🇭" },
];

// Theme options
const themes = [
  { id: "light", name: "Light", iconName: "active" as const, description: "Light background" },
  { id: "dark", name: "Dark", iconName: "rest" as const, description: "Dark background" },
  { id: "system", name: "System", iconName: "settings" as const, description: "Follow device" },
];

// Language options (for future)
const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "xh", name: "isiXhosa", flag: "🇿🇦" },
];

export default function DisplaySettingsPage() {
  const [currency, setCurrency] = useState("ZAR");
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [isSaving, setIsSaving] = useState(false);

  // Load preferences from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem("vlossom_currency");
    const savedTheme = localStorage.getItem("vlossom_theme");
    const savedLanguage = localStorage.getItem("vlossom_language");

    if (savedCurrency) setCurrency(savedCurrency);
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem("vlossom_currency", currency);
      localStorage.setItem("vlossom_theme", theme);
      localStorage.setItem("vlossom_language", language);

      // In a real app, also save to backend
      // await api.post("/settings/display", { currency, theme, language });

      toast.success("Settings saved", "Your display preferences have been updated.");
    } catch (error) {
      toast.error("Save failed", "Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="currency" />
            Display Currency
          </CardTitle>
          <CardDescription>
            Choose your preferred currency for displaying prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {currencies.map((curr) => (
              <button
                key={curr.code}
                onClick={() => setCurrency(curr.code)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  currency === curr.code
                    ? "border-brand-rose bg-brand-rose/5"
                    : "border-border-default hover:border-brand-rose/50"
                )}
              >
                <span className="text-2xl">{curr.flag}</span>
                <div className="flex-1">
                  <p className="font-medium">{curr.code}</p>
                  <p className="text-sm text-text-secondary">{curr.name}</p>
                </div>
                {currency === curr.code && (
                  <Icon name="check" className="text-brand-rose" />
                )}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Note: All transactions are processed in USDC. Display currency is for viewing only.
          </p>
        </CardContent>
      </Card>

      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="sparkle" />
            Theme
          </CardTitle>
          <CardDescription>
            Choose how Vlossom looks for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            {themes.map((t) => {
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
                    theme === t.id
                      ? "border-brand-rose bg-brand-rose/5"
                      : "border-border-default hover:border-brand-rose/50"
                  )}
                >
                  <Icon name={t.iconName} size="lg" />
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-text-secondary">{t.description}</p>
                  {theme === t.id && (
                    <Icon name="check" className="text-brand-rose" />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-text-muted">
            Theme customization coming in a future update.
          </p>
        </CardContent>
      </Card>

      {/* Language Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Icon name="web" />
            Language
          </CardTitle>
          <CardDescription>
            Choose your preferred language
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                  language === lang.code
                    ? "border-brand-rose bg-brand-rose/5"
                    : "border-border-default hover:border-brand-rose/50",
                  lang.code !== "en" && "opacity-50 cursor-not-allowed"
                )}
                disabled={lang.code !== "en"}
              >
                <span className="text-2xl">{lang.flag}</span>
                <div className="flex-1">
                  <p className="font-medium">{lang.name}</p>
                  {lang.code !== "en" && (
                    <p className="text-xs text-text-muted">Coming soon</p>
                  )}
                </div>
                {language === lang.code && (
                  <Icon name="check" className="text-brand-rose" />
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} loading={isSaving}>
          Save preferences
        </Button>
      </div>
    </div>
  );
}
