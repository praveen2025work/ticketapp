package com.enterprise.fast.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "interview_schedule")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "business_area", length = 150)
    private String businessArea;

    @Column(name = "pc_director", length = 150)
    private String pcDirector;

    @Column(name = "product_controller", length = 150)
    private String productController;

    @Column(name = "named_pnls", length = 500)
    private String namedPnls;

    @Column(length = 150)
    private String location;

    @Column(name = "interviewed_by", length = 150)
    private String interviewedBy;

    @Column(name = "interview_date")
    private LocalDate interviewDate;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "created_date")
    @Builder.Default
    private LocalDateTime createdDate = LocalDateTime.now();

    @Column(name = "updated_date")
    @Builder.Default
    private LocalDateTime updatedDate = LocalDateTime.now();

    @OneToMany(mappedBy = "interviewSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    @Builder.Default
    private List<InterviewScheduleEntry> entries = new ArrayList<>();

    @PreUpdate
    public void preUpdate() {
        this.updatedDate = LocalDateTime.now();
    }
}
