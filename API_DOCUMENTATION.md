# Akademee API Documentation

## Base URL
```
http://localhost:5000
```

---

## 🔐 Authentication Endpoints

### 1. Register School (+ Admin User)
**Register a new school with an admin account**

#### Endpoint
```
POST /api/schools/register
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "schoolName": "Grace Bilingual Academy",
  "city": "Douala",
  "region": "Littoral",
  "email": "info@grace-bilingual.cm",
  "firstName": "John",
  "lastName": "Doe",
  "adminEmail": "admin@grace-bilingual.cm",
  "phone": "+237697234567",
  "password": "SecurePass@123",
  "confirmPassword": "SecurePass@123",
  "planId": "basic"
}
```

#### Request Parameters Explanation
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| schoolName | string | ✅ | Name of the school | "Grace Bilingual Academy" |
| subdomain | string | ✅ | School subdomain (auto-generated, can be customized) | "grace-bilingual" |
| city | string | ✅ | City where school is located | "Douala" |
| region | string | ❌ | Region/Province | "Littoral" |
| email | string | ✅ | School email address | "info@school.cm" |
| firstName | string | ✅ | Admin first name | "John" |
| lastName | string | ✅ | Admin last name | "Doe" |
| adminEmail | string | ✅ | Admin email (must be unique) | "admin@school.cm" |
| phone | string | ❌ | Admin phone number | "+237697234567" |
| password | string | ✅ | Admin password (min 8 chars) | "SecurePass@123" |
| confirmPassword | string | ✅ | Confirm password (must match) | "SecurePass@123" |
| planId | string | ✅ | Subscription plan: "free", "basic", or "premium" | "basic" |
| templateCode | string | ❌ | Website template: "modern", "classic", or "minimal" | "modern" |

