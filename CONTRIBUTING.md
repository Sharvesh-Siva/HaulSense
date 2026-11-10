# Contributing to HaulSense

Thanks for helping improve HaulSense. Contributions should make freight decisions more explainable, operations more reliable and the product safer to use.

## Development setup

Requirements: Node.js compatible with the repository's Vite version and npm.

```bash
npm install
npm run dev
```

## Before changing code
1. Read [Project Guide](docs/PROJECT_GUIDE.md).
2. Read [Architecture & Data Flow](docs/ARCHITECTURE.md).
3. Review [Security & Data Boundaries](docs/SECURITY_AND_DATA_BOUNDARIES.md).
4. Inspect existing code before adding a parallel component or service.
5. Keep demo data distinguishable from live operational data.

## Engineering principles

### Deterministic domain logic
- Keep cost, margin, distance and risk calculations in deterministic code.
- Validate agent-tool and external inputs.
- Include units and assumptions in calculation interfaces.
- Add boundary tests when business rules change.
- Do not allow generated text to directly commit high-impact operational changes.

### Authorization and privacy
- Enforce access on the server.
- Scope records to authenticated organization and user.
- Never trust a frontend role selector as authorization.
- Treat driver location, documents and shipment records as sensitive.
- Never commit secrets or real customer/driver information.

### User experience
- Preserve the existing HaulSense identity and workflows.
- Make loading, empty, stale, offline and error states explicit.
- Keep manager and driver experiences role-appropriate.
- Ensure keyboard access, visible focus and responsive layouts.
- Avoid decorative controls that do not perform real actions.

### Documentation
- Update relevant guides when behavior changes.
- Label implemented, demo-only and planned capabilities accurately.
- Document environment variable names, never their secret values.
- Include migration notes for data-model changes.

## Validation

Run the checks currently available:

```bash
npm run lint
npm run build
```

The current package scripts do not define `npm test`. If you add a test runner, provide a reproducible script and document it.

For agent tools, test valid inputs, invalid inputs, edge cases and deterministic outputs. For API changes, test unauthorized access and invalid lifecycle transitions.

## Pull request checklist
- [ ] Change is scoped and preserves unrelated functionality.
- [ ] Inputs are validated.
- [ ] Server-side authorization is enforced.
- [ ] No secrets or real personal data are included.
- [ ] Demo data is not presented as live data.
- [ ] Relevant checks were run and results reported accurately.
- [ ] Documentation reflects the implementation.
- [ ] UI states and responsive behavior were reviewed.
