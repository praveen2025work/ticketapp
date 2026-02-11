package com.enterprise.fast.domain.enums;

public enum UserRole {
    ADMIN,          // Creates/clones tickets, owns & closes them
    REVIEWER,       // Business Review Owner — reviews if FAST issue
    APPROVER,       // IT Review Owner — gives IT approval
    RTB_OWNER,      // RTB Lead — assigns to ADMIN or TECH_LEAD after approval
    TECH_LEAD,      // BTB Lead — owns technical fix, finishes it
    READ_ONLY       // Default for users authenticated via LDAP but not in the database
}
