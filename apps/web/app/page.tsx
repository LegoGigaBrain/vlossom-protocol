import Link from "next/link";
import { Button } from "../components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background-secondary">
      <div className="text-center space-y-6 px-4">
        <h1 className="text-h1 text-brand-rose">
          Vlossom
        </h1>
        <p className="text-body text-text-secondary">
          Where you blossom.
        </p>
        <p className="text-caption text-text-muted">
          V7.4.0 - Base Sepolia Testnet
        </p>

        <div className="flex gap-4 justify-center mt-8">
          <Link href="/onboarding">
            <Button variant="primary">Get Started</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline">Log In</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
