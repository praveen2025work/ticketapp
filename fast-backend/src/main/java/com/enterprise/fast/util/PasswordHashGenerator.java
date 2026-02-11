package com.enterprise.fast.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "password123";
        String hash = encoder.encode(password);

        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash: " + hash);
        System.out.println("Matches: " + encoder.matches(password, hash));

        // Test against the hash in the database
        String dbHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        System.out.println("\nTesting against DB hash:");
        System.out.println("DB Hash: " + dbHash);
        System.out.println("Matches: " + encoder.matches(password, dbHash));
    }
}
