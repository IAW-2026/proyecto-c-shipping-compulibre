Crear una etiqueta de envío (Catálogo)
Endpoint: POST /api/shipments Quién lo llama: Seller App

Autorización
Este endpoint requiere autenticación mediante API Key.

La API Key debe enviarse en el header:

x-api-key: <SELLER_API_KEY>
Solo las aplicaciones autorizadas pueden crear envíos.

Actualmente, únicamente la Seller App posee permisos para utilizar este endpoint.

Request
{
  "sellerOrderId": "sell_ord_888",
  "buyerOrderId": "buy_ord_001",
  "sellerId": "seller_001",
  "externalTrackingId": "ANDREANI-001",
  "buyerAddress": "Av. Siempreviva 742, Springfield",
  "originAddress": "Av. Siempreviva 742, Springfield",
  "courier": "ANDREANI"
}
Responses
201 Created
{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999"
}
201 Created (con warning)
El envío fue creado correctamente, pero no pudo registrarse el listener automático de cambios de estado del courier.

{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999",
  "warning": "Shipment created but status-change listener registration failed. Updates may not be received automatically."
}
o

{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999",
  "warning": "Shipment created but status-change listener could not be reached. Updates may not be received automatically."
}
400 Bad Request
Faltan campos obligatorios.

{
  "error": "Missing required fields: sellerOrderId, buyerAddress, originAddress, courier"
}
o

{
  "error": "Missing required field: externalTrackingId"
}
401 Unauthorized
Si la API Key es inválida o no se envía, el endpoint responderá:

{
  "error": "Unauthorized."
}
500 Internal Server Error
{
  "error": "Failed to create shipment"
}