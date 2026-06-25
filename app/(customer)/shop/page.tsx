import { ComingSoonScreen } from "@/components/dashboard/coming-soon";
import { getNavItemByHref } from "@/lib/dashboard-nav";

export default function ShopPage() {
  const item = getNavItemByHref("/shop");
  if (!item) return null;
  return <ComingSoonScreen item={item} />;
}
