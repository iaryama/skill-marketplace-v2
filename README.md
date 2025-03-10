# Skill Marketplace

The **Skill Marketplace** is a microservices-based platform where users (individuals and companies) can create tasks, showcase skills, and receive offers from contractors. It follows a **Node.js** microservices architecture and uses **gRPC** for inter-service communication while exposing REST APIs for external clients.

## 🛠️ Services Overview

This system consists of **four services**:

- **Auth Service**: Manages user authentication and token-based authorization.
- **Task Service**: Handles tasks posted by clients.
- **Skill Service**: Manages skills added by contractors.
- **Offer Service**: Enables bidding/offers for tasks.

### 🏗️ Architecture

- **External APIs** (REST): Exposed to UI clients (e.g., frontend, mobile apps).
- **Internal Communication** (gRPC): Used for secure, high-performance microservice-to-microservice calls.
- **Database**: PostgreSQL (using Sequelize ORM).
- **Authentication**: JWT-based access control.
- **Containerization**: Services run inside **Docker**, orchestrated by **docker-compose**.

---

## 🔗 API Documentation

### **Auth Service**

| Operation     | HTTP Method | Endpoint              | API Type | Used By    |
| ------------- | ----------- | --------------------- | -------- | ---------- |
| Sign Up       | `POST`      | `/user/signup`        | REST     | UI Clients |
| Login         | `POST`      | `/user/login`         | REST     | UI Clients |
| Logout        | `POST`      | `/user/logout`        | REST     | UI Clients |
| Refresh Token | `POST`      | `/user/refresh-token` | REST     | UI Clients |

### **Task Service**

| Operation              | HTTP Method | Endpoint                 | API Type | Used By    |
| ---------------------- | ----------- | ------------------------ | -------- | ---------- |
| Create Task            | `POST`      | `/task/add`              | REST     | UI Clients |
| Get Task By ID         | gRPC        | `GetTaskById` (Internal) | gRPC     | Offer      |
| Get Task By ID         | `GET`       | `/task/{task_id}`        | REST     | UI Clients |
| Update Task            | `PATCH`     | `/task/{task_id}`        | REST     | UI Clients |
| Accept Task Completion | `PATCH`     | `/task/{task_id}/accept` | REST     | UI Clients |
| Reject Task Completion | `PATCH`     | `/task/{task_id}/reject` | REST     | UI Clients |

### **Skill Service**

| Operation    | HTTP Method | Endpoint            | API Type | Used By    |
| ------------ | ----------- | ------------------- | -------- | ---------- |
| Add Skill    | `POST`      | `/skill/add`        | REST     | UI Clients |
| Update Skill | `PATCH`     | `/skill/{skill_id}` | REST     | UI Clients |
| Get Skill    | `GET`       | `/skill/{skill_id}` | REST     | UI Clients |

### **Offer Service**

| Operation             | HTTP Method | Endpoint                    | API Type | Used By    |
| --------------------- | ----------- | --------------------------- | -------- | ---------- |
| Create Offer          | `POST`      | `/offer/task/{task_id}/add` | REST     | UI Clients |
| Get Offers By Task ID | `GET`       | `GetOffersByTaskId`         | REST     | UI Client  |
| Accept Offer          | `PATCH`     | `/offer/{offer_id}/accept`  | REST     | UI Clients |
| Reject Offer          | `PATCH`     | `/offer/{offer_id}/reject`  | REST     | UI Clients |

---

## ⚙️ Running the Services

### 1️⃣ Prerequisites

- Install **Docker** and **Docker Compose**.
- Install **Node.js** (for local development).

### 2️⃣ Running via Docker Compose

To start all services:

```sh
docker-compose up --build
```

## End-to-End Tests (WIP)

### 📌 Overview

The test suite verifies:

- **Authentication & Authorization** (Sign-up, Login, Token Refresh, Logout)
- **Task Management** (Create, Update, Progress, Completion)
- **Skill Management** (Add, Update)
- **Offer Handling** (Create, Accept, Reject)
- **Role-Based API Access** (Contractor & Client)

🚧 **⚠️ Status: WORK IN PROGRESS**
**The tests are not fully implemented yet. Do NOT run them at this time.**

---
