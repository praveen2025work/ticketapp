package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.InterviewSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewSchedule, Long> {

    List<InterviewSchedule> findAllByOrderByInterviewDateDescCreatedDateDesc();
}
