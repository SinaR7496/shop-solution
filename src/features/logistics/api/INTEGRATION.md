# Storefront, Accounting and Logistics integration

Storefront sends order and delivery information to Accounting. After confirming
payment, Accounting calls Logistics. Storefront reads shipment information from
its server after it verifies that the signed-in customer owns the order.

## Connection details

Use the Logistics FastAPI base URL, for example `http://127.0.0.1:8000` when
all services run on one machine. Use a private test URL over HTTPS when the
teams run on different machines. The operator supplies the URL and sends each
team's token separately. Keep the token on the calling server.

For local integration, configure distinct values for `LOGISTICS_API_TOKEN`
(internal Logistics), `LOGISTICS_ACCOUNTING_TOKEN` and
`LOGISTICS_STOREFRONT_TOKEN`. Use the protected `demo_api:app` adapter.
The [demo launcher](../../../../scripts/logistics-demo.py) inherits the two
partner variables and generates its own internal token. The original
`erp_logistics_api:app` is the unauthenticated domain test entry point.
To start only the protected API from the repository root, install
`requirements-logistics.txt`, export all three token variables in the
launching shell, then run:

```sh
python -m uvicorn demo_api:app --app-dir src/features/logistics/api --host 127.0.0.1 --port 8000
```

## Accounting sends a paid order

`POST /shipments` with `Authorization: Bearer <Accounting token>` and
`Content-Type: application/json`.

```json
{
  "orderId": "O-3001",
  "customerId": "C-501",
  "paymentStatus": "PAID",
  "shippingMethod": "STANDARD",
  "shippingAddress": {
    "recipientName": "Demo Customer",
    "street": "Example Street 1",
    "postalCode": "94469",
    "city": "Deggendorf",
    "country": "DE"
  }
}
```

The other supported shipping method is `EXPRESS`. Accounting checks payment
before calling. `201` returns the created shipment. If Accounting repeats
the same order ID, `409 ORDER_ALREADY_HAS_SHIPMENT` means a shipment already
exists. Invalid payloads return `422`. The current contract rejects
`paymentReference` and other extra fields.

## Storefront reads shipment status

Use `Authorization: Bearer <Storefront token>` on both calls.

1. `GET /shipments?orderId=O-3001`. Read the shipment from `data[0]`.
   An empty `data` array means a shipment has not been created.
2. `GET /shipments/{shipmentId}/events`. Use the shipment ID returned by the
   first request, for example `S-2001`. The `data` array contains the status
   history. A `404` here means that shipment ID could not be found.

Show the customer `carrierCode`, `trackingNumber`, `status`, `updatedAt`
and any applicable history entries. Keep the order page usable if Logistics
is unreachable and show that tracking is temporarily unavailable.

Missing or invalid credentials return `401`. Valid credentials used for an
operation outside their role return `403`. The service still uses in-memory
storage for integration testing. See [OpenAPI](openapi.yaml) for schemas and
domain errors.
