# 1.3 — Diseño de APIs Inter-Servicios

> **Tipo C — Marketplace**

Documentar cada endpoint que una app expone para ser consumido por otra app del sistema. Este contrato debe estar acordado por todos los integrantes antes de comenzar la Etapa 2.

---

## Buyer App — Endpoints expuestos

*Nota: Generalmente la Buyer App consume APIs, pero necesita exponer al menos un endpoint (webhook) para enterarse cuando un pago fue procesado exitosamente y actualizar la vista del comprador.*

### Notificación de estado de pago
- **Endpoint:** `POST /api/orders/:order_id/payment-webhook`
- **Quién lo llama:** Payments App
- **Request:**
  ```json
  {
    "transactionId": "txn_987654",
    "status": "APPROVED",
    "paymentMethod": "credit_card"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "orderStatus": "PAID"
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Faltan campos obligatorios en el body del request."
  }
  ```
- **Response (404 Not Found):**
  ```json
  {
    "success": false,
    "error": "La orden especificada no existe en la base de datos."
  }
  ```
- **Response (500 Internal Server Error):**
  ```json
  {
    "success": false,
    "error": "Error interno al procesar la actualización. Intente nuevamente."
  }
  ```

### Notificación de estado de envío
- **Endpoint:** `POST /api/orders/:order_id/shipping-webhook`
- **Quién lo llama:** Shipping App (al crear la etiqueta y cada vez 
  que el admin actualiza el estado)
- **Request:**
```json
  {
    "trackingId": "TRK-COMPU-9999",
    "courier": "Andreani",
    "status": "LABEL_CREATED"
  }
```
- **Response (200 OK):**
```json
  {
    "success": true
  }
```
- **Response (400 Bad Request):**
  ```json
  {
    "success": false,
    "error": "Faltan campos obligatorios en el body del request."
  }
  ```
- **Response (404 Not Found):**
  ```json
  {
    "success": false,
    "error": "La orden especificada no existe en la base de datos."
  }
  ```
- **Response (500 Internal Server Error):**
  ```json
  {
    "success": false,
    "error": "Error interno al procesar la actualización. Intente nuevamente."
  }
  ```
- *Nota: buyerId no es necesario en el request, ya que el orderId provisto por la URL es suficiente para identificar la transacción en la BD*

---

## Seller App — Endpoints expuestos

### Buscar productos del catalogo
- **Endpoint:** `GET /api/products`
- **Quién lo llama:** Buyer App
- **Query params opcionales:**
  - `search`
  - `category`
  - `brand` 
  - `condition`
  - `sellerId` 
  - `minPrice` 
  - `maxPrice` 
  - `page` 
  - `limit` (Cantidad de resultados por pagina)
- **Response (200 OK):**
    ```json
  {
    "products": [
      {
        "id": "prod_123",
        "sellerId": "seller_001",
        "sellerName": "TechStore Argentina",
        "name": "GeForce RTX 4060 Ti 8GB",
        "category": "GPU",
        "brand": "NVIDIA",
        "price": 450000,
        "stock": 3,
        "condition": "NEW",
        "image": "https://res.cloudinary.com/demo/image/upload/rtx-4060.jpg",
        "createdAt": "2026-05-28T14:20:00.000Z",
        "updatedAt": "2026-05-28T14:20:00.000Z"
      },
      {
        "Id": "prod_124",
        "sellerId": "seller_001",
        "sellerName": "TechStore Argentina",
        "name": "RTX 4070 Super",
        "category": "GPU",
        "brand": "NVIDIA",
        "price": 690000,
        "stock": 2,
        "condition": "NEW",
        "image": "https://res.cloudinary.com/demo/image/upload/rtx-4070-s.jpg",
        "createdAt": "2026-05-28T14:20:00.000Z",
        "updatedAt": "2026-05-28T14:20:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "totalProducts": 34,
      "totalPages": 3
    }
  }
  ```


### Consultar detalle de hardware (Catálogo)
- **Endpoint:** `GET /api/products/:product_id`
- **Quién lo llama:** Buyer App
- **Request:** (Parámetros en la URL)
- **Response (200 OK):**
  ```json
  {
    "id": "prod_123",
    "sellerId": "seller_001",
    "sellerName": "TechStore Argentina",
    "name": "AMD Ryzen 5 5600",
    "category": "CPU",
    "brand": "AMD",
    "price": 180000,
    "stock": 8,
    "condition": "NEW",
    "description": "Procesador AMD Ryzen 5 5600.",
    "images": [
      {
        "id": "img_001",
        "imageUrl": "/assets/products/rtx-4060-front.jpg"
      },
      {
        "id": "img_002",
        "imageUrl": "/assets/products/rtx-4060-back.jpg"
      }
    ],
    "createdAt": "2026-05-28T14:20:00.000Z",
    "updatedAt": "2026-05-28T14:20:00.000Z"
  }
  ```


### Confirmar orden (Catálogo)
- **Endpoint:** `POST /api/orders/confirm`
- **Quién lo llama:** Payments App (luego de un cobro exitoso)
- **Request:**
### Autorización

Este endpoint requiere autenticación mediante API Key.

Enviar la clave compartida con Payments App en el header:

x-api-key: <PAYMENTS_API_KEY>

Si la API Key no se envía o es inválida, el endpoint responde:

Status: 401 Unauthorized
```json
{
  "error": "No autorizado"
}
```
  ```json
  {
    "orderReference": "buyer_order_555",
    "buyerId": "user_111",
    "items": [
      {
        "productId": "prod_123",
        "quantity": 1
      }
    ],
    "transactionId": "txn_987654"
    "buyerAddress": "Espora 350"
    "buyerCodigoPostal": "8109"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "sellerOrderId": "sell_ord_888",
    "status": "PENDING_SHIPMENT",
    "message": "Stock descontado exitosamente"
  }
  ```
- **transactionId es único. Si Payments App repite una request ya procesada, no se descuenta stock nuevamente:**
- **Response (400 Bad Request):** Cuando el JSON no tiene los valores esperados, hay varios tipos de respuestas como JSON invalido, El body debe ser un objeto JSON, campos obligatorios ausentes, lista de productos vacia, item invalido, productos pertenecientes a sellers diferentes, etc.
- **Response (404 Not Found):** Uno o mas productos no existen
```json
{
  "error": "Uno o mas productos no existen"
}
```
```json
{
  "error": "Producto no encontrado"
}
```
- **Response (409 Conflict):**
```json
{
  "error": "Stock insuficiente para el producto prod_123"
}
```
- **Response (500 Internal Server Error):** Error inesperado del servidor o la base de datos:
```json
{
  "error": "Error al confirmar la orden"
}
```

### Notificación de estado de envío
- **Endpoint:** `POST /api/seller-orders/:seller_order_id/shipping-webhook`
- **Quién lo llama:** Shipping App (al crear la etiqueta y cada vez 
  que el admin actualiza el estado)
- **Request:**
```json
  {
    "trackingId": "TRK-COMPU-9999",
    "courier": "Andreani",
    "sellerId": "user_001",
    "status": "LABEL_CREATED"
  }
```
- **Response (200 OK):**
```json
  {
    "success": true
  }
```

---

## Shipping App — Endpoints expuestos

### Crear una etiqueta de envío (Catálogo)
- **Endpoint:** `POST /api/shipments`
- **Quién lo llama:** Seller app

### Autorización

- Este endpoint requiere autenticación mediante API Key.

- **La API Key debe enviarse en el header:**

```
x-api-key: <SELLER_API_KEY>
```

- Solo las aplicaciones autorizadas pueden crear envíos.
- Actualmente, únicamente la Seller App posee permisos para utilizar este endpoint.

- **Si la API Key es inválida o no se envía, el endpoint responderá:**

```json
{
  "error": "Unauthorized."
}
```

**Status:** `401 Unauthorized`

---

### Response (`201 Created`)

- **Request:**
  ```json
  {
    "sellerOrderId": "sell_ord_888",
    "buyerOrderId": "buy_ord_001",
    "sellerId": "seller_001",
    "externalTrackingId": "ANDREANI-001",
    "buyerAddress": "Av. Siempreviva 742, Springfield",
    "originAddress": "Av. Siempreviva 742, Springfield",
    "courier": "ANDREANI"
  }
  ```## Crear una etiqueta de envío (Catálogo)

**Endpoint:** `POST /api/shipments`
**Quién lo llama:** Seller App

### Autorización

Este endpoint requiere autenticación mediante API Key.

La API Key debe enviarse en el header:

```http
x-api-key: <SELLER_API_KEY>
```

Solo las aplicaciones autorizadas pueden crear envíos.

Actualmente, únicamente la Seller App posee permisos para utilizar este endpoint.

---

## Request Body

```json
{
  "sellerOrderId": "sell_ord_888",
  "buyerOrderId": "buy_ord_001",
  "sellerId": "seller_001",
  "externalTrackingId": "ANDREANI-001",
  "buyerAddress": "Av. Siempreviva 742, Springfield",
  "originAddress": "Av. Siempreviva 742, Springfield",
  "courier": "ANDREANI"
}
```

### Campos requeridos

| Campo              | Tipo   | Requerido | Descripción                     |
| ------------------ | ------ | --------- | ------------------------------- |
| sellerOrderId      | string | Sí        | ID de la orden en Seller App    |
| buyerAddress       | string | Sí        | Dirección de entrega            |
| originAddress      | string | Sí        | Dirección de origen             |
| courier            | string | Sí        | Transportista                   |
| externalTrackingId | string | Sí        | Tracking ID del courier externo |
| buyerOrderId       | string | No        | ID de la orden del comprador    |
| sellerId           | string | No        | ID del vendedor                 |

---

## Responses

### 201 Created

El envío fue creado correctamente.

