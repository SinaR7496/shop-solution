# UI spec: Search & Recommendations discovery workbench

## Purpose and users

Feature developers and reviewers use this public workbench to check the mock
catalog search and recommendation APIs from a browser. It is a developer tool,
not the customer storefront; Storefront owns the shopping experience.
Search and recommendations remain anonymous. The workbench also shows the
shared Admin & Identity session when available; it never asks users to sign in
again to use discovery.

## User journeys

1. **Find products:** enter a phrase, submit it, inspect matching products and
   move between result pages. If there are no matches or the service fails, the
   phrase remains available for correction or retry.
2. **Inspect recommendations:** enter a product ID from the contract fixtures
   or a search result, choose similar or also-bought, and inspect the returned
   products. If the ID is unknown, the error is shown and the ID is retained.

## Screens and content

One developer workbench page at
`/docs/search-recommendations/discover`, inside the existing Search &
Recommendations documentation navigation.

- **Search form:** one labeled product phrase input and a Search button.
- **Search results:** result count, product cards, and previous/next controls
  when the API reports more than one page. Each card shows only `productId`,
  `name`, `category`, `priceMinor` formatted using `currency`, and
  `availability`. A button copies its product ID to the recommendation form.
- **Recommendation form:** one labeled product ID input and Similar / Also
  bought buttons.
- **Recommendation results:** product cards using the same allowed fields.
  Empty success is described as “No recommendations are available for this
  product.”
- **Shared sign-in status:** a status region shows the active Identity email,
  signed-out state, or an Identity-service error, with a refresh button.
- **Module handoff:** a primary link to the team-provided Admin & Identity UI
  at `http://localhost:5500/`, plus a link to its API docs at
  `http://localhost:8000/docs`. These local services must be running for the
  demo handoff to work. The link opens in a new tab; discovery stays usable in
  the original tab.

## API mapping

| UI element / action            | Contract operation and fields                                                                                                    |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Search phrase                  | `GET /api/v1/search`, query `q`                                                                                                  |
| Search page controls           | `GET /api/v1/search`, query `page`; the documented default `pageSize` is used                                                    |
| Result count and page controls | `data.total`, `data.page`, `data.pageSize` from search                                                                           |
| Product cards                  | `data.items[]`: `productId`, `name`, `category`, `priceMinor`, `currency`, `availability`                                        |
| Similar button                 | `GET /api/v1/recommendations/similar`, query `productId`                                                                         |
| Also bought button             | `GET /api/v1/recommendations/also-bought`, query `productId`                                                                     |
| Recommendation cards           | `data.items[]`: `productId`, `name`, `category`, `priceMinor`, `currency`, `availability`                                        |
| API failures                   | `{ error: { code, message } }` from the requested operation                                                                      |
| Shared sign-in status          | `GET /api/integrations/admin-identity/session` proxies Admin & Identity `GET /auth/session`; displays `email` and `display_name` |

The session proxy forwards only the `erp_access_token` cookie, validates the
Identity `UserResponse`, and returns only the email and display name. A missing
or expired session is reported as signed out. The proxy uses
`ADMIN_IDENTITY_API_URL` (default `http://localhost:8000`) to avoid browser CORS.
Search and recommendation requests remain anonymous and work when Identity is
unavailable. The page does not access a database or invent product attributes.

## States

- Initial search: “Enter a phrase to search the mock catalog.”
- Search loading: “Searching catalog…”; Search and pagination actions are
  disabled.
- Search success with results: show count and product cards.
- Search success with no items: “No products matched your search. Try another
  phrase.”
- Search API error: show the API's exact `error.message`; preserve the phrase.
- Recommendation initial state: “Enter a product ID to inspect
  recommendations.”
- Recommendation loading: “Loading recommendations…”; both actions are
  disabled.
- Recommendation success with items: show result cards.
- Recommendation success with no items: “No recommendations are available for
  this product.”
- Recommendation API error: show the API's exact `error.message`; preserve the
  product ID.
- Shared session loading: “Checking shared sign-in…”
- Shared session success: show “Signed in as {displayName} ({email}). Search
  uses the same shared session.”
- No shared session: show “Not signed in. Search remains public; no separate
  login is needed.”
- Identity session failure: show the API-proxy message in an alert; provide a
  refresh action and keep search/recommendations available.
- Network failure or invalid response: “The discovery service is not
  available. Check the service and try again.” for a network failure;
  “The discovery service returned an invalid response. Please try again.” for
  an invalid response. Preserve the input. Identity-session failures use the
  separate messages defined above.
