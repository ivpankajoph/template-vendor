import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ vendor_id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { vendor_id } = await params;
  redirect(`/template/${vendor_id}/checkout/bag`);
}