```json
{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999"
}
```

---

### 201 Created (con warning)

El envío fue creado correctamente, pero no pudo registrarse el listener de actualizaciones automáticas del courier.

```json
{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999",
  "warning": "Shipment created but status-change listener registration failed. Updates may not be received automatically."
}
```

o

```json
{
  "trackingId": "TRK-COMPU-9999",
  "externalTrackingId": "ANDREANI-001",
  "status": "LABEL_CREATED",
  "courier": "ANDREANI",
  "labelUrl": "https://shipping-app.com/track/TRK-COMPU-9999",
  "warning": "Shipment created but status-change listener could not be reached. Updates may not be received automatically."
}
```

---

### 400 Bad Request

Faltan campos obligatorios.

```json
{
  "error": "Missing required fields: sellerOrderId, buyerAddress, originAddress, courier"
}
```

o

```json
{
  "error": "Missing required field: externalTrackingId"
}
```

---

### 401 Unauthorized

La API Key es inválida o no fue enviada.

```json
{
  "error": "Unauthorized."
}
```

---

### 500 Internal Server Error

Ocurrió un error inesperado al crear el envío.

```json
{
  "error": "Failed to create shipment"
}
```

### Consultar estado de un envío (Tracking)
- **Endpoint:** `GET /api/shipments/:tracking_id`
- **Quién lo llama:** Buyer App, Seller App.
- **Request:** (Parámetros en la URL)
- **Response (200 OK):** Devuelve el objeto del envío con todo su historial de eventos ordenados cronológicamente.
    ```json
    {
      "trackingId": "TRK-COMPU-9999",
      "externalSellerOrderId": "sell_ord_888",
      "courier": "Andreani",
      "originAddress": "Av. Siempreviva 742, Springfield",
      "destinationAddress": "Calle Falsa 123, Belgrano",
      "status": "IN_TRANSIT",
      "createdAt": "2026-05-19T14:32:00.000Z",
      "updatedAt": "2026-05-20T10:15:00.000Z",
      "events": [
        {
          "id": 1,
          "trackingId": "TRK-COMPU-9999",
          "statusUpdate": "LABEL_CREATED",
          "location": "Sucursal de origen Andreani",
          "timestamp": "2026-05-19T14:32:00.000Z"
        },
        {
          "id": 2,
          "trackingId": "TRK-COMPU-9999",
          "statusUpdate": "IN_TRANSIT",
          "location": "Centro de distribución principal",
          "timestamp": "2026-05-20T10:15:00.000Z"
        }
      ]
    }
    ```
---

## Payments App — Endpoints expuestos

### Iniciar flujo de pago (Checkout)
- **Endpoint:** `POST /api/payments/checkout`
- **Quién lo llama:** Buyer App (cuando el usuario confirma el carrito)
- **Autorización** Este endpoint requiere autenticación mediante API Key.

- **La API Key debe enviarse en el header:**
  ```
  x-api-key: <PAYMENTS_API_KEY>
  ```
- **Request:**
  ```json
  {
    "buyerId": "user_111",
    "buyerAddress":"Alberdi 200",
    "buyerCodigoPostal":"8109",
    "orderReference": "buyer_order_555",
    "amount": 450000,
    "currency": "ARS",
    "items": [
      {
      "productId": "prod_123",
      "quantity": 1,
      "name": "Nvidia RTX"
      "unit_price" : 20000
      "sellerId": "sellerId_001"
      }
    ]
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "transactionId": "txn_pending_123",
    "checkoutUrl": "https://sandbox.mercadopago.com.ar/checkout/v1/..."
  }
  ```
- **Response (400 Bad Request):**
  ```json
  {
    "error": "Faltan campos obligatorios o el carrito está vacío."
  }
  ```
- **Response (500 Internal Server Error):**
  ```json
  {
    "error": "No se pudo generar la preferencia de pago. Intente nuevamente más tarde."
  }
  ```
- **Response (401 Unauthorized):**
  ```json
  {
    "error": "No autorizado. Token inválido o ausente."
  }
  ```
  
### Notificacion resultado de pago
- **Endpoint:** `POST /api/webhooks/mercadopago`
- **Quién lo llama:** Mercado pago (Sistema Externo Automático)
- **Request:** Mercado Pago envía los datos de la transacción en el body y/o como query parameters en la URL
  ```json
  {
  "action": "payment.created",
  "api_version": "v1",
  "data": {
    "id": "1234567890"
  },
  "date_created": "2026-05-30T10:00:00Z",
  "id": 1122334455,
  "live_mode": true,
  "type": "payment",
  "user_id": "user_vendedor_AlPHA"
  }
  ```
- **Response (200 OK):**
  ```json
  {
    "success": true,
    "message": "Webhook procesado y fondos distribuidos."
  }
  ```
- **Response (500 Internal Server Error): Caída de Base de Datos**
  ```json
  {
    "error": "Error interno del servidor."
  }
  ```