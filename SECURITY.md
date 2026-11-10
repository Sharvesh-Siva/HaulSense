# Security Policy

## Scope
HaulSense is an evolving prototype. Reports are welcome for vulnerabilities involving authentication, authorization, session handling, API exposure, sensitive data, dependency risk, GPS privacy or unsafe operational state changes.

## Reporting a vulnerability
Do not publish exploitable details, credentials, personal data or live location information in a public issue.

Use GitHub's private vulnerability reporting feature if enabled for this repository. Otherwise, contact the repository owner privately through an appropriate channel and include:
- A concise description.
- Affected route, endpoint or component.
- Reproduction steps.
- Potential impact.
- Suggested mitigation, if known.

Allow time for investigation and remediation before public disclosure.

## Security expectations
- Never commit secrets, access tokens, real credentials or private user data.
- Do not use demo identities or simulator shortcuts for real operations.
- Enforce authorization on the server, not only in React route guards.
- Scope protected records to authenticated user and organization.
- Validate request payloads and lifecycle transitions.
- Restrict browser-exposed Maps keys by referrer and API.
- Keep privileged credentials server-side.
- Treat driver location and trip history as sensitive operational data.
- Minimize location collection and define retention.

## Known prototype boundary
The repository contains demo-oriented authentication paths and in-memory stores. These are not production-grade identity, persistence or audit infrastructure. Do not deploy demo credentials or simulator behavior for real driver or customer accounts.

See [docs/SECURITY_AND_DATA_BOUNDARIES.md](docs/SECURITY_AND_DATA_BOUNDARIES.md).
