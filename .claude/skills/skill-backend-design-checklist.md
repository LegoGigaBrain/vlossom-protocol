# Skill: Backend Design Checklist

## Purpose
Guide backend design work for new features or services.

## Checklist

- [ ] Inputs and outputs are clearly defined for each endpoint or handler.
- [ ] Validation rules are explicit (types, ranges, mandatory fields).
- [ ] Authentication and authorization requirements are specified.
- [ ] Data model changes are minimal and normalized where appropriate.
- [ ] Failure modes are defined:
  - validation errors
  - not found
  - conflicts
  - rate limits / timeouts.
- [ ] Idempotency needs are considered for write operations.
- [ ] Logging and metrics plan exists for critical paths.
- [ ] Performance is acceptable for estimated load.
- [ ] Migration / rollout plan exists (especially for schema changes).
