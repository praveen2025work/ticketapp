# BAM SSO Authentication Implementation Guide

## Overview
The FAST application now supports **BAM (Business Authorization Management) SSO** authentication with environment-based configuration:
- **Local Environment**: Bypasses authentication for easy development
- **Dev/Prod Environment**: Uses BAM SSO with Windows AD integration

---

## 🔄 Authentication Flow

### End-to-End Flow

```
1. User accesses application (already authenticated via Windows SSO)
   ↓
2. Frontend calls: GET /api/v1/bam/token?appName=FAST&redirectURL=...
   ↓
3. Backend calls: GET /authn/authenticate/sso/api (BAM SSO endpoint)
   ↓
4. BAM returns: { "code": "SUCCESS", "bamToken": "jwt.token...", "redirectURL": "..." }
   ↓
5. Frontend stores BAM token in memory/session
   ↓
6. Frontend calls application APIs with headers:
   - Authorization: Bearer <bamToken>
   - X-User-Name: <username>
   ↓
7. Backend validates token and loads user from database
   ↓
8. User-specific data is returned
```

---

## 📋 API Endpoints

### 1️⃣ Get Windows AD User Details

**Purpose**: Identify user via enterprise SSO

**Endpoint**:
```
GET /api/getADUsers
```

**Authentication**: Windows Integrated Authentication (implicit)

**Response**:
```json
{
  "userName": "user123",
  "displayName": "Doe, John",
  "email": "john.doe@company.com"
}
```

---

### 2️⃣ Get BAM Token

**Purpose**: Exchange SSO session for BAM token

**Endpoint**:
```
GET /authn/authenticate/sso/api
```

**Query Parameters**:
- `appName`: Application name (e.g., `FAST_PROBLEM_TICKET_SYSTEM`)
- `redirectURL`: Application redirect URL (e.g., `http://localhost:8081/api`)

**Authentication**: Enterprise SSO (implicit)

**Response**:
```json
{
  "code": "SUCCESS",
  "bamToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectURL": "http://localhost:8081/api"
}
```

---

### 3️⃣ Application API Calls (Using BAM Token)

**Purpose**: Fetch user-specific data

**Example Endpoint**:
```
GET /api/v1/problems
```

**Headers**:
```
Authorization: Bearer <bamToken>
X-User-Name: user123
```

**Response**: User-specific problem tickets

---

## ⚙️ Configuration

### Backend Configuration (`application.yml`)

```yaml
# Application Authentication Mode
app:
  auth:
    mode: local  # Options: local, bam
    local:
      default-user: admin  # Default user for local development

# BAM SSO Configuration
bam:
  sso:
    url: http://bam-server/authn/authenticate/sso/api
  ad:
    url: http://ad-server/api/getADUsers
  app:
    name: FAST_PROBLEM_TICKET_SYSTEM
    redirect-url: http://localhost:8081/api
```

### Environment Modes

#### Local Mode (`app.auth.mode: local`)
- **Purpose**: Development without BAM infrastructure
- **Behavior**:
  - Auto-authenticates with `app.auth.local.default-user`
  - Supports dev user switcher (X-Authenticated-User header)
  - No BAM token required
  - Perfect for local testing

#### BAM Mode (`app.auth.mode: bam`)
- **Purpose**: Production/Dev environments with BAM SSO
- **Behavior**:
  - Requires BAM token in `Authorization: Bearer <token>` header
  - Extracts username from `X-User-Name` header
  - Validates token with BAM
  - Loads user from database
  - Users not in DB get READ_ONLY access

---

## 🔧 Frontend Integration

### 1. Get BAM Token on App Load

```typescript
// services/bamService.ts
export const getBamToken = async () => {
  const response = await fetch(
    `/api/v1/bam/token?appName=FAST_PROBLEM_TICKET_SYSTEM&redirectURL=${window.location.origin}/api`
  );
  const data = await response.json();
  return data.bamToken;
};
```

### 2. Store BAM Token

```typescript
// Store in memory (recommended) or sessionStorage
let bamToken: string | null = null;

export const setBamToken = (token: string) => {
  bamToken = token;
  // Or use sessionStorage for persistence across page reloads
  // sessionStorage.setItem('bam_token', token);
};

export const getBamTokenFromStorage = () => {
  return bamToken;
  // Or: return sessionStorage.getItem('bam_token');
};
```

### 3. Add BAM Token to API Requests

