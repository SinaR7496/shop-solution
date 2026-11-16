# Session 6 implementation record

## Spec-to-UI comparison

- **Taken from the spec:** API operation paths, contract field names, initial,
  loading, empty, success and error states; preserved inputs; shared cards,
  buttons, labels and CSS tokens.
- **Invented:** no extra product fields, operations, filters, authentication or
  purchase data were added. Page controls use the documented `page` and
  `pageSize` parameters. The workbench uses the Admin session operation only
  for shared-login status; it does not gate anonymous discovery.
- **Corrections made:** added explicit empty, loading, API-error and network
  failure criteria; matched the recommendation-unavailable text to the API;
  changed the Admin & Identity handoff to its running UI, with a separate API
  docs link; added a cookie-forwarding same-origin session check because the
  Identity API does not allow browser CORS from the discovery origin.
- **Effect:** automated browser tests exercise the main journeys and verify
  loading, error, empty and success states. Four screenshots are included for
  visual review. The search and recommendation journeys were also completed
  using only the keyboard; the skip link and button order worked without
  getting stuck.

## Admin & Identity contract review

Reviewed the Admin & Identity UI spec v1.4 and attached OpenAPI contract
version 0.1.2.

### Findings to resolve

1. **Token permission changes are contradictory.** The contract says consumers
   verify JWTs locally and read the `permissions` claim, but also says role
   changes affect already-issued tokens because the server uses stored roles.
   Define how consuming modules learn about changed permissions (for example,
   token reissuance/revocation or an agreed online check) so authorization
   behavior is consistent.
2. **Cookie CSRF requirements are underspecified across operations.** The
   cookie scheme description requires `X-ERP-CSRF: 1` for browser calls and a
   trusted Origin for writes, but only `/auth/logout` declares the header.
   Specify the header and Origin requirements for cookie-authenticated
   operations, including the read endpoints and `/users/{user_id}/roles` and
   `/permissions/check`, and clarify whether bearer requests are exempt.
3. **The login cookie contract is incomplete.** Login says it sets
   `erp_access_token`, but the response does not document a `Set-Cookie` header
   or the cookie's Path, SameSite, Secure, and expiry behavior. Document these
   details for browser consumers.
4. **Logout reuses a misleading 403 example.** The shared Forbidden response
   says `Missing permission users:read`, whereas logout can fail because the
   CSRF header or Origin is invalid. Provide a logout-appropriate error
   response/message.

These are review findings, not changes made to Admin & Identity's contract.
Their review of the Search & Recommendations workbench spec and responses to
these findings are still pending, so mutual review is not yet complete.

## Demo

Start with `corepack pnpm dev`, open
`/docs/search-recommendations/discover`, search for “wireless”, use the returned
product ID for both recommendation actions, then search for an unknown phrase
to show the empty state. Trigger a 404 with `missing` to show an API error. For the handoff demo, start the Admin & Identity UI at
`http://localhost:5500/` and API at `http://localhost:8000/`. The API docs
responded during verification, and the workbench successfully read the shared
session through its same-origin proxy. The UI did not respond at its expected
URL on the latest check, so confirm it is running before the demo. Keep a local
recording as a fallback.
