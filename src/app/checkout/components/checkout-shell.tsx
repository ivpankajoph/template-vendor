"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import PromotionalBanner from "@/components/promotional-banner";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer";

import type { CheckoutStep } from "./checkout-utils";

const STEP_LINKS: Array<{ id: CheckoutStep; label: string; href: string }> = [
  { id: "bag", label: "BAG", href: "/checkout/bag" },
  { id: "address", label: "ADDRESS", href: "/checkout/address" },
  { id: "payment", label: "PAYMENT", href: "/checkout/payment" },
];

const getStepClassName = (activeStep: CheckoutStep, step: CheckoutStep) => {
  if (activeStep === step) return "text-[#03a685]";
  return "text-slate-500";
};

type CheckoutShellProps = {
  activeStep: CheckoutStep;
  children: ReactNode;
};

export default function CheckoutShell({
  activeStep,
  children,
}: CheckoutShellProps) {
  return (
    <>
      <PromotionalBanner />
      <Navbar />
      <div className="min-h-screen bg-[#f5f5f6] pb-10">
        <div className="border-y border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-xs font-semibold tracking-[0.35em] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 sm:gap-5">
              {STEP_LINKS.map((step, index) => (
                <div key={step.id} className="flex items-center gap-3 sm:gap-5">
                  <Link
                    href={step.href}
                    className={getStepClassName(activeStep, step.id)}
                  >
                    {step.label}
                  </Link>
                  {index < STEP_LINKS.length - 1 ? (
                    <span className="h-px w-10 bg-slate-300 sm:w-16" />
                  ) : null}
                </div>
              ))}
            </div>
            <div className="text-[11px] tracking-[0.28em] text-[#03a685]">
              100% SECURE
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
      <Footer />
    </>
  );
}
