export default function DomainNotConfiguredPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Domain Not Connected</h1>
      <p className="mt-3 text-sm text-gray-600">
        Yeh domain abhi kisi active vendor website se connect nahi hai.
      </p>
      <p className="mt-2 text-sm text-gray-600">
        Domain dashboard me save karo aur DNS A/CNAME records ko server par point karo.
      </p>
    </main>
  );
}
