# 26 — Open Questions & Future Expansion

Unresolved Decisions, Long-Horizon Ideas, and Architectural Opportunities for Vlossom Protocol

---

## 1. Purpose of This Document

This document captures:

    all unresolved decisions

    all open questions

    all future expansions we have intentionally architected for

    all long-term opportunities that should not be forgotten

It is not a backlog.
It is not a wish list.
It is a strategic memory — a place to store decisions that require:

    more research

    more user feedback

    real-world testing

    technical validation

    market timing

Everything listed here should be addressed after MVP + Beta.

This file ensures that as the team grows, nothing important is lost.

---

## 2. Chain Choice: Base vs Abstract

Open Question

    Which L2 should Vlossom launch on?

Options

    Base

        strong ecosystem funding

        large user base

        Coinbase distribution
            – more competition
            – less consumer-first positioning

    Abstract

        consumer-focused + wallet-first

        native AA + paymaster alignment

        less competition → brand dominance opportunity
            – smaller ecosystem today
            – uncertain grant programs (but rising)

Pending Inputs Needed

    technical comparison (AA performance, gas sponsorship, tooling)

    grant availability

    co-marketing opportunities

    ability to support African payment rails

Architectural Note

We have already designed a chain-agnostic integration layer, meaning:
    we can begin building without committing immediately.

---

## 3. Gas Sponsorship Economics

Open Question

    Should Vlossom sponsor gas forever, at all scales?

Options

    Gasless forever (our current position)

    Gasless for hair bookings only

    Gasless per daily/weekly limits

    Gasless funded via treasury + VLP yields

Considerations

    Paymaster cost modeling

    Daily/Monthly transaction volume

    Treasury funding sustainability

    Potential chain-level incentives

Decision Status

Gasless forever is the chosen UX philosophy.
Economics will be revisited at 10k bookings/day scale.

---

## 4. Wallet Login: Should Users Be Able to Log in With Their Existing Wallet?

Open Question

Do we support:

    MetaMask login?

    Abstract Global Wallet login?

    Coinbase Wallet login?

Pros

    Attracts Web3-native users

    Smooth onboarding for creators/influencers

    Reduces long-term AA recovery burden

Cons

    More complexity for non-Web3 users

    More recovery edge cases

    Possible confusion around “which wallet controls what”

Architectural Note

Document 13 already supports this with:

    VlossomAccountFactory (owner = external wallet)

    session keys

    dual-mode identity

Decision Status

    Included as a Phase 2 optional feature, not MVP.

---

## 5. Should Vlossom Wallet Become Multi-Chain in the Future?

Open Question

Is multichain functionality necessary?

Scenarios Where Likely Yes

    hair/beauty talent markets expanding globally

    DeFi yield diversification

    tokenized products living on other chains

    bridging Vlossom Points or rewards cross-chain

Architectural Status

We already have a placeholder:
ChainRouter (future)
→ supports bridging, mirrored liquidity, cross-chain bookings.

Not MVP, but fully prepared.

---

## 6. Should the Wallet Allow Beauty Brands to Plug In? (Subscriptions, Extensions, Add-ons)

Open Question

Should Vlossom allow:

    monthly hair maintenance subscriptions

    brand-owned educational subscription bundles

    product refill subscriptions

    loyalty automations

    premium stylist tiers

Architectural Status

    Document 13 includes foundation for:
    SubscriptionManager module.

Decision Status

    Great future revenue stream.
    Revisit after marketplace stabilizes.

---

## 7. Should Stylists Have Business Sub-Accounts?

Open Question

Should one human be able to operate multiple “brands” inside Vlossom?

Use Cases

    stylist with two different styles (braids vs wigs)

    stylist + educator combo

    stylist launching product line

    salon employing multiple stylists under one umbrella

    Architectural Status

Document 13 includes:
    BusinessProfileRegistry.

Decision Status

    Not for MVP → but high strategic value.

---

## 8. Should Salons Have Multi-Sig Wallet Treasuries?

Open Question

Should salons be able to:

    share ownership

    distribute revenue automatically

    create community-owned salons (stokvel logic)

Pros

    innovative model

    aligns with African stokvel/plural ownership culture

    strong DeFi narrative

Cons

    onboarding complexity

    recovery complexity

    real-world legal implications

Architectural Status

Document 13 includes:
    SalonTreasury (MVP = single-owner, upgradeable to multi-sig).

Decision Status

    Not MVP.
    Potential rollout: v1.2 or v2.

---

## 9. Should P2P Integrate QR / Tap-to-Pay / NFC?

Open Question

    How “physical world” and “IRL-friendly” should Vlossom be?

Architectural Status

    QR support is already built into P2P.
    NFC/tap-to-pay is purely frontend, no new contract logic required.

Decision Status

    Approved for non-MVP rollout.
    Useful for salons + walk-ins.

---

## 10. Should We Support Salon Commerce (Product Marketplace)?

Open Question

Should Vlossom later support:

    haircare products

    braiding hair

    wigs

    tools

    accessories

Pros

    massive revenue driver

    aligns with stylist workflow

    aligns with salon owner revenue streams

Cons

    logistics complexity

    compliance (curly hair products often require safety regulation)

Decision Status

    Phase 3 expansion.

---

## 11. Should Vlossom Become a Beauty Education Marketplace?

Open Question