```typescript
// axiosClient.ts
import axios from 'axios';
import { getBamTokenFromStorage } from './bamService';

const axiosClient = axios.create({
  baseURL: '/api/v1',
});

axiosClient.interceptors.request.use((config) => {
  const bamToken = getBamTokenFromStorage();
  
  if (bamToken) {
    config.headers['Authorization'] = `Bearer ${bamToken}`;
  }
  
  // Optionally add username header
  const username = getCurrentUsername(); // Get from user context
  if (username) {
    config.headers['X-User-Name'] = username;
  }
  
  return config;
});

export default axiosClient;
```

### 4. Initialize on App Load

```typescript
// App.tsx or main entry point
useEffect(() => {
  const initAuth = async () => {
    try {
      // Get BAM token
      const token = await getBamToken();
      setBamToken(token);
      
      // Get current user details
      const user = await getCurrentUser();
      setUser(user);
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };
  
  initAuth();
}, []);
```

---

## 🔐 Security Features

### Token Validation
- BAM token is validated on every request
- Expired tokens return 401 Unauthorized
- Invalid tokens are rejected

### User Authorization
- Users in database: Get assigned role (ADMIN, REVIEWER, etc.)
- Users NOT in database: Get READ_ONLY access
- Inactive users: Access denied (403 Forbidden)

### Role-Based Access Control
- **ADMIN**: Full access
- **REVIEWER**: Approve/reject tickets
- **PROBLEM_MANAGER**: Manage tickets
- **TECHNICIAN**: Update ticket status
- **RTB_TEAM**: Create tickets
- **SERVICE_DESK**: Create tickets
- **READ_ONLY**: View-only access

---

## 🧪 Testing

### Local Development
1. Set `app.auth.mode: local` in `application.yml`
2. Run application normally
3. Use dev user switcher to test different roles
4. No BAM infrastructure needed

### Dev/Prod Environment
1. Set `app.auth.mode: bam` in `application.yml`
2. Configure BAM URLs in `application.yml`
3. Ensure Windows authentication is enabled
4. Test with actual BAM tokens

### Testing with cURL

**Local Mode**:
```bash
# Auto-authenticated as admin
curl http://localhost:8081/api/v1/problems

# Test as different user
curl -H "X-Authenticated-User: siresh" http://localhost:8081/api/v1/problems
```

**BAM Mode**:
```bash
# Get BAM token first
curl "http://localhost:8081/api/v1/bam/token?appName=FAST&redirectURL=http://localhost:8081/api"

# Use token in requests
curl -H "Authorization: Bearer <bamToken>" \
     -H "X-User-Name: user123" \
     http://localhost:8081/api/v1/problems
```

---

## 📝 Migration Checklist

### Backend
- [x] Create `BamAuthenticationFilter`
- [x] Create `BamService` and implementation
- [x] Create BAM DTOs (`BamAuthResponse`, `AdUserResponse`)
- [x] Create `BamController` for SSO endpoints
- [x] Update `SecurityConfig` to use BAM filter
- [x] Add configuration properties
- [x] Support environment-based switching

### Frontend
- [ ] Create BAM service to get token
- [ ] Update axios client to send BAM token
- [ ] Store token in memory/session
- [ ] Add X-User-Name header to requests
- [ ] Handle token expiration
- [ ] Test with both local and BAM modes

### Deployment
- [ ] Configure BAM URLs for dev environment
- [ ] Configure BAM URLs for prod environment
- [ ] Enable Windows authentication on IIS/Apache
- [ ] Test end-to-end flow
- [ ] Document for operations team

---

## 🚀 Quick Start

### For Local Development
```yaml
# application.yml
app:
  auth:
    mode: local
    local:
      default-user: admin
```

Run application - authentication is automatic!

### For Dev/Prod
```yaml
# application.yml
app:
  auth:
    mode: bam

bam:
  sso:
    url: https://your-bam-server/authn/authenticate/sso/api
  ad:
    url: https://your-ad-server/api/getADUsers
```

Frontend must call `/api/v1/bam/token` and include token in requests.

---

## 📞 Support

For issues or questions:
1. Check logs for authentication errors
2. Verify BAM URLs are correct
3. Ensure Windows authentication is enabled
4. Confirm user exists in database
5. Check token expiration

---

## 🔗 Related Documentation
- `LDAP_AUTHENTICATION.md` - Previous LDAP implementation
- `LDAP_IMPLEMENTATION_SUMMARY.md` - Migration details
- API documentation: http://localhost:8081/swagger-ui.html
