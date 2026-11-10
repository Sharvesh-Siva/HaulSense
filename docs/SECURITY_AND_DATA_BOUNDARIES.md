# Security & Data Boundaries

## 1. Repository observations
This is a source-level review, not a penetration-test certification. The inspected code includes:
- Demo manager and driver login paths in `server.ts`.
- A development simulator flag.
- In-memory session storage.
- In-memory audit-event storage with a bounded event count.
- In-memory fleet telemetry seeded with example coordinates.
- Seeded shipment, driver and vehicle data.
- Frontend route guards in `src/App.tsx`.

Demo manager credentials and a driver PIN are hardcoded in the server source and referenced by login error responses. Treat them as publicly exposed demo values. Remove these paths before real deployment.

## 2. What current safeguards do not prove
- A React route guard does not prove API authorization.
- A random-looking session token is not a complete identity system.
- In-memory sessions do not survive restart or synchronize across replicas.
- An in-memory audit list is not a durable audit trail.
- Seeded coordinates are not live phone GPS.
- A browser-exposed Maps key is visible and must be restricted.
- A UI confirmation is not proof an operational event occurred.

## 3. Production-hardening requirements

### Identity and sessions
- Replace hardcoded credentials and fixed PINs with managed identity or securely stored password verifiers.
- Use secure, expiring, revocable sessions.
- Add brute-force protection and login rate limits.
- Disable simulator access in production.
- Ensure logout invalidates the server-side session.

### Authorization
- Verify identity and role on every protected API request.
- Verify organization membership for every resource.
- Verify driver-to-trip assignment before GPS updates or lifecycle actions.
- Do not let client-supplied role or organization IDs override authenticated claims.
- Add negative tests for cross-driver and cross-organization access.

### Persistence and audit
- Move sessions, operational records and audit events to durable storage.
- Use transactions or concurrency controls for driver/vehicle assignment.
- Define retention and access policy for location history and proof-of-delivery files.
- Make security-sensitive audit records append-only where practical.
- Avoid storing secrets or unnecessary personal data in audit details.

### API and secrets
- Validate inputs with schemas at every mutation boundary.
- Apply rate limits and request-size limits.
- Configure restrictive CORS and security headers.
- Restrict browser Maps keys by allowed referrer and API.
- Keep privileged API keys server-side.
- Rotate credentials that may have been committed or exposed.
- Scan dependencies and repository history for secrets.

### GPS privacy and integrity
- Request explicit location permission and explain its purpose.
- Start sharing only for an authorized active trip.
- Stop tracking when the trip is completed or cancelled.
- Record accuracy and timestamps; mark stale telemetry clearly.
- Do not treat proximity as proof of pickup or delivery.
- Limit access to location history and define retention.
- Use a native Android foreground location service for reliable screen-locked tracking.

## 4. Pre-deployment gate
- [ ] Hardcoded credentials and simulator bypasses removed from production paths.
- [ ] Managed identity and session lifecycle implemented.
- [ ] Server-side authorization tested for every sensitive endpoint.
- [ ] Organization and resource isolation tested.
- [ ] Durable database and audit persistence configured.
- [ ] API keys restricted and exposed secrets rotated.
- [ ] Dependency and secret scans completed.
- [ ] GPS notice, permission, retention and access controls reviewed.
- [ ] Security and operational failure tests pass.
- [ ] Backup, monitoring and incident response documented.

A checked box means evidence exists, not merely that a feature appears in the UI.
