package com.enterprise.fast.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * One-time utility for generating BCrypt hashes for seed data (e.g. local H2).
 * Do not use in production runtime paths. Run manually when preparing seed data only.
 */
public final class PasswordHashGenerator {

    private PasswordHashGenerator() {}

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String password = "password123";
        String hash = encoder.encode(password);

        System.out.println("BCrypt Hash: " + hash);
        System.out.println("Matches: " + encoder.matches(password, hash));

        String dbHash = "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy";
        System.out.println("Matches DB seed: " + encoder.matches(password, dbHash));
    }
}
