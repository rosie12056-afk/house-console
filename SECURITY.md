# Security

Report suspected vulnerabilities through GitHub private vulnerability reporting when available. Do not open a public issue containing credentials, private endpoints, or user data.

## Deployment requirements

- Serve the Console and Runtime API over HTTPS.
- Authenticate requests on the server with a `Secure`, `HttpOnly`, `SameSite` session cookie.
- Validate authorization for every sensitive API and WebSocket route.
- Keep permanent tokens out of URLs, browser storage, source code, build variables, and Runtime request envelopes.
- Restrict cross-origin access to explicitly trusted origins.
- Apply rate and size limits at the host transport.

This alpha is read-only. It does not provide login, session issuance, TLS, reverse proxy, or mutation confirmation.
