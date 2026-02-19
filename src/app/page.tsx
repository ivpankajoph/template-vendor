import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Vendor Template App</h1>
      <p className="mt-3 text-sm text-gray-600">
        Yeh app sirf vendor template storefront routes serve karta hai.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Open path format: <code>/template/&lt;vendor_id&gt;</code>
      </p>
      <Link
        href="/template"
        className="mt-6 rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        Template Routes
      </Link>
    </main>
  );
}