- Identity session proxy `503 IDENTITY_SESSION_UNAVAILABLE`: “Could not check
  the Admin & Identity session. Search remains available; try again.”
- Identity session proxy `502 IDENTITY_SESSION_INVALID_RESPONSE`: “The Admin &
  Identity service returned an invalid session response.”
- Identity `401` from `GET /auth/session`: show the signed-out state, not an
  error; preserve discovery inputs.

The Search & Recommendations APIs are anonymous and mock-backed. Login forms
and permission management remain out of scope; the shared-session indicator is
informational and never gates discovery.

## Validation and error texts

- Search `q` follows the API contract: trimmed, at most 200 characters and at
  most 20 terms. Empty `q` is allowed by the contract and browses the catalog.
- `page` is a positive integer; `pageSize` uses the API default of 20 and its
  maximum of 100.
- Recommendation `productId` is required and must be 1–128 characters after
  trimming. The UI does not send an empty recommendation request.
- `400 INVALID_INPUT`: show the API message, currently “Invalid query
  parameters. See the endpoint documentation.”
- `404 PRODUCT_NOT_FOUND`: “Product not found.”
- `503 CATALOG_UNAVAILABLE`: “Catalog data is temporarily unavailable.”
- `503 RECOMMENDATION_DATA_UNAVAILABLE`: “Purchase data is temporarily
  unavailable.”
- `500 INTERNAL_ERROR`: “An unexpected error occurred.”
- Other API errors: show the API message. A malformed response uses “The
  discovery service returned an invalid response. Please try again.”

## Accessibility

- Every input has a visible label.
- All actions are native keyboard-operable buttons; tab order follows the page
  order, and focus remains visible.
- Loading and result summaries use a live status region. Failures use an alert
  region and are communicated in text, not color alone.
- Inputs are not cleared after requests, including errors.

## Acceptance criteria

1. Given the search screen is first opened, when no request has been submitted,
   then the search and recommendation hints are visible and no Search or
   Recommendations API request has been sent; a shared-session status check is
   allowed.
2. Given the API returns products for `q=wireless`, when the user submits
   “wireless”, then the page shows the returned product fields and total and
   calls only `GET /api/v1/search` with `q=wireless`.
3. Given search returns no items for `q=unknown`, when the user submits
   “unknown”, then the page shows “No products matched your search. Try another
   phrase.” and keeps “unknown” in the input.
4. Given the search request is pending, when the user submits a phrase, then
   “Searching catalog…” is announced and the Search button is disabled until
   the response completes.
5. Given the search API returns 503, when the user searches, then the exact API
   message is shown and the search input is retained.
6. Given the API returns a result with product ID `prd_1`, when the user uses
   that ID and chooses Similar, then the page calls
   `GET /api/v1/recommendations/similar?productId=prd_1` and shows its returned
   products.
7. Given the API returns a result with product ID `prd_1`, when the user uses
   that ID and chooses Also bought, then the page calls
   `GET /api/v1/recommendations/also-bought?productId=prd_1` and shows its
   returned products, including an empty result without a similarity fallback.
8. Given the recommendation API returns 404 for `productId=missing`, when the
   user chooses Similar, then “Product not found.” is shown and “missing”
   remains in the input.
9. Given the user follows the Admin & Identity handoff, when the handoff link
   is activated, then the running UI at `http://localhost:5500/` opens in a
   new tab.
10. Given search returns more than one page, when the user chooses Next page,
    then the workbench requests the next documented page and updates the page
    summary; Previous page returns to the preceding page.
11. Given the user navigates with a keyboard, when they skip to content, search
    for a product, use its ID, and choose a recommendation operation, then the
    same results are available without a pointer.
12. Given a valid shared Identity cookie, when the workbench checks session
    status, then it shows the signed-in email without prompting for another
    login and discovery actions remain available.
13. Given the user is signed out or the Identity API is unavailable, when the
    workbench checks session status, then it shows the corresponding status and
    search and recommendation actions remain usable.

## Neighbor review and changes

The assigned neighboring team is Admin & Identity. A review of its attached
OpenAPI contract (version 0.1.2) is recorded in
[OBSERVATIONS.md](./OBSERVATIONS.md), along with review of its UI spec v1.4.
The contract and UI-spec findings and Admin & Identity's review of this
workbench spec remain open; do not describe the exchange as a completed mutual
review until both teams have recorded their responses.

## Out of scope

- Customer storefront, cart, checkout, login forms, catalog editing, and admin
  permissions.
- Facet controls, autocomplete, similarity explanations, purchase history,
  personalization, and any API or data source not listed above.
- Real Marketplace synchronization; the current API uses mock fixtures.
