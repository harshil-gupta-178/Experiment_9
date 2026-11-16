# User Authentication Web App

User authentication and authorization web application built with Node.js, Express.js, MongoDB (Mongoose), and JSON Web Tokens (JWT) for secure registration, login, and logout.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment in `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/auth_db
   JWT_SECRET=supersecretjwtkey_auth_dev_key
   JWT_EXPIRE=1h
   COOKIE_EXPIRE=1
   USE_MOCK_FALLBACK=true
   ```

3. Start server:
   ```bash
   npm start
   ```

4. Open in browser:
   http://localhost:5000

## API Endpoints

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate user and receive JWT
- `GET /api/auth/profile` - Access protected user profile (requires JWT)
- `POST /api/auth/logout` - Clear authentication session
