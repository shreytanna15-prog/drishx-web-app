import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CartProvider } from "@/contexts/cart-context";
import { OrderModeProvider } from "@/contexts/order-mode-context";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrderModeProvider>
      <CartProvider>
        <DashboardShell>{children}</DashboardShell>
      </CartProvider>
    </OrderModeProvider>
  );
}
