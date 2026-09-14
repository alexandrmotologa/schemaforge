# Contributing to SchemaForge

Contributions are welcome. Follow these steps to set up your environment, make changes, and submit code.

## Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/alexandrmotologa/schemaforge.git
   cd schemaforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Code Guidelines

- **TypeScript:** Keep strict type checking enabled. Avoid `any` types wherever possible.
- **Components:** Place React Flow nodes in `src/components/nodes/` and canvas edges in `src/components/edges/`.
- **Generators:** Generators live in `src/engine/generators/`. Every generator must accept `SchemaState` and return clean, syntactically correct code.
- **Tests:** Add unit tests in `src/__tests__/` for any parser changes or generator updates.

## Testing and Verification

Before opening a pull request, verify that tests pass and the production bundle builds cleanly:

```bash
npm test
npm run build
```
