# Seller Dispute API Integration Guide

## Base URL
```
/seller
```

## Authentication
All endpoints require authentication. Include the bearer token in the Authorization header:
```
Authorization: Bearer {your_token}
```

**Note:** The seller must have an associated store to access dispute endpoints.

---

## 1. List My Disputes

Retrieves all disputes related to the seller's store.

**Endpoint:** `GET /seller/disputes`

### Request Example

```bash
curl -X GET "https://your-api.com/seller/disputes" \
  -H "Authorization: Bearer {token}"
```

### Success Response (200)

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "category": "Order Dispute",
      "details": "The product I received is different from what I ordered",
      "images": [
        "disputes/image1.jpg",
        "disputes/image2.jpg"
      ],
      "status": "open",
      "won_by": null,
      "resolution_notes": null,
      "created_at": "2025-11-12T15:00:00.000000Z",
      "buyer": {
        "id": 10,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "store_order": {
        "id": 456,
        "status": "delivered"
      },
      "last_message": {
        "message": "📌 Dispute created: Order Dispute\n\nThe product I received is different from what I ordered",
        "sender_type": "buyer",
        "created_at": "2025-11-12T15:00:00.000000Z"
      }
    },
    {
      "id": 2,
      "category": "Late Delivery",
      "details": "Order was supposed to arrive 3 days ago",
      "images": [],
      "status": "resolved",
      "won_by": "buyer",
      "resolution_notes": "Refund issued to buyer",
      "created_at": "2025-11-10T10:00:00.000000Z",
      "buyer": {
        "id": 11,
        "name": "Jane Buyer",
        "email": "jane@example.com"
      },
      "store_order": {
        "id": 455,
        "status": "delivered"
      },
      "last_message": {
        "message": "Dispute has been resolved in favor of buyer.",
        "sender_type": "admin",
        "created_at": "2025-11-11T14:00:00.000000Z"
      }
    }
  ]
}
```

### Error Response (404)

```json
{
  "status": "error",
  "message": "Store not found for this seller."
}
```

---

## 2. View Single Dispute

Retrieves detailed information about a specific dispute including all chat messages. Only disputes related to the seller's store can be accessed.

**Endpoint:** `GET /seller/disputes/{id}`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Dispute ID |

### Request Example

```bash
curl -X GET "https://your-api.com/seller/disputes/1" \
  -H "Authorization: Bearer {token}"