Should stylists be allowed to:

    upload courses

    run paid workshops

    host training sessions

    monetize teaching?

Architectural Note

    Matches brand identity (uplift, skill-building).

Decision Status

    High-value Phase 2/3 feature.
    Documented, not planned for MVP.

---

## 12. Should Reviews Become a Social Feed?

Open Question

Should stylist profiles include:

    posts

    updates

    travel announcements

    hair tutorials

    video snippets

    customer transformations

Pros

    builds strong creator economy

    increases retention

    enables virality

    aligns with youth culture

Cons

    moderation load increases

    content storage costs

    social graph complexity

Decision Status

    Phase 2.
    Already accounted for in Doc 15 (Profile revamp).

---

## 13. Should We Introduce “Memberships” (Founders Club, Elite Users, Premium Stylists)?

Open Question

    Does Vlossom benefit from high-tier memberships?

Possible membership utilities:

    early booking windows

    premium support

    stylist priority access

    boosted search ranking

    partner benefits

Status

    We decided:
        Do not add Membership tab in MVP.
        Keep architecture open for Phase 2.

---

## 14. Should Vlossom Tokenize Real-World Assets (RWA)?

Open Question

Should Vlossom eventually support:

    fractional ownership of salons

    revenue-backed lending

    community-owned beauty spaces

    property onboarding as tokenized assets

Pros

    strong alignment with African stokvel culture

    democratizes beauty economy expansion

    enables global liquidity for local businesses

Cons

    legal complexity

    regulatory compliance

    custodial considerations

Decision Status

    Documented as long-term (v3+) possibility.
    Not near-term.

---

## 15. Should Vlossom Introduce Business Financing (Loans, Microcredit)?

Open Question

We have early narrative around lending/borrowing.
Should we expand into:

    stylist equipment financing

    chair leasing loans

    salon improvement loans

    product inventory loans

Architectural Status

    Document 11 + 12 already support:
        Borrow → Credit → Liquidity exposure
        …but intentionally disabled for MVP.

Decision Status

    Year 2+.

## 16. Should Vlossom Build Multi-Day, Travel-Aware Scheduling for Premium Stylists?

Open Question

Do we want early or late rollout of:

    cross-border bookings

    international travel mode

    multi-day weddings/events

    stylist-initiated travel announcements

Architectural Status

    Document 14 + Document 04 support this.

Decision Status

    Included in roadmap AFTER Beta.

---

## 17. Should We Allow Stylists to Hire Assistants Through the App?

Open Question

Should stylists be able to:

    hire/assign assistants

    pay assistants via P2P

    schedule assistant availability

    list staff in their profile

Pros

    real-world operational need

    reinforces stylist-as-business narrative

Cons

    significant scheduling complexity

    payroll logic expansion

Decision Status

    Documented.
    Requires Phase 2/3 research.

---

## 18. Should Vlossom Introduce AI Styling Assistance?

Open Question

Future AI use cases:

    style previews

    recommended stylists

    personalized aftercare

    intelligent service matching

    training and skill elevation

Status

    Long-term (v3+).
    Keep optional hooks in system architecture.

---

## 19. Should the Database Support Multi-Entity Accounts (One Person = Many Roles)?

Open Question

We support roles already.
    Should one account have:

        multiple stylist profiles

        stylist + educator + salon owner roles

        different tax profiles

        multiple payout destinations

Decision Status

    To be considered after Beta data is collected.

---

## 20. Should Vlossom Introduce Automated Bookkeeping for Stylists?

Open Question

Should the app:

    export tax reports

    generate profit/loss sheets

    categorize expenses

    compute chair rental deductions

Pros

    huge value-add

    strong for African freelancer market

    increases retention

Cons

    requires precise integrations

    accounting rules differ by country

Status

    Planned in narrative for stylist empowerment.
    Implementation = v2+.

---

## 21. Should Vlossom Onboard Beauty Technicians Beyond Hair?

Open Question

Should we expand marketplace into:

    nails

    makeup

    facials

    skincare

    lashes

Pros

    massive TAM

    shared user base

    natural adjacency

Cons

    requires updated services taxonomy

    more amenity criteria

    updated pricing logic

Status

    Approved for future expansion.
    Not MVP.

---

## 22. Should Vlossom Support Web & Desktop Full Port?

Open Question

We are mobile-first.
    But should we build:

        full desktop booking portal?

        salon owner dashboards on web?

        professional interface for agencies?

Status

    Not MVP.
    Profiled as v1.1 or v1.2.

---

## 23. Should Vlossom Build a B2B API?

Open Question

Should third-party apps integrate with Vlossom Protocol?

Examples:

    POS systems

    salon ERP tools

    beauty marketplaces

    influencer marketing platforms

Status

    High strategic value.
    But requires strong authentication & rate-limiting.

---

## 24. Meta: Should Vlossom Become a DAO or Remain Company-Controlled?

Open Question

    After maturity, should governance move toward community or LP influence?

Status

    Far future.
    Not in near-term planning.

---

## 25. Summary

This document ensures that:

    all important ideas are preserved

    all strategic expansions are mapped

    nothing gets lost as we scale

    Claude Code and engineering teams can reference decisions easily

    product vision stays stable while allowing flexibility

Vlossom is architected as a living protocol, not a static app.

This list guarantees that Vlossom’s long-term potential — as a global beauty OS — remains visible, structured, and reachable.










































































