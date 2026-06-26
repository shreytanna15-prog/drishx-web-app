import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CartProvider } from "@/contexts/cart-context";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <DashboardShell>{children}</DashboardShell>
    </CartProvider>
  );
}
