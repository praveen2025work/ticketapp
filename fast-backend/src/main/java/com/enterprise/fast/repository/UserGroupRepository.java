package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.UserGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserGroupRepository extends JpaRepository<UserGroup, Long> {

    Optional<UserGroup> findByNameIgnoreCase(String name);

    List<UserGroup> findAllByOrderByNameAsc();

    List<UserGroup> findByActiveTrueOrderByNameAsc();
}
