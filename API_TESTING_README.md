# Akademee API Testing Guide

## 📖 Documentation Files

This project includes three documentation files to help you test the APIs:

### 1. **API_DOCUMENTATION.md** 
Comprehensive API reference with:
- Full endpoint descriptions
- Request/response examples
- Parameter explanations
- Status codes and error handling
- Notes and important details

👉 **Use this when you need detailed information about any endpoint**

### 2. **akademee-postman-collection.json**
Ready-to-import Postman collection with:
- All 8 API endpoints pre-configured
- Sample request bodies
- Environment variables setup
- Save time by importing instead of manual setup

👉 **Use this for quick setup in Postman**

### 3. **POSTMAN_QUICK_GUIDE.md**
Step-by-step guide with:
- Quick start instructions
- Common testing scenarios
- Troubleshooting tips
- Example test data
- Token management guide

👉 **Use this when testing for the first time**

---

## 🚀 Getting Started (3 Steps)

### Step 1: Import Postman Collection
1. Open Postman
2. Click **Import**
3. Select `akademee-postman-collection.json`
4. All endpoints are now ready

### Step 2: Test Registration
1. Open **"Register School"** request
2. Update the request body with your test data
3. Click **Send**
4. Check response for success and copy `subdomain`

### Step 3: Test Login
1. Open **"Login"** request
2. Update subdomain from Step 2 and admin email/password
3. Click **Send**
4. Copy the `token` from response
5. Paste it in Postman Variables as `authToken`

---

## 🎯 Quick Command Reference

### Register New School
```bash
curl -X POST http://localhost:5000/api/schools/register \
  -H "Content-Type: application/json" \
  -d '{
    "schoolName": "Your School",
    "city": "Douala",
    "region": "Littoral",
    "email": "school@example.cm",
    "firstName": "Admin",
    "lastName": "Name",
    "adminEmail": "admin@example.cm",
    "password": "StrongPass@123",
    "confirmPassword": "StrongPass@123",
    "planId": "basic"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "your-school",
    "email": "admin@example.cm",
    "password": "StrongPass@123"
  }'
```

### Get Current User (requires token)
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📋 Endpoint Quick Links

| Endpoint | Method | Public | Purpose |
|----------|--------|--------|---------|
| `/api/schools/register` | POST | ✅ | Register school |
| `/api/auth/login` | POST | ✅ | Login & get token |
| `/api/auth/verify-school` | POST | ✅ | Verify school exists |
| `/api/schools/check-subdomain` | POST | ✅ | Check subdomain available |
| `/api/schools/plans` | GET | ✅ | Get subscription plans |
| `/api/schools/templates` | GET | ✅ | Get website templates |
| `/api/auth/me` | GET | ❌ | Get user info (token required) |
| `/api/auth/logout` | POST | ❌ | Logout (token required) |

---

## ✅ Pre-requisites

- ✅ Backend server running on `http://localhost:5000`
- ✅ Postman installed (https://www.postman.com/downloads/)
- ✅ Valid database connection configured in backend

### Verify Backend is Running
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

## 🧪 Test Workflow

### Complete Registration → Login Flow

**1. Register a School**
- Endpoint: `POST /api/schools/register`
- Save the response `subdomain` value

**2. Login as Admin**
- Endpoint: `POST /api/auth/login`
- Use subdomain from step 1
- Save the response `token`

**3. Get Current User Info**
- Endpoint: `GET /api/auth/me`
- Add `Authorization: Bearer {token}` header
- Verify you get the user details

**4. Check Plans (Optional)**
- Endpoint: `GET /api/schools/plans`
- See all available subscription plans

**5. Logout (Optional)**
- Endpoint: `POST /api/auth/logout`
- Add `Authorization: Bearer {token}` header

---

## 🔍 Validation Rules

When registering, remember:
- **Password**: Minimum 8 characters, must contain letters and numbers
- **Email**: Must be valid email format, must be unique
- **School Name**: Required, will auto-generate subdomain
- **Subdomain**: Auto-generated but must be unique
- **Plan ID**: Must be one of: `free`, `basic`, `premium`
- **Region**: Must be a valid Cameroon region

---

## 📊 Response Format

All API responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "Additional error details",
  "timestamp": "2026-06-14T08:00:00.000Z"
}
```

---

## 🆘 Troubleshooting

### "Cannot connect to http://localhost:5000"
- **Solution**: Make sure backend server is running: `node src/server.js` from backend directory

### "CORS error"
- **Solution**: Backend is configured for development. Make sure you're sending `Content-Type: application/json` header

### "Invalid email or password"
- **Solution**: Check that email and password match exactly (case-sensitive)

### "Email already exists"
- **Solution**: Use a different email address for testing

### "Password must be at least 8 characters"
- **Solution**: Use a password with minimum 8 characters (e.g., `TestPass@123`)

### "Passwords do not match"
- **Solution**: Ensure `password` and `confirmPassword` fields have identical values

---

## 📝 Testing Checklist

- [ ] Backend server is running
- [ ] Postman is open and collection imported
- [ ] Can register a new school successfully
- [ ] Can login with registered credentials
- [ ] JWT token is received after login
- [ ] Can access protected endpoints with token
- [ ] Logout works correctly
- [ ] Error handling works (try invalid password, duplicate email, etc.)

---

## 🔗 Next Steps After Testing

1. **Test Frontend Integration**
   - Open registration form in browser
   - Submit form to test API integration
   - Verify redirect to login page

2. **Test Login on Frontend**
   - Open login form
   - Use credentials from registration
   - Verify token is saved in localStorage

3. **Build Dashboard**
   - Create dashboard endpoint
   - Add student management
   - Implement grade submission

4. **Setup Production**
   - Configure environment variables
   - Update CORS settings
   - Setup SSL certificate
   - Configure database backups

---

## 📞 Support

If you encounter issues:

1. Check the error message in the response
2. Consult **API_DOCUMENTATION.md** for endpoint details
3. Review **POSTMAN_QUICK_GUIDE.md** for common solutions
4. Verify backend logs for detailed error information

---

## 📦 Files in This Directory

```
akademee/
├── API_DOCUMENTATION.md          # Complete API reference
├── akademee-postman-collection.json  # Import this into Postman
├── POSTMAN_QUICK_GUIDE.md       # Quick start guide
└── API_TESTING_README.md         # This file
```

---

**Backend Status**: ✅ Running on http://localhost:5000  
**API Version**: 1.0.0  
**Last Updated**: 2026-06-14