#### Response - Success (201)
```json
{
  "success": true,
  "message": "School registered successfully",
  "data": {
    "school": {
      "schoolId": "550e8400-e29b-41d4-a716-446655440000",
      "schoolName": "Grace Bilingual Academy",
      "subdomain": "grace-bilingual-academy"
    },
    "schoolId": "550e8400-e29b-41d4-a716-446655440000",
    "schoolName": "Grace Bilingual Academy",
    "subdomain": "grace-bilingual-academy",
    "templateCode": "modern",
    "campusUrl": "http://grace-bilingual-academy.lvh.me:3000",
    "dashboardUrl": "http://grace-bilingual-academy.lvh.me:3000/dashboard",
    "websiteUrl": "http://grace-bilingual-academy.lvh.me:3000/site",
    "onboardingUrl": "http://grace-bilingual-academy.lvh.me:3000/onboarding",
    "loginUrl": "http://grace-bilingual-academy.lvh.me:3000/login",
    "domainSuffix": ".lvh.me:3000",
    "adminEmail": "admin@grace-bilingual.cm",
    "adminName": "John Doe",
    "planId": "basic",
    "emailVerified": true,
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@grace-bilingual.cm",
      "firstName": "John",
      "lastName": "Doe",
      "schoolId": "550e8400-e29b-41d4-a716-446655440000",
      "subdomain": "grace-bilingual-academy",
      "schoolName": "Grace Bilingual Academy",
      "roles": ["ADMIN"]
    },
    "urls": {
      "subdomain": "grace-bilingual-academy",
      "campusUrl": "http://grace-bilingual-academy.lvh.me:3000",
      "dashboardUrl": "http://grace-bilingual-academy.lvh.me:3000/dashboard",
      "websiteUrl": "http://grace-bilingual-academy.lvh.me:3000/site",
      "loginUrl": "http://grace-bilingual-academy.lvh.me:3000/login",
      "onboardingUrl": "http://grace-bilingual-academy.lvh.me:3000/onboarding",
      "verifyEmailUrl": "http://grace-bilingual-academy.lvh.me:3000/verify-email",
      "apiUrl": "http://localhost:5000",
      "domainSuffix": ".lvh.me:3000",
      "templateCode": "modern"
    }
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Error (400)
```json
{
  "success": false,
  "message": "Passwords do not match",
  "error": null,
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Conflict (409)
```json
{
  "success": false,
  "message": "School email already exists",
  "error": null,
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Status Codes
- **201** - School registered successfully
- **400** - Validation error (missing fields, password mismatch, password < 8 chars)
- **409** - Email already exists
- **500** - Server error

#### Notes
- Subdomain is auto-generated from school name
- If subdomain already exists, a counter is appended (grace-bilingual-academy1, grace-bilingual-academy2, etc.)
- Admin user is created with SUPER_ADMIN role automatically
- Password must be at least 8 characters long
- Passwords are hashed using bcrypt before storage

---

### 2. Login
**Authenticate user and receive JWT token**

#### Endpoint
```
POST /api/auth/login
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "subdomain": "grace-bilingual-academy",
  "email": "admin@grace-bilingual.cm",
  "password": "SecurePass@123"
}
```

#### Request Parameters Explanation
| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| subdomain | string | ✅ | School subdomain (from registration) | "grace-bilingual-academy" |
| email | string | ✅ | User email address | "admin@grace-bilingual.cm" |
| password | string | ✅ | User password | "SecurePass@123" |

#### Response - Success (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "admin@grace-bilingual.cm",
      "firstName": "John",
      "lastName": "Doe",
      "schoolId": "550e8400-e29b-41d4-a716-446655440000",
      "subdomain": "grace-bilingual-academy",
      "schoolName": "Grace Bilingual Academy",
      "roles": ["ADMIN"]
    },
    "urls": {
      "subdomain": "grace-bilingual-academy",
      "campusUrl": "http://grace-bilingual-academy.lvh.me:3000",
      "dashboardUrl": "http://grace-bilingual-academy.lvh.me:3000/dashboard",
      "websiteUrl": "http://grace-bilingual-academy.lvh.me:3000/site",
      "loginUrl": "http://grace-bilingual-academy.lvh.me:3000/login",
      "onboardingUrl": "http://grace-bilingual-academy.lvh.me:3000/onboarding",
      "verifyEmailUrl": "http://grace-bilingual-academy.lvh.me:3000/verify-email",
      "apiUrl": "http://localhost:5000",
      "domainSuffix": ".lvh.me:3000",
      "templateCode": "modern"
    }
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Error (401)
```json
{
  "success": false,
  "message": "Invalid email or password",
  "error": null,
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Status Codes
- **200** - Login successful
- **400** - Validation error (missing fields)
- **401** - Invalid email or password / School not found
- **500** - Server error

#### Token Details
- **Type**: JWT (JSON Web Token)
- **Expiry**: 7 days
- **Storage**: Store in `localStorage` as `authToken`
- **Usage**: Include in Authorization header for protected endpoints

#### Token Payload Example
```json
{
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "schoolId": "550e8400-e29b-41d4-a716-446655440000",
  "subdomain": "grace-bilingual-academy",
  "email": "admin@grace-bilingual.cm",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["ADMIN"],
  "role": "ADMIN",
  "iat": 1687776679,
  "exp": 1688381379
}
```

---

## 🔓 Public Endpoints (No Auth Required)

### 3. Check Subdomain Availability
**Check if a subdomain is available for registration**

#### Endpoint
```
POST /api/schools/check-subdomain
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "subdomain": "grace-bilingual-academy"
}
```

#### Response - Available (200)
```json
{
  "success": true,
  "message": "Subdomain availability checked",
  "data": {
    "available": true,
    "subdomain": "grace-bilingual-academy"
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Not Available (200)
```json
{
  "success": true,
  "message": "Subdomain availability checked",
  "data": {
    "available": false,
    "subdomain": "grace-bilingual-academy"
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

### 4. Get Subscription Plans
**Retrieve available subscription plans**

#### Endpoint
```
GET /api/schools/plans
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
None

#### Response - Success (200)
```json
{
  "success": true,
  "message": "Plans retrieved successfully",
  "data": [
    {
      "id": "free",
      "name": "Free",
      "description": "Up to 50 students · Grades, attendance, basic reports",
      "price": 0,
      "currency": "FCFA",
      "features": [
        "Up to 50 students",
        "Grades & attendance",
        "Basic reports"
      ]
    },
    {
      "id": "basic",
      "name": "Basic",
      "description": "Up to 300 students · Full grades, PDF bulletins, finance module",
      "price": 15000,
      "currency": "FCFA",
      "features": [
        "Up to 300 students",
        "Full grades",
        "PDF bulletins",
        "Finance module"
      ]
    },
    {
      "id": "premium",
      "name": "Premium",
      "description": "Unlimited students · All features + priority support + custom branding",
      "price": 35000,
      "currency": "FCFA",
      "features": [
        "Unlimited students",
        "All features",
        "Priority support",
        "Custom branding"
      ]
    }
  ],
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

### 5. Get Website Templates
**Retrieve available website templates**

#### Endpoint
```
GET /api/schools/templates
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
None

#### Response - Success (200)
```json
{
  "success": true,
  "message": "Templates retrieved successfully",
  "data": [
    {
      "template_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "template_code": "modern",
      "name": "Modern",
      "description": "Modern and clean school website design",
      "preview_url": "https://akademee.cm/preview/modern",
      "created_at": "2026-06-01T00:00:00.000Z"
    },
    {
      "template_id": "f47ac10b-58cc-4372-a567-0e02b2c3d480",
      "template_code": "classic",
      "name": "Classic",
      "description": "Classic and professional school website design",
      "preview_url": "https://akademee.cm/preview/classic",
      "created_at": "2026-06-01T00:00:00.000Z"
    }
  ],
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

### 6. Verify School
**Check if a school exists by subdomain**

#### Endpoint
```
POST /api/auth/verify-school
```

#### Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "subdomain": "grace-bilingual-academy"
}
```

#### Response - Found (200)
```json
{
  "success": true,
  "message": "School verified",
  "data": {
    "exists": true,
    "school_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Grace Bilingual Academy",
    "subdomain": "grace-bilingual-academy"
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Not Found (200)
```json
{
  "success": false,
  "message": "School not found",
  "error": "School not found",
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

## 🔒 Protected Endpoints (Require JWT Token)

### 7. Get Current User
**Retrieve authenticated user information**

#### Endpoint
```
GET /api/auth/me
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

#### Request Body
None

#### Response - Success (200)
```json
{
  "success": true,
  "message": "User retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "admin@grace-bilingual.cm",
    "firstName": "John",
    "lastName": "Doe",
    "schoolId": "550e8400-e29b-41d4-a716-446655440000",
    "roles": ["ADMIN"],
    "school": {
      "school_id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Grace Bilingual Academy",
      "subdomain": "grace-bilingual-academy",
      "email_verified": true,
      "onboarding_completed": false
    },
    "schoolName": "Grace Bilingual Academy",
    "subdomain": "grace-bilingual-academy",
    "emailVerified": true,
    "onboardingCompleted": false
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Response - Unauthorized (401)
```json
{
  "success": false,
  "message": "Unauthorized",
  "error": "Invalid or missing token",
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

#### Status Codes
- **200** - Success
- **401** - Invalid/missing token
- **500** - Server error

---

### 8. Logout
**Logout user (invalidate token)**

#### Endpoint
```
POST /api/auth/logout
```

#### Headers
```
Content-Type: application/json
Authorization: Bearer {token}
```

#### Request Body
```json
{}
```

#### Response - Success (200)
```json
{
  "success": true,
  "message": "Logout successful",
  "data": null,
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

## 📝 Postman Collection - Quick Copy/Paste

### Register School
```
POST http://localhost:5000/api/schools/register
Content-Type: application/json

{
  "schoolName": "Test Academy",
  "city": "Douala",
  "region": "Littoral",
  "email": "info@testacademy.cm",
  "firstName": "Jean",
  "lastName": "Dupont",
  "adminEmail": "jean@testacademy.cm",
  "phone": "+237697234567",
  "password": "TestPass@123",
  "confirmPassword": "TestPass@123",
  "planId": "basic"
}
```

### Login
```
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "subdomain": "test-academy",
  "email": "jean@testacademy.cm",
  "password": "TestPass@123"
}
```

### Get Plans
```
GET http://localhost:5000/api/schools/plans
Content-Type: application/json
```

### Get Templates
```
GET http://localhost:5000/api/schools/templates
Content-Type: application/json
```

### Get Current User (with token)
```
GET http://localhost:5000/api/auth/me
Content-Type: application/json
Authorization: Bearer {token_from_login}
```

---

## 🔑 Common HTTP Status Codes

| Code | Meaning | Scenario |
|------|---------|----------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input/validation error |
| 401 | Unauthorized | Invalid or missing authentication token |
| 409 | Conflict | Resource already exists (e.g., email duplicate) |
| 500 | Server Error | Internal server error |

---

## 🛠️ Example Test Workflow in Postman

1. **Register School**
   - Use the Register endpoint with unique test data
   - Copy the `subdomain` from the response

2. **Login**
   - Use the Login endpoint with the subdomain and admin credentials
   - Copy the `token` from the response

3. **Get Current User**
   - Use the Get Current User endpoint
   - Paste the token in Authorization header as: `Bearer {token}`

4. **Check Subdomain**
   - Use the Check Subdomain endpoint
   - Test with different subdomains to see availability

---

## 📚 Notes

- All timestamps are in ISO 8601 format (UTC)
- JWT tokens expire after 7 days
- Subdomain auto-generates from school name but can be customized
- For production, update API URLs in frontend configuration
- CORS is enabled for `localhost:*` in development mode
