# Zantara API

Unified Handler-based Express API with TypeScript and Zod.

## Quick start

- Development

```bash
npm install
npm run dev
```

- Build & run

```bash
npm run build
npm start
```

## Docker

Build the image locally and run:

```bash
# Build
docker build -t zantara:latest .

# Run
docker run --rm -p 3000:3000 -e PORT=3000 zantara:latest

# Health check
curl http://localhost:3000/health
```

## GitHub Container Registry (GHCR)

This repo includes a GitHub Actions workflow to build and publish a Docker image on pushes to `main`.

- Image name: `ghcr.io/<owner>/<repo>:latest` and `:sha`
- No extra secrets are needed; `GITHUB_TOKEN` is used for pushing to GHCR.

After the first run, ensure the package visibility is set as needed in GitHub Packages.

## Deploying the image

You can run the published image on any container platform (Render, Fly.io, DigitalOcean, k8s, ECS, etc.). Example with Docker:

```bash
docker run -d -p 3000:3000 ghcr.io/<owner>/<repo>:latest
```

Set environment variables as needed:
- `PORT` (default 3000)

## Benchmarks

Run the built-in benchmark (autocannon) against `/health`:

```bash
npm run bench
```

