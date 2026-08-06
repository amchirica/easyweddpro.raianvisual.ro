"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  PaymentFormDialog,
  type PaymentFormOption,
} from "@/components/payments/payment-form-dialog";

type NewPaymentDialogPageProps = {
  clients: PaymentFormOption[];
  contracts: PaymentFormOption[];
  projects: PaymentFormOption[];
  defaultCurrency: string;
};

export function NewPaymentDialogPage({
  clients,
  contracts,
  projects,
  defaultCurrency,
}: NewPaymentDialogPageProps) {
  const [open, setOpen] = useState(true);
  const router = useRouter();

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) router.push("/dashboard/payments");
  }

  return (
    <PaymentFormDialog
      open={open}
      onOpenChange={handleOpenChange}
      mode="create"
      clients={clients}
      contracts={contracts}
      projects={projects}
      defaultCurrency={defaultCurrency}
      onSuccess={() => router.push("/dashboard/payments")}
    />
  );
}
