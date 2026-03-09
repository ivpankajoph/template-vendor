"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";

import { NEXT_PUBLIC_API_URL } from "@/config/variables";
import { toastError, toastSuccess } from "@/lib/toast";
import { getTemplateAuth } from "@/app/template/components/templateAuth";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  vendorId: string;
  productId: string;
  productName?: string;
  triggerClassName?: string;
  triggerContent?: ReactNode;
};

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  message: string;
};

const API_BASE =
  NEXT_PUBLIC_API_URL && NEXT_PUBLIC_API_URL.endsWith("/v1")
    ? NEXT_PUBLIC_API_URL
    : `${NEXT_PUBLIC_API_URL}/v1`;

const INITIAL_FORM: FormState = {
  fullName: "",
  email: "",
  phone: "",
  message: "",
};

export default function ProductEnquiryDialog({
  vendorId,
  productId,
  productName,
  triggerClassName,
  triggerContent,
}: Props) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  useEffect(() => {
    const auth = getTemplateAuth(vendorId);
    if (!auth?.user) return;

    setForm((current) => ({
      ...current,
      fullName: current.fullName || auth.user.name || "",
      email: current.email || auth.user.email || "",
      phone: current.phone || auth.user.phone || "",
    }));
  }, [vendorId]);

  const updateField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.fullName.trim() || !form.email.trim() || !form.message.trim()) {
      toastError("Name, email, and message are required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/support/queries/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: form.message.trim(),
          productId,
          source: "product_enquiry",
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message || "Failed to submit enquiry");
      }

      toastSuccess("Enquiry submitted successfully");
      setOpen(false);
      setForm((current) => ({
        ...INITIAL_FORM,
        fullName: current.fullName,
        email: current.email,
        phone: current.phone,
      }));
    } catch (error: any) {
      toastError(error?.message || "Failed to submit enquiry");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className={triggerClassName}>
          {triggerContent || "Send enquiry"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Send enquiry</DialogTitle>
          <DialogDescription>
            {productName
              ? `Share your requirement for ${productName}.`
              : "Share your requirement and the vendor will see it in the dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="enquiry-full-name">Full name</Label>
              <Input
                id="enquiry-full-name"
                value={form.fullName}
                onChange={(event) => updateField("fullName", event.target.value)}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enquiry-email">Email</Label>
              <Input
                id="enquiry-email"
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="enquiry-phone">Phone</Label>
            <Input
              id="enquiry-phone"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="Phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="enquiry-message">Message</Label>
            <Textarea
              id="enquiry-message"
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Tell the vendor what you need, quantity, timeline, or any questions."
              rows={5}
            />
          </div>

          <Button className="w-full" disabled={submitting} type="submit">
            {submitting ? "Submitting..." : "Submit enquiry"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
