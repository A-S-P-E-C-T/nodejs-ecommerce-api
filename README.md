# 🛍️ Node.js E-Commerce API

A **RESTful E-Commerce backend API** built using **Node.js**, **Express**, and **MongoDB**.  
It supports authentication, role-based access, product and order management, and more.  
This project was created as a learning step to understand backend development and API design.

---

## 🚀 Features

- User authentication (JWT based login/signup)
- Role-based access control (User, Seller, Admin)
- Product management (CRUD)
- Cart and Order management
- Ratings and reviews
- Offers system
- Secure file uploads with Multer
- Error handling and validation

---

## 🧠 Tech Stack

| Category       | Technologies            |
| -------------- | ----------------------- |
| Backend        | Node.js, Express.js     |
| Database       | MongoDB, Mongoose       |
| Authentication | JWT, Bcrypt.js, Cookies |
| File Uploads   | Multer                  |
| Config         | dotenv                  |

---

## Installation

Install my-project with npm

```bash
  npm install my-project
  cd my-project
```

## Run Locally

Clone the project

```bash
  git clone https://github.com/A-S-P-E-C-T/nodejs-ecommerce-api.git
  cd nodejs-ecommerce-api
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start the server

```bash
  npm run start
```

## 🔑 Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`PORT`

`MONGODB_URI`

`FRONTEND_URL`

`CLOUDINARY_CLOUD_NAME`

`CLOUDINARY_API_KEY`

`CLOUDINARY_API_SECRET`

`ACCESS_TOKEN_SECRET`

`ACCESS_TOKEN_EXPIRY`

`REFRESH_TOKEN_SECRET`

`REFRESH_TOKEN_EXPIRY`

`MAILTRAP_SMTP_HOST`

`MAILTRAP_SMTP_PORT`

`MAILTRAP_SMTP_USER`

`MAILTRAP_SMTP_PASS`

## API Reference

| Category        | Base Path             | Description                                  |
| --------------- | --------------------- | -------------------------------------------- |
| **Auth & User** | `/api/v1/users`       | Register, login, profile, account management |
| **Products**    | `/api/v1/products`    | Add, update, delete, get products            |
| **Cart**        | `/api/v1/cart`        | Manage user’s cart                           |
| **Orders**      | `/api/v1/orders`      | Place and track orders                       |
| **Ratings**     | `/api/v1/ratings`     | Add or view product reviews                  |
| **Offers**      | `/api/v1/offers`      | Create and manage offers                     |
| **Healthcheck** | `/api/v1/healthcheck` | Server status check                          |

📄 View Full API Documentation → |

## 🌱 Future Improvements

- Payment gateway integration

- Admin dashboard

- Product image hosting (Cloudinary / S3)

- Email service integration

- Rate limiting and request caching

## 🧑‍💻 Author

    Pankaj
    Engineering Student
    Backend Developer

- [@A-S-P-E-C-T](https://github.com/A-S-P-E-C-T)

## ✨ Quick Note

This project is part of my learning journey — built from scratch with attention to structure and clean code.
Beginners can freely fork it and use it to learn backend development fundamentals.

## License

This project is open-source and available under the [MIT License](LICENSE).
