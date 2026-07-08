import { WhiteLensHub } from "@/components/white/white-lens-hub";

type WhiteProductLinePageProps = {
  params: Promise<{ lensType: string; line: string }>;
};

export default async function WhiteProductLinePage({ params }: WhiteProductLinePageProps) {
  const { lensType, line } = await params;
  return <WhiteLensHub lensType={lensType} line={line} />;
}
