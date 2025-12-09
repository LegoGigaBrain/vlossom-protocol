# Backend Data Modelling Standards

Design schemas that reflect the domain and scale well over time.

## 1. Key Principles
- Model real-world entities (Booking, Stylist, Property).
- Normalize by default; denormalize only for performance.
- Keep schemas stable and easy to extend.

## 2. Keys & IDs
- Use UUIDs or auto-generated surrogate keys.
- All foreign keys must be explicit and indexed.
- Do not expose raw DB IDs publicly if they reveal internal structure.

## 3. Timestamps & Auditing
Most tables should include:
- `created_at`
- `updated_at`
- `deleted_at` (soft deletes only where necessary)

## 4. State Machines & Enums
Represent lifecycle as explicit states:

PENDING → CONFIRMED → COMPLETED
PENDING → CANCELLED


Avoid ambiguous catch-all states like `ACTIVE`.

## 5. Relationships
- One-to-many: parent → children (`stylist` → `bookings`)
- Many-to-many: via join tables (`stylist_services`)
- Document cascading behaviours:
  - deletes **must not** cascade silently unless absolutely safe

## 6. Migrations
- Every schema change goes through migrations.
- Migrations must be:
  - deterministic
  - reversible (or document why not)
  - safe for rolling deploys

## 7. Sensitive / Personal Data
- Minimize PII.
- Encrypt when necessary.
- Never store secrets, private keys, or payment info.

## 8. Analytics
- Keep transactional (OLTP) schema clean.
- If analytics becomes heavy:
  - use views, replicas, or ETL pipelines
  - avoid bloating production tables with random metrics

Data modelling should evolve slowly and deliberately; treat the schema as a core API.

