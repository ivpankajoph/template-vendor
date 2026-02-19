This repository serves the vendor template storefront experience migrated from `ophmate-frontend`.

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3001](http://localhost:3001).

Template routes live under `src/app/template`.

## Notes

- `ophmate-frontend` now redirects `/template/*` traffic to this app using `NEXT_PUBLIC_VENDOR_TEMPLATE_URL`.
- Keep backend API URLs aligned with the same backend used by `ophmate-frontend`.
