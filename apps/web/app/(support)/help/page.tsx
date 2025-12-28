"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/input";
import { Icon, type IconName } from "@/components/icons";

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  href: string;
  articles: number;
}

const categories: HelpCategory[] = [
  {
    id: "bookings",
    title: "Bookings & Appointments",
    description: "How to book, reschedule, or cancel appointments",
    icon: "calendar",
    href: "/help/bookings",
    articles: 8,
  },
  {
    id: "wallet",
    title: "Wallet & Payments",
    description: "Managing your wallet, payments, and refunds",
    icon: "wallet",
    href: "/help/wallet",
    articles: 6,
  },
  {
    id: "stylists",
    title: "Finding Stylists",
    description: "Discovering and choosing the right stylist",
    icon: "profile",
    href: "/help/stylists",
    articles: 5,
  },
  {
    id: "security",
    title: "Account & Security",
    description: "Login, passwords, and account settings",
    icon: "trusted",
    href: "/help/security",
    articles: 7,
  },
];

const popularArticles = [
  {
    title: "How do I book an appointment?",
    href: "/help/bookings#how-to-book",
  },
  {
    title: "How to add funds to my wallet",
    href: "/help/wallet#add-funds",
  },
  {
    title: "What happens if my stylist cancels?",
    href: "/help/bookings#cancellation-policy",
  },
  {
    title: "How do I leave a review?",
    href: "/help/stylists#reviews",
  },
  {
    title: "How to reset my password",
    href: "/help/security#reset-password",
  },
];

export default function HelpCenterPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/help/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-brand-rose/5 border-b border-border-default">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-rose/10 flex items-center justify-center">
            <Icon name="info" size="lg" className="text-brand-rose" />
          </div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">
            How can we help you?
          </h1>
          <p className="text-text-secondary mb-6">
            Search our help center or browse categories below
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="relative">
              <Icon name="search" size="md" className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help..."
                className="pl-12 py-3 text-lg"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
        {/* Categories */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Browse by category
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {categories.map((category) => {
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className="flex items-start gap-4 p-4 bg-background-secondary rounded-card hover:bg-background-tertiary transition-gentle group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center shrink-0">
                    <Icon name={category.icon} size="lg" className="text-brand-rose" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-text-primary group-hover:text-brand-rose transition-gentle">
                      {category.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                      {category.description}
                    </p>
                    <p className="text-xs text-text-muted mt-2">
                      {category.articles} articles
                    </p>
                  </div>
                  <Icon name="chevronRight" size="md" className="text-text-muted group-hover:text-brand-rose transition-gentle" />
                </Link>
              );
            })}
          </div>
        </section>

        {/* Popular Articles */}
        <section>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Popular articles
          </h2>
          <div className="bg-background-secondary rounded-card divide-y divide-border-default">
            {popularArticles.map((article, idx) => (
              <Link
                key={idx}
                href={article.href}
                className="flex items-center justify-between p-4 hover:bg-background-tertiary transition-gentle group"
              >
                <span className="text-text-primary group-hover:text-brand-rose transition-gentle">
                  {article.title}
                </span>
                <Icon name="chevronRight" size="md" className="text-text-muted group-hover:text-brand-rose transition-gentle" />
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="text-center bg-background-tertiary rounded-card p-8">
          <Icon name="chat" size="xl" className="text-brand-rose mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">
            Still need help?
          </h2>
          <p className="text-text-secondary mb-4">
            Our support team is available to assist you
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-2 bg-brand-rose text-white rounded-lg hover:bg-brand-clay transition-gentle"
          >
            Contact Support
            <Icon name="chevronRight" size="sm" />
          </Link>
        </section>
      </div>
    </div>
  );
}
