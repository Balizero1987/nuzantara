This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Testing

### Unit Tests

```bash
pnpm test           # Run tests
pnpm test:watch     # Run tests in watch mode
pnpm test:coverage  # Run tests with coverage
pnpm test:ci        # Run tests in CI mode
```

### E2E Tests

```bash
pnpm test:e2e           # Run all E2E tests
pnpm test:e2e:ui        # Run E2E tests with UI
pnpm test:e2e:headed    # Run E2E tests in headed mode
```

### Real Backend E2E Tests

Tests against the real Nuzantara backend (not mocked):

```bash
export NUZANTARA_API_URL=https://nuzantara-rag.fly.dev
export NUZANTARA_API_KEY=your-api-key
export E2E_TEST_EMAIL=test@balizero.com
export E2E_TEST_PIN=123456

pnpm test:e2e -- e2e/real-backend.spec.ts
```

## CI/CD Configuration

### Required GitHub Secrets for Real Backend Tests

Add these secrets to your GitHub repository (Settings > Secrets and variables > Actions):

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `NUZANTARA_API_URL` | Backend API URL | `https://nuzantara-rag.fly.dev` |
| `NUZANTARA_API_KEY` | API key for backend | `your-api-key` |
| `E2E_TEST_EMAIL` | Test user email | `test@balizero.com` |
| `E2E_TEST_PIN` | Test user PIN | `123456` |

### CI Workflow Jobs

The frontend CI pipeline (`frontend-tests.yml`) includes:

1. **unit-tests**: Runs TypeScript checks, linting, and unit tests with coverage
2. **build**: Builds the Next.js application
3. **e2e-tests-mocked**: Runs E2E tests with mocked backend
4. **e2e-tests-real-backend**: Runs E2E tests against the real backend
   - Only runs on `main` branch or PRs with `test-real-backend` label
   - Requires GitHub secrets to be configured
   - Includes backend health check before tests

### Triggering Real Backend Tests on PRs

To run real backend tests on a pull request, add the `test-real-backend` label to the PR.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
