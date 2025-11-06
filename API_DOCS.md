# 🧾 API Documentation (v1)

This document lists all REST endpoints in the e-commerce backend.
All routes are versioned under `/api/v1/`.

---

## 👤 Auth & User — `/api/v1/users`

| Method | Endpoint                                                     | Description                               |
| ------ | ------------------------------------------------------------ | ----------------------------------------- |
| POST   | `/api/v1/users/register`                                     | Register a new user with avatar upload.   |
| POST   | `/api/v1/users/login`                                        | Login user and issue JWT tokens.          |
| POST   | `/api/v1/users/forgot-password-request`                      | Request password reset email.             |
| POST   | `/api/v1/users/verify-email/:incomingUnhashedToken`          | Verify user email using token.            |
| POST   | `/api/v1/users/forgot-password-reset/:incomingUnhashedToken` | Reset forgotten password using token.     |
| DELETE | `/api/v1/users/delete-user/:incomingUnhashedToken`           | Permanently delete account via token.     |
| POST   | `/api/v1/users/logout`                                       | Logout and clear auth cookies.            |
| POST   | `/api/v1/users/refreshAccessToken`                           | Refresh access token using refresh token. |
| PATCH  | `/api/v1/users/password-change`                              | Change current password.                  |
| GET    | `/api/v1/users/get-current-user`                             | Get current logged-in user profile.       |
| PATCH  | `/api/v1/users/update-account-details`                       | Update basic user info (name, etc.).      |
| PATCH  | `/api/v1/users/update-user-avatar`                           | Update user avatar image.                 |
| POST   | `/api/v1/users/resend-email-verification-request`            | Resend email verification link.           |
| PATCH  | `/api/v1/users/update-user-address`                          | Add or update user address.               |
| POST   | `/api/v1/users/delete-user-request`                          | Initiate account deletion process.        |

---

## 🛍️ Products — `/api/v1/products`

| Method | Endpoint                                             | Description                                   |
| ------ | ---------------------------------------------------- | --------------------------------------------- |
| POST   | `/api/v1/products/add-product`                       | Create a new product with images and details. |
| GET    | `/api/v1/products/get-products`                      | Fetch all products with optional filters.     |
| GET    | `/api/v1/products/get-single-product/:productId`     | Get detailed info for a specific product.     |
| PATCH  | `/api/v1/products/update-product-details/:productId` | Update product details (price, stock, etc.).  |
| DELETE | `/api/v1/products/delete-product/:productId`         | Delete a product by ID.                       |

---

## 🛒 Cart — `/api/v1/cart`

| Method | Endpoint                                        | Description                              |
| ------ | ----------------------------------------------- | ---------------------------------------- |
| POST   | `/api/v1/cart/add-product-to-cart`              | Add a product to the user’s cart.        |
| GET    | `/api/v1/cart/get-cart`                         | Get all items in the user’s cart.        |
| PATCH  | `/api/v1/cart/update-item-quantity`             | Update quantity of a specific cart item. |
| DELETE | `/api/v1/cart/remove-item-from-cart/:productId` | Remove a specific product from cart.     |
| DELETE | `/api/v1/cart/clear-cart`                       | Clear all items from the cart.           |

---

## 📦 Orders — `/api/v1/orders`

| Method | Endpoint                                      | Description                            |
| ------ | --------------------------------------------- | -------------------------------------- |
| POST   | `/api/v1/orders/create-order`                 | Create a new order from user’s cart.   |
| GET    | `/api/v1/orders/get-user-orders`              | Fetch all orders for the current user. |
| GET    | `/api/v1/orders/get-single-order/:orderId`    | Get details of a specific order.       |
| PATCH  | `/api/v1/orders/cancel-order/:orderId`        | Cancel an order (if not shipped).      |
| PATCH  | `/api/v1/orders/update-order-status/:orderId` | Update order status (admin/seller).    |
| GET    | `/api/v1/orders/get-all-orders`               | Fetch all orders (admin only).         |

---

## ⭐ Ratings — `/api/v1/ratings`

| Method | Endpoint                                         | Description                                 |
| ------ | ------------------------------------------------ | ------------------------------------------- |
| POST   | `/api/v1/ratings/add-rating`                     | Add a product rating and review.            |
| PATCH  | `/api/v1/ratings/update-rating`                  | Update existing rating or review.           |
| DELETE | `/api/v1/ratings/delete-rating/:ratingId`        | Delete a user’s rating.                     |
| GET    | `/api/v1/ratings/get-product-ratings/:productId` | Get all ratings for a product.              |
| GET    | `/api/v1/ratings/get-user-ratings`               | Get all ratings made by the logged-in user. |

---

## 🎁 Offers — `/api/v1/offers`

| Method | Endpoint                               | Description                          |
| ------ | -------------------------------------- | ------------------------------------ |
| POST   | `/api/v1/offers/create-offer`          | Create a new discount offer.         |
| PATCH  | `/api/v1/offers/update-offer/:offerId` | Update offer details or expiry date. |
| DELETE | `/api/v1/offers/delete-offer/:offerId` | Delete an offer.                     |
| GET    | `/api/v1/offers/get-active-offers`     | Fetch all currently active offers.   |

---

## 🩺 Healthcheck — `/api/v1/healthcheck`

| Method | Endpoint               | Description                        |
| ------ | ---------------------- | ---------------------------------- |
| GET    | `/api/v1/healthcheck/` | Server status check (health ping). |

---
