import { WhiteCatalogProductPage } from "@/components/white/white-catalog-product-page";

type WhiteProductPageProps = {
  searchParams: Promise<{ line?: string; variant?: string }>;
};

export default async function WhiteProductPage({ searchParams }: WhiteProductPageProps) {
  const params = await searchParams;
  return <WhiteCatalogProductPage line={params.line} variant={params.variant} />;
}
