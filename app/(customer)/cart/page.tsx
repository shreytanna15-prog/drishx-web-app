import { ComingSoonScreen } from "@/components/dashboard/coming-soon";
import { getNavItemByHref } from "@/lib/dashboard-nav";

export default function CartPage() {
  const item = getNavItemByHref("/cart");
  if (!item) return null;
  return <ComingSoonScreen item={item} />;
}
