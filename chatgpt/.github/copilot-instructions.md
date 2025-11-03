# Zantara Project - AI Coding Agent Instructions

## Project Overview
This is a TypeScript Express.js API project named "Zantara" with ESM modules, strict type checking, and Zod validation. The project emphasizes type safety, modern JavaScript features, and performance monitoring.

## Architecture & Key Patterns

### Project Structure
- `src/` - Main TypeScript source code (entry point: `src/server.ts`)
- `scripts/` - Utility scripts (includes route migration tools)
- `benchmarks/` - Performance testing with autocannon
- `dist/` - Compiled JavaScript output
- `docs/` - Project documentation

### Technology Stack
- **Runtime**: Node.js >=20.0.0 with ESM modules
- **Framework**: Express.js with TypeScript
- **Validation**: Zod schemas for request/response validation
- **Testing**: Vitest with Supertest for API testing
- **Development**: tsx for hot reloading during development

## Development Workflows

### Essential Commands
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to dist/
npm run start        # Run production server from dist/
npm run test         # Run test suite with Vitest
npm run typecheck    # Type checking without compilation
npm run bench        # Run performance benchmarks
npm run migrate      # Execute route migration scripts
```

### Code Quality & Standards
- **Linting**: ESLint with TypeScript rules + Prettier integration
- **Formatting**: Prettier with 100 char width, single quotes, trailing commas
- **Type Safety**: Strict TypeScript with `noUncheckedIndexedAccess` enabled
- **Module System**: Pure ESM - all imports must use `.js` extensions in compiled output

## Critical Conventions

### TypeScript Configuration
- Target ES2022 with NodeNext module resolution
- Strict mode enabled with additional safety checks
- Include paths: `src`, `scripts`, `benchmarks`, `docs`
- Output directory: `dist/` with `src/` as root

### Validation Patterns
- Use Zod schemas for all request/response validation
- Leverage TypeScript integration for type inference from schemas
- Follow Express.js middleware patterns for validation

### Performance Considerations
- Benchmarking is built into the workflow (`npm run bench`)
- Use autocannon for load testing API endpoints
- Monitor performance impact of changes

## Key Integration Points

### Development Server
- Entry point: `src/server.ts`
- Hot reload via tsx watch mode
- Production build requires compilation step

### Testing Strategy
- Vitest for unit/integration tests
- Supertest for HTTP endpoint testing
- Type checking separate from test execution

### Migration & Scripts
- Custom migration tools in `scripts/migrate-routes.ts`
- Use tsx for running TypeScript scripts directly

## When Contributing
1. Ensure type safety - run `npm run typecheck` before committing
2. Follow ESLint rules - `npm run lint` for validation
3. Test your changes - `npm run test` for regression testing
4. Consider performance - use `npm run bench` for API changes
5. Use proper ESM imports with file extensions in source code