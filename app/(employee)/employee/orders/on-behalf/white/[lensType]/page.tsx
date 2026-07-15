import { WhiteLensHub } from "@/components/white/white-lens-hub";

type PageProps = {
  params: Promise<{ lensType: string }>;
};

export default async function Page({ params }: PageProps) {
  const { lensType } = await params;
  return <WhiteLensHub lensType={lensType} />;
}
