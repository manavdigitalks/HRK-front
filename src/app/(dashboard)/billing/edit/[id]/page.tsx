import { BillingForm } from "@/app/components/billing-form";

export default function EditBillingPage({ params }: { params: { id: string } }) {
  return <BillingForm id={params.id} />;
}
