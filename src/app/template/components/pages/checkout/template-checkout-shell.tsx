"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

import type { TemplateCheckoutStep } from "./template-checkout-utils";

const getStepClassName = (
  activeStep: TemplateCheckoutStep,
  step: TemplateCheckoutStep,
  activeClass: string,
  idleClass: string,
) => (activeStep === step ? activeClass : idleClass);

type TemplateCheckoutShellProps = {
  vendorId: string;
  activeStep: TemplateCheckoutStep;
  children: ReactNode;
};

export default function TemplateCheckoutShell({
  vendorId,
  activeStep,
  children,
}: TemplateCheckoutShellProps) {
  const variant = useTemplateVariant();
  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const shellClass = isStudio
    ? "bg-slate-950 text-slate-100"
    : isMinimal
      ? "bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "bg-rose-50/60 text-slate-900"
        : "bg-[#f5f5f6] text-slate-900";
  const topRailClass = isStudio
    ? "border-y border-slate-800 bg-slate-900"
    : isTrend
      ? "border-y border-rose-200 bg-white"
      : "border-y border-slate-200 bg-white";
  const secureClass = isStudio ? "text-sky-300" : isTrend ? "text-rose-600" : "text-[#03a685]";
  const stepActiveClass = isStudio
    ? "text-sky-300"
    : isTrend
      ? "text-rose-600"
      : "text-[#03a685]";
  const stepIdleClass = isStudio ? "text-slate-500" : "text-slate-500";

  const steps: Array<{
    id: TemplateCheckoutStep;
    label: string;
    href: string;
  }> = [
    { id: "bag", label: "BAG", href: `/template/${vendorId}/checkout/bag` },
    {
      id: "address",
      label: "ADDRESS",
      href: `/template/${vendorId}/checkout/address`,
    },
    {
      id: "payment",
      label: "PAYMENT",
      href: `/template/${vendorId}/checkout/payment`,
    },
  ];

  return (
    <div className={`template-checkout-shell ${shellClass}`}>
      <div className={topRailClass}>
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-xs font-semibold tracking-[0.35em] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-5">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-3 sm:gap-5">
                <Link href={step.href} className={getStepClassName(activeStep, step.id, stepActiveClass, stepIdleClass)}>
                  {step.label}
                </Link>
                {index < steps.length - 1 ? (
                  <span className="h-px w-10 bg-slate-300 sm:w-16" />
                ) : null}
              </div>
            ))}
          </div>
          <div className={`text-[11px] tracking-[0.28em] ${secureClass}`}>
            100% SECURE
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
