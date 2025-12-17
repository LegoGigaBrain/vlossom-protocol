/**
 * Search Page - Intentional Discovery (V5.0)
 *
 * Redirects to /stylists for now until full search experience is built.
 * Future: Following feed, advanced filters, saved searches
 */

import { redirect } from "next/navigation";

export default function SearchPage() {
  redirect("/stylists");
}
