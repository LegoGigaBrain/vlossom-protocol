"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "../../../components/ui/input";
import {
  Search,
  Calendar,
  Wallet,
  User,
  Shield,
  MessageCircle,
  ChevronRight,
  HelpCircle,
} from "lucide-react";

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: typeof Calendar;
  href: string;
  articles: number;
}

const categories: HelpCategory[] = [
  {
    id: "bookings",
    title: "Bookings & Appointments",
    description: "How to book, reschedule, or cancel appointments",
    icon: Calendar,
    href: "/help/bookings",
    articles: 8,
  },
  {
    id: "wallet",
    title: "Wallet & Payments",
    description: "Managing your wallet, payments, and refunds",
    icon: Wallet,
    href: "/help/wallet",
    articles: 6,
  },
  {
    id: "stylists",
    title: "Finding Stylists",
    description: "Discovering and choosing the right stylist",
    icon: User,
    href: "/help/stylists",
    articles: 5,
  },
  {
    id: "security",
    title: "Account & Security",
    description: "Login, passwords, and account settings",
    icon: Shield,
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
            <HelpCircle className="w-8 h-8 text-brand-rose" />
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
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
              const Icon = category.icon;
              return (
                <Link
                  key={category.id}
                  href={category.href}
                  className="flex items-start gap-4 p-4 bg-background-secondary rounded-card hover:bg-background-tertiary transition-gentle group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-rose/10 flex items-center justify-center shrink-0">
                    <Icon className="w-6 h-6 text-brand-rose" />
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
                  <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-rose transition-gentle" />
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
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-brand-rose transition-gentle" />
              </Link>
            ))}
          </div>
        </section>

        {/* Contact Support */}
        <section className="text-center bg-background-tertiary rounded-card p-8">
          <MessageCircle className="w-10 h-10 text-brand-rose mx-auto mb-4" />
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
            <ChevronRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
