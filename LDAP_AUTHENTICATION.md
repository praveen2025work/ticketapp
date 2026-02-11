# LDAP/Windows Authentication Setup

## Overview
The FAST application uses Windows LDAP authentication with BAM (Business Authorization Management) integration. Users are automatically authenticated via Windows credentials, and their roles are determined by the users table in the database.

## Authentication Flow

1. **Windows Authentication**: User authenticates via Windows LDAP/Active Directory
2. **Header Extraction**: Application extracts username from HTTP headers
3. **Database Lookup**: System checks if user exists in the `users` table
4. **Role Assignment**:
   - If user exists: Grants role from database (ADMIN, REVIEWER, PROBLEM_MANAGER, etc.)
   - If user NOT in database: Grants READ_ONLY access

## User Table Schema

```sql
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    brid VARCHAR(20) UNIQUE,              -- Business Resource ID
    password VARCHAR(255) NULL,            -- Nullable for LDAP users
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(30) NOT NULL,
    region VARCHAR(10),
    active BOOLEAN DEFAULT TRUE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## User Roles

| Role | Permissions |
|------|-------------|
| `ADMIN` | Full system access |
| `REVIEWER` | Approve/reject problem tickets |
| `PROBLEM_MANAGER` | Manage problem tickets, update status |
| `TECHNICIAN` | Update ticket status, work on problems |
| `RTB_TEAM` | Create and submit tickets for approval |
| `SERVICE_DESK` | Create and submit tickets |
| `READ_ONLY` | View-only access (auto-assigned to users not in database) |

## HTTP Headers for Authentication

The application checks the following headers in priority order:

1. `X-Authenticated-User` - Custom header from BAM/proxy
2. `REMOTE_USER` - Standard Windows authentication header
3. `X-Remote-User` - Alternative header

## Configuration

### Development/Testing
For local development without Windows authentication, you can simulate authentication by adding headers:

```bash
curl -H "X-Authenticated-User: admin" http://localhost:8081/api/v1/problems
```

### Production Setup
1. Configure IIS or Apache to handle Windows authentication
2. Set up reverse proxy to forward authentication headers
3. Configure BAM to inject `X-Authenticated-User` header
4. Ensure domain prefix is included (e.g., `DOMAIN\\username`)

## Adding New Users

To grant a user specific permissions, add them to the users table:

```sql
INSERT INTO users (username, brid, email, full_name, role, region, active) 
VALUES ('jdoe', 'BR009', 'jdoe@enterprise.com', 'John Doe', 'TECHNICIAN', 'USDS', true);
```

## Security Notes

- No login page is required - authentication is handled by Windows/LDAP
- Passwords are not used for LDAP users (password column is NULL)
- Users not in the database automatically get READ_ONLY access
- Inactive users (active=false) are denied access
- All API endpoints require authentication except Swagger docs and H2 console (dev only)

## Frontend Integration

The frontend should:
1. Remove login page/form
2. Assume user is already authenticated
3. Call `/api/v1/users/me` or similar endpoint to get current user info
4. Show/hide UI elements based on user role
5. Handle 403 Forbidden responses for unauthorized actions
