# Flow: Order to Shipment

Teams: Storefront, Accounting, Logistics. Based on the "Order to Shipment" diagram the three teams agreed in session 6.
Status: **signed by Storefront**; Accounting's and Logistics' signatures pending (see the table at the end).

## Trigger

A customer's order is **paid**. The order is created in **Storefront**; **Accounting** confirms the payment and creates the invoice. The payment confirmation in Accounting starts the Logistics part of the flow.

## Steps

| #   | Caller → provider       | Operation                                                    | Data sent                                                                                                                                                                                                | Data returned                                                                                               |
| --- | ----------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| 0   | Storefront → Logistics  | `listShippingMethods` `GET /shipping/methods` (checkout)     | —                                                                                                                                                                                                        | delivery options: `code`, `carrierCode`, `name`, `estimatedDeliveryDays`, `price`                           |
| 1   | Storefront → Accounting | Accounting's operation for a new order (Accounting contract) | `orderId`, `customerId`, `shippingAddress`, `shippingMethod`                                                                                                                                             | —                                                                                                           |
| 2   | Accounting → Logistics  | `createShipment` `POST /shipments`                           | `orderId`, `customerId`, `paymentStatus: "PAID"`, `shippingAddress` (`recipientName`, `street`, `postalCode`, `city`, `country`), `shippingMethod` (`STANDARD` / `EXPRESS`), optional `paymentReference` | `201` with the shipment: `shipmentId` (e.g. `S-2001`), `status: "CREATED"`, `carrierCode`, `trackingNumber` |
| 3   | Storefront → Logistics  | `listShipments` `GET /shipments?orderId=O-…`                 | `orderId`                                                                                                                                                                                                | the shipment of that order: `shipmentId`, `trackingNumber`, `carrierCode`, `status`                         |
| 4   | Storefront → Logistics  | `getShipmentEvents` `GET /shipments/{shipmentId}/events`     | `shipmentId`                                                                                                                                                                                             | status history, oldest first                                                                                |

Storefront shows step 0 at checkout and steps 3–4 on the customer's order page. Logistics never pushes data: every return arrow is the answer to a request. Each partner calls the protected API with its own token (`demo_api.py`): Accounting may only call step 2, Storefront only steps 3–4; step 0 needs no token. Data is in memory for now.

## Contract changes

| Contract                  | Before       | After        | Change                                                                                                                                                                                     |
| ------------------------- | ------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Logistics `openapi.yaml`  | 0.3.0-draft  | **1.2.0**    | 1.0.0 = 0.3.0-draft agreed in this flow. 1.1.0 adds the **optional** `paymentReference` (Accounting sends it). 1.2.0 adds `listShippingMethods` for Storefront's checkout. Additions only. |
| Storefront `openapi.yaml` | (Storefront) | (Storefront) | Storefront fills in its version                                                                                                                                                            |
| Accounting `openapi.yaml` | (Accounting) | (Accounting) | Accounting fills in its version, incl. the call to Logistics                                                                                                                               |

## Errors

| Situation                                                                                      | Who notices                                                          | What happens                                                                                                                             |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Logistics is down when Accounting calls step 2                                                 | Accounting (connection error or `5xx`)                               | The payment stays confirmed. Accounting keeps the order as "paid, shipment pending" and retries later. The flow must not lose the order. |
| Accounting retries an order that already got a shipment                                        | Logistics answers `409 ORDER_ALREADY_HAS_SHIPMENT`                   | Accounting treats this as success and reads the shipment with `GET /shipments?orderId=…`. No second shipment is created.                 |
| Invalid data in step 2 (wrong id format such as `ORD-100001`, lowercase method, missing field) | Logistics answers `422 VALIDATION_ERROR` with a message              | Accounting logs it and does not retry; this is a bug to fix, not a temporary failure.                                                    |
| Order not paid (`paymentStatus` not `PAID`)                                                    | Logistics answers `422`                                              | No shipment is created.                                                                                                                  |
| Missing or wrong token                                                                         | Logistics answers `401`, or `403` for a call outside the team's role | The caller fixes its configuration; no data changes.                                                                                     |
| Storefront asks before the shipment exists (step 3 returns an empty list)                      | Storefront                                                           | Order page shows "Preparing your shipment".                                                                                              |
| Unknown shipment in step 4                                                                     | Logistics answers `404 SHIPMENT_NOT_FOUND`                           | Storefront shows "Shipment not found" and keeps the rest of the order page.                                                              |
| Logistics is down when Storefront asks (steps 0, 3–4)                                          | Storefront                                                           | The order page still works and shows "Delivery status is currently unavailable"; checkout falls back to the methods it last received.    |

## Acceptance criteria

1. **Given** a paid order O-5004, **when** Accounting sends it to `POST /shipments`, **then** Logistics answers 201 with a `shipmentId`, status `CREATED`, a carrier and a tracking number.
2. **Given** O-5004 already has a shipment, **when** Accounting sends it again, **then** Logistics answers 409 and there is still exactly one shipment for O-5004.
3. **Given** a shipment exists for O-5004, **when** Storefront calls `GET /shipments?orderId=O-5004`, **then** it gets that shipment's `shipmentId`, `trackingNumber`, `carrierCode` and `status`.
4. **Given** Accounting sends `paymentReference: "PAY-1"`, **when** the shipment is read, **then** it carries `paymentReference: "PAY-1"`; **given** an old client sends no `paymentReference`, **then** the request still succeeds.
5. **Given** the Logistics API is stopped, **when** Accounting confirms a payment, **then** the order stays "paid, shipment pending" and a shipment is created after Logistics is back.
6. **Given** the Logistics API is stopped, **when** the customer opens the order page, **then** the page loads and shows "Delivery status is currently unavailable".
7. **Given** the checkout, **when** Storefront calls `GET /shipping/methods`, **then** it gets `STANDARD` and `EXPRESS` with carrier, delivery time and price, and the carrier shown is the carrier the shipment later gets.
8. **Given** Storefront's token, **when** it tries `POST /shipments`, **then** Logistics answers 403 and no shipment is created.

Logistics' side of criteria 1–4, 7 and 8 is covered by `api/tests/test_session7.py`, `api/tests/test_partner_access.py` and the existing API tests. Criteria 5–6 are checked on the Accounting and Storefront side.

## Sign-off

| Team       | Name            | Date       | Signed                                                                                       |
| ---------- | --------------- | ---------- | -------------------------------------------------------------------------------------------- |
| Storefront | Storefront team | 2026-11-22 | ✓ written confirmation of contract 1.1.0 and this flow, recorded in `api/CONTRACT_REVIEW.md` |
| Accounting |                 |            |                                                                                              |
| Logistics  |                 |            |                                                                                              |
