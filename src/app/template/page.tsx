export default function TemplateIndexPage() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Template Route Required</h1>
      <p className="mt-3 text-sm text-gray-600">
        Vendor storefront dekhne ke liye URL me vendor id pass karo:
      </p>
      <p className="mt-2 rounded-md bg-gray-100 px-3 py-2 text-sm font-medium">
        /template/&lt;vendor_id&gt;
      </p>
    </main>
  );
}

