---
project: complytude
title: 'Isolating tenants, and the AI, in a legal-compliance SaaS'
lede: 'A multi-tenant platform for UAE businesses to generate and analyze legal documents. I owned the architecture end to end, from hard tenant isolation to an event-driven AI pipeline, and I led a hired team to build it.'
role: 'Founder, lead engineer and architect'
period: 'Side project'
stack: ['NestJS 11', 'Fastify', 'PostgreSQL 16', 'BullMQ', 'Redis', 'AWS S3', 'Docker']
sourceUrl: 'https://github.com/Yazan-Ali-01/complytude-backend'
status: 'Backend ~80%, paused deliberately, source public'
order: 2
---

## What it was, and the constraints that shaped every decision

Small businesses in the UAE pay heavily for routine legal work: employment contracts, NDAs, compliance checklists for authorities like DMCC and IFZA. Complytude set out to make that self-serve. Fill in a form and get a usable draft, or upload a contract and check it against UAE labour law.

The interesting engineering was not the CRUD. It was four constraints pulling against each other.

- **Uncompromising isolation.** Competing organisations' legal documents can never leak across tenants. Isolation had to be enforced, not merely intended.
- **Legal correctness.** AI output assists a human reviewer, it cannot be trusted blindly. The system's job is grounded drafts, not autonomous legal advice.
- **Small team, limited runway.** The architecture had to stay extensible without paying the operational tax of premature microservices.
- **Slow, costly work.** Document generation and contract analysis are latency-heavy and cost-sensitive, so they cannot sit on the request path.

## The architecture at a glance

A domain-driven modular monolith fronts the work. Everything expensive is pushed onto a queue and handled by dedicated workers. The request path stays fast, the heavy path stays isolated and independently scalable.

## Four choices, and the trade-off I accepted for each

### Postgres row-level security, not schema-per-tenant or a database per tenant

I chose RLS with a tenant-scoped session context because it enforces isolation at the database, without the operational cost of migrating N schemas or N databases on every change. Every query is filtered by policy, not by developers remembering a `WHERE tenant_id`.

The trade-off I accepted: a single policy bug becomes a cross-tenant breach, so isolation correctness moves into testing and review discipline. And a very large tenant cannot be physically separated later without rework. For a small team, that was a better risk than the operational weight of a schema or a database per tenant.

### A dual-token flow that separates identity from tenant context

A user can belong to several organisations, so I split *who you are* (an identity token) from *which tenant you are acting in* (a tenant token). Tenant switching stays clean, and the tenant claim never rides on the long-lived identity credential.

The trade-off I accepted: more moving parts in the auth flow, and more tokens to issue, rotate, and reason about than a single fat JWT. I paid that deliberately to keep the tenant boundary explicit.

### A modular monolith on an event-driven spine, not microservices yet

The core is a domain-driven monolith, but all heavy work flows through BullMQ and Redis to dedicated workers. Domains are already decoupled through queues, so they can be extracted into services when scale actually demands it, without paying distributed-systems tax on day one.

The trade-off I accepted: I deferred the operational maturity that microservices force early — distributed tracing, per-service deploys, a service mesh. The event-driven seams keep that door open rather than welding it shut.

### Multi-provider RAG grounded in UAE legal texts

Generation and analysis run as retrieval-augmented generation over a corpus of UAE legal source material, so outputs are anchored in real law rather than model memory. Supporting both Anthropic and OpenAI gives provider failover and lets me route by task.

The trade-off I accepted: two provider integrations and two prompt surfaces to maintain instead of one. Worth it for resilience and routing flexibility on a legally sensitive workload.

## What I can honestly claim about the AI, and what I cannot

I paused the project before formal benchmarking, so I have no measured accuracy figure, and I will not invent one. Qualitatively, retrieval grounding produced usable first drafts that still required human legal review, which is the correct posture for an assistive tool, not an autonomous one.

The evaluation I had designed was a golden set of graded contracts, scored on clause-correctness and citation-grounding, run per provider. Building that harness is the work I would do before making any claim of accuracy.

## My proof in place of production metrics

Complytude never shipped, so I do not point to uptime or latency. I point to build quality. These are real, and they are the standards I set for the team.

- **~80% unit-test coverage** across the codebase.
- **CI on GitHub Actions.** Lint, types, and tests gate every change.
- **Production-ready structured logging** across the request and worker paths.
- **Three local environments:** hybrid, fully dockerized dev, and a production-identical build.

## What is unfinished, and what I would do next

Naming the gaps is part of the engineering, not an apology for it. In priority order.

- **No observability yet.** Logging is in place, but there is no metrics, tracing, or alerting. This is the first thing I would add before launch, especially to watch RLS behaviour and queue health.
- **No formal AI evaluation harness.** The methodology was designed but not built. Without it, accuracy stays a qualitative claim.
- **Templates module is partial.** Versioning in particular needs a rethink before it is production-ready.
- **Backend roughly 80%, paused by choice.** I validated the architecture I set out to prove, then made a pragmatic call to stop rather than chase the product, and I opened the source as a showcase.

## What I owned, and how I led the team

I architected Complytude from zero: the data model, the isolation strategy, the auth flow, the event-driven pipeline. I set the engineering standards the team built against. I hired the developers and directed their work against that architecture, reviewing delivery to keep it coherent.
