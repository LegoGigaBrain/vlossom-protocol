# packages/config

**Version**: V7.0.0 | December 2025

> Purpose: Shared configuration presets for ESLint, TypeScript, and Tailwind CSS used across all apps and packages.

## Canonical References
- [Doc 23: Infrastructure and DevOps](../../docs/vlossom/23-infrastructure-devops.md)
- [LEGO OS: Context Files](../../docs/lego-agent-os/standards/docs/context-files.md)

## Key Files
- `eslint/index.js` — Shared ESLint rules
- `typescript/base.json` — Base TypeScript compiler options
- `tailwind/preset.js` — Vlossom design tokens and Tailwind preset

## Local Conventions
- All configs are exported as CommonJS for maximum tool compatibility
- Tailwind preset includes Vlossom color palette and typography
- ESLint extends recommended configs with project-specific rules
- TypeScript base config is extended by each package's tsconfig.json

## Dependencies
- Internal: None (this is a leaf package)
- External: eslint, typescript, tailwindcss

## Gotchas
- Tailwind preset must be imported in each app's tailwind.config.js
- ESLint config requires peer dependencies to be installed in consuming packages
- Changes here affect all packages — test thoroughly before committing