```

### Success Response (200)

```json
{
  "status": "success",
  "data": {
    "dispute": {
      "id": 1,
      "category": "Order Dispute",
      "details": "The product I received is different from what I ordered",
      "images": [
        "disputes/image1.jpg",
        "disputes/image2.jpg"
      ],
      "status": "open",
      "won_by": null,
      "resolution_notes": null,
      "created_at": "2025-11-12T15:00:00.000000Z",
      "resolved_at": null,
      "closed_at": null
    },
    "dispute_chat": {
      "id": 1,
      "buyer": {
        "id": 10,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "seller": {
        "id": 20,
        "name": "Jane Seller",
        "email": "jane@example.com"
      },
      "store": {
        "id": 5,
        "name": "Awesome Store"
      },
      "messages": [
        {
          "id": 1,
          "sender_id": 10,
          "sender_type": "buyer",
          "sender_name": "John Doe",
          "message": "📌 Dispute created: Order Dispute\n\nThe product I received is different from what I ordered",
          "image": null,
          "is_read": true,
          "created_at": "2025-11-12T15:00:00.000000Z"
        },
        {
          "id": 2,
          "sender_id": 20,
          "sender_type": "seller",
          "sender_name": "Jane Seller",
          "message": "I apologize for the inconvenience. Let me check the order details and get back to you.",
          "image": null,
          "is_read": true,
          "created_at": "2025-11-12T15:30:00.000000Z"
        },
        {
          "id": 3,
          "sender_id": 1,
          "sender_type": "admin",
          "sender_name": "Admin User",
          "message": "I'm reviewing this dispute. Both parties, please provide any additional information.",
          "image": null,
          "is_read": false,
          "created_at": "2025-11-12T16:00:00.000000Z"
        },
        {
          "id": 4,
          "sender_id": 20,
          "sender_type": "seller",
          "sender_name": "Jane Seller",
          "message": "I've checked our records. We can offer a replacement or full refund.",
          "image": null,
          "is_read": false,
          "created_at": "2025-11-12T16:30:00.000000Z"
        }
      ]
    },
    "store_order": {
      "id": 456,
      "order_id": 789,
      "status": "delivered",
      "items_subtotal": "100.00",
      "shipping_fee": "10.00",
      "subtotal_with_shipping": "110.00",
      "items": [
        {
          "id": 1,
          "name": "Product Name",
          "sku": "SKU123",
          "unit_price": "50.00",
          "qty": 2,
          "line_total": "100.00"
        }
      ]
    }
  }
}
```

### Error Response (404)

```json
{
  "status": "error",
  "message": "No query results for model [App\\Models\\Dispute] 1"
}
```

**Note:** This error will also occur if the dispute doesn't belong to the seller's store.

---

## 3. Send Message in Dispute Chat

Sends a message in the dispute chat. Only the seller who owns the store related to the dispute can send messages.

**Endpoint:** `POST /seller/disputes/{id}/message`

**Content-Type:** `multipart/form-data` (if sending image)

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Dispute ID |

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `message` | string | No* | Message text (required if no image) |
| `image` | file | No* | Image file (jpg, jpeg, png, webp, max 5MB) (required if no message) |

*At least one of `message` or `image` is required.

### Request Example

```bash
# Text message
curl -X POST "https://your-api.com/seller/disputes/1/message" \
  -H "Authorization: Bearer {token}" \
  -F "message=I apologize for the inconvenience. Let me check the order details and get back to you."

# Image message
curl -X POST "https://your-api.com/seller/disputes/1/message" \
  -H "Authorization: Bearer {token}" \
  -F "image=@/path/to/proof.jpg"

# Text + Image
curl -X POST "https://your-api.com/seller/disputes/1/message" \
  -H "Authorization: Bearer {token}" \
  -F "message=Here's the shipping proof" \
  -F "image=@/path/to/shipping_proof.jpg"
```

### Success Response (200)

```json
{
  "status": "success",
  "data": {
    "message": {
      "id": 5,
      "dispute_chat_id": 1,
      "sender_id": 20,
      "sender_type": "seller",
      "message": "I apologize for the inconvenience. Let me check the order details and get back to you.",
      "image": null,
      "is_read": false,
      "created_at": "2025-11-12T17:00:00.000000Z",
      "updated_at": "2025-11-12T17:00:00.000000Z",
      "sender": {
        "id": 20,
        "full_name": "Jane Seller",
        "email": "jane@example.com"
      }
    }
  },
  "message": "Message sent successfully."
}
```

### Error Response (422)

```json
{
  "status": "error",
  "message": "Message or image is required."
}
```

### Error Response (404)

```json
{
  "status": "error",
  "message": "Store not found for this seller."
}
```

---

## 4. Mark Messages as Read

Marks all non-seller messages (buyer and admin messages) as read in the dispute chat.

**Endpoint:** `POST /seller/disputes/{id}/mark-read`

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | integer | Dispute ID |

### Request Example

```bash
curl -X POST "https://your-api.com/seller/disputes/1/mark-read" \
  -H "Authorization: Bearer {token}"
```

### Success Response (200)

```json
{
  "status": "success",
  "data": [],
  "message": "Messages marked as read."
}
```

---

## Dispute Status Values

| Status | Description |
|--------|-------------|
| `open` | Dispute is newly created and open |
| `pending` | Dispute is pending admin review |
| `on_hold` | Dispute is on hold |
| `resolved` | Dispute has been resolved |
| `closed` | Dispute has been closed |

## Won By Values

| Value | Description |
|-------|-------------|
| `buyer` | Dispute resolved in favor of buyer |
| `seller` | Dispute resolved in favor of seller |
| `admin` | Admin decision (neutral/other) |

## Sender Types in Messages

| Type | Description |
|------|-------------|
| `buyer` | Message sent by the buyer |
| `seller` | Message sent by the seller |
| `admin` | Message sent by an admin |

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized
```json
{
  "status": "error",
  "message": "Unauthenticated."
}
```

### 404 Not Found
```json
{
  "status": "error",
  "message": "Dispute not found."
}
```

### 500 Internal Server Error
```json
{
  "status": "error",
  "message": "Error message here"
}
```

---

## Important Notes

1. **Store Requirement:** The seller must have an associated store to access dispute endpoints. If no store is found, all endpoints will return a 404 error.

2. **Store Ownership:** Sellers can only access disputes related to their own store. Attempting to access a dispute from another store will result in a 404 error.

3. **Message Permissions:** Sellers can only send messages in disputes related to their store.

4. **Read Status:** When a seller sends a message, all buyer and admin messages are automatically marked as read for that seller.

