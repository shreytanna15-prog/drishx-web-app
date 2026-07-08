import { WhiteLensHub } from "@/components/white/white-lens-hub";

type WhiteLensTypePageProps = {
  params: Promise<{ lensType: string }>;
};

export default async function WhiteLensTypePage({ params }: WhiteLensTypePageProps) {
  const { lensType } = await params;
  return <WhiteLensHub lensType={lensType} />;
}
