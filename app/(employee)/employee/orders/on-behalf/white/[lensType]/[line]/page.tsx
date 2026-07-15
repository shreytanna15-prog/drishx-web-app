import { WhiteLensHub } from "@/components/white/white-lens-hub";

type PageProps = {
  params: Promise<{ lensType: string; line: string }>;
};

export default async function Page({ params }: PageProps) {
  const { lensType, line } = await params;
  return <WhiteLensHub lensType={lensType} line={line} />;
}
