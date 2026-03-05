package com.enterprise.fast.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "interview_schedule_entry",
        uniqueConstraints = @UniqueConstraint(name = "uq_interview_schedule_entry_slot", columnNames = {"interview_schedule_id", "time_slot"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewScheduleEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_schedule_id", nullable = false)
    private InterviewSchedule interviewSchedule;

    @Column(name = "time_slot", nullable = false, length = 5)
    private String timeSlot;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Lob
    @Column(name = "business_function")
    private String businessFunction;

    @Lob
    @Column(name = "applications_used")
    private String applicationsUsed;

    @Lob
    @Column(name = "process_improvements")
    private String processImprovements;

    @Lob
    @Column(name = "tech_issues_to_resolve")
    private String techIssuesToResolve;

    @Lob
    @Column(name = "ticket_raised")
    private String ticketRaised;
}
