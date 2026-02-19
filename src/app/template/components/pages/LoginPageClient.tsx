"use client";

import { useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { setTemplateAuth, templateApiFetch } from "@/app/template/components/templateAuth";
import { useTemplateVariant } from "@/app/template/components/useTemplateVariant";

export default function TemplateLoginPage() {
  const variant = useTemplateVariant();
  const params = useParams();
  const vendorId = params.vendor_id as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || `/template/${vendorId}`;

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isStudio = variant.key === "studio";
  const isMinimal =
    variant.key === "minimal" ||
    variant.key === "mquiq" ||
    variant.key === "poupqz" ||
    variant.key === "whiterose";
  const isTrend = variant.key === "trend" || variant.key === "oragze";
  const pageClass = isStudio
    ? "min-h-screen bg-slate-950 text-slate-100"
    : isMinimal
      ? "min-h-screen bg-[#f7f7f5] text-slate-900"
      : isTrend
        ? "min-h-screen bg-rose-50/50 text-slate-900"
        : "min-h-screen bg-gray-50";
  const cardClass = isStudio
    ? "template-surface-card w-full max-w-md rounded-md border border-slate-800 bg-slate-900/85 p-8 shadow-sm"
    : isTrend
      ? "template-surface-card w-full max-w-md rounded-[1.5rem] border border-rose-200 bg-white p-8 shadow-sm"
      : isMinimal
        ? "template-surface-card w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm"
        : "template-surface-card w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await templateApiFetch(vendorId, "/login", {
        method: "POST",
        body: JSON.stringify({
          vendor_id: vendorId,
          identifier,
          password,
        }),
      });
      setTemplateAuth(vendorId, { token: data.token, user: data.user });
      router.push(nextPath);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${pageClass} template-page-shell template-auth-page`}>
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className={cardClass}>
          <h1 className={isStudio ? "template-section-title text-3xl font-bold text-slate-100" : "template-section-title text-3xl font-bold text-slate-900"}>Sign in</h1>
          <p className={`mt-2 text-sm ${isStudio ? "text-slate-300" : "text-slate-500"}`}>
            Login to continue checkout in this store.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className={isStudio ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-700"}>
                Email or phone
              </label>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                className={`mt-2 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 template-focus-accent ${isStudio ? "border-slate-600 bg-slate-950 text-slate-100" : isTrend ? "border-rose-200 bg-white" : "border-slate-200"}`}
                placeholder="Enter email or phone"
                required
              />
            </div>
            <div>
              <label className={isStudio ? "text-sm font-medium text-slate-200" : "text-sm font-medium text-slate-700"}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`mt-2 w-full rounded-lg border px-4 py-3 text-sm focus:outline-none focus:ring-2 template-focus-accent ${isStudio ? "border-slate-600 bg-slate-950 text-slate-100" : isTrend ? "border-rose-200 bg-white" : "border-slate-200"}`}
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="template-primary-button w-full rounded-lg py-3 text-sm font-semibold text-white transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className={`mt-6 text-center text-sm ${isStudio ? "text-slate-300" : "text-slate-500"}`}>
            New here?{" "}
            <a
              href={`/template/${vendorId}/register`}
              className={isStudio ? "font-semibold text-slate-100 hover:underline" : "font-semibold text-slate-900 hover:underline"}
            >
              Create an account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
