package com.enterprise.fast.domain.enums;

/**
 * RAG (Red-Amber-Green) status for escalation tracking.
 * Based on ticket age: G = within 5–15 days, A = >15 days, R = >20 days.
 */
public enum RagStatus {
    G,  // Green  – age ≤ 15 days
    A,  // Amber  – 15 < age ≤ 20 days
    R   // Red    – age > 20 days
}
