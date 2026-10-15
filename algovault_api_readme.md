# AlgoVault API

AlgoVault API is a strongly-typed RESTful backend engine designed to manage and serve algorithmic coding challenges, execution test cases, and technical interview materials. Built with a focus on strict data integrity and scalable architecture, it acts as the foundational data layer for a developer preparation platform.

## Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Language:** TypeScript
* **Database:** PostgreSQL
* **ORM:** Prisma
* **Containerization:** Docker

## Features

* **End-to-End Type Safety:** Strict TypeScript interfaces paired with Prisma's auto-generated types ensure data structures are enforced from the request payload down to the database schema.
* **Relational Data Modeling:** One-to-many relationships (Questions to Test Cases) managed efficiently via PostgreSQL.
* **Transactional Writes:** Uses Prisma's nested writes to save complex, related data structures in a single database transaction.
* **Production-Ready:** Multi-stage Dockerfile for optimized, lightweight production builds.

---

## Getting Started

### Prerequisites

Ensure you have the following installed on your local machine:
* [Node.js](https://nodejs.org/) (v18 or higher)
* [PostgreSQL](https://www.postgresql.org/)
* [Docker](https://www.docker.com/) (Optional, for containerized execution)

### Local Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/algovault-api.git
   cd algovault-api
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory and add your PostgreSQL connection string:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/devprep?schema=public"
   ```

4. **Run Database Migrations:**
   This command creates the necessary tables in your PostgreSQL database and generates the Prisma Client.
   ```bash
   npx prisma migrate dev --name init
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   The server will start on `http://localhost:3000`.

---

## API Reference

### 1. Health Check
Check if the API is running correctly.
* **URL:** `/api/health`
* **Method:** `GET`
* **Response:**
  ```json
  {
    "status": "success",
    "message": "DevPrep API is running smoothly.",
    "timeStamp": "2026-10-15T12:00:00.000Z"
  }
  ```

### 2. Get All Questions
Retrieve all coding problems and their associated test cases.
* **URL:** `/api/questions`
* **Method:** `GET`
* **Response:**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "uuid-string",
        "title": "Two Sum",
        "description": "Given an array of integers...",
        "difficulty": "Easy",
        "tags": ["arrays", "hash map"],
        "createdAt": "2026-10-15T...",
        "updatedAt": "2026-10-15T...",
        "testCases": [
          {
            "id": "uuid-string",
            "input": "[2,7,11,15], 9",
            "expectedOutput": "[0,1]",
            "questionId": "uuid-string"
          }
        ]
      }
    ]
  }
  ```

### 3. Create a Question
Add a new coding problem along with its test cases in a single request.
* **URL:** `/api/questions`
* **Method:** `POST`
* **Headers:** `Content-Type: application/json`
* **Body:**
  ```json
  {
    "title": "Two Sum",
    "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "difficulty": "Easy",
    "tags": ["arrays", "hash map"],
    "testCases": [
      {
        "input": "[2,7,11,15], 9",
        "expectedOutput": "[0,1]"
      }
    ]
  }
  ```

---

## Docker Deployment

To run AlgoVault API in an isolated container environment:

1. **Build the Docker Image:**
   ```bash
   docker build -t algovault-api .
   ```

2. **Run the Container:**
   *(Note: `--network host` is used here assuming a local PostgreSQL installation on Linux. Adjust networking as needed for Mac/Windows or cloud databases).*
   ```bash
   docker run -d \
     --name algovault-backend \
     --network host \
     -e DATABASE_URL="postgresql://postgres:yourpassword@127.0.0.1:5432/devprep?schema=public" \
     algovault-api
   ```