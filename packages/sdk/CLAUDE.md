# Vlossom SDK

> Purpose: Client SDK for interacting with Vlossom APIs and smart contracts. Future package for external developers.

## Canonical References
- [Doc 13: Smart Contract Architecture](../../docs/vlossom/13-smart-contract-architecture.md)
- [Doc 14: Backend Architecture and APIs](../../docs/vlossom/14-backend-architecture-and-apis.md)

## Key Files
- `src/index.ts` — Public exports
- `src/version.ts` — SDK version

## Local Conventions
- Re-exports all types from `@vlossom/types`
- Will include contract ABIs and client methods
- Designed for external consumption (future)

## Dependencies
- Internal: `@vlossom/types`

## Gotchas
- Not yet implemented — placeholder for Phase 2+
- Will need to handle gasless transactions via AA
