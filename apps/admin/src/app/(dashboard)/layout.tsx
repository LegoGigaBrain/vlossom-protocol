/**
 * Dashboard Layout (V7.0.0)
 *
 * Layout wrapper for authenticated admin pages.
 */

import { ReactNode } from "react";
import { AdminLayout } from "../../components/layout/admin-layout";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
