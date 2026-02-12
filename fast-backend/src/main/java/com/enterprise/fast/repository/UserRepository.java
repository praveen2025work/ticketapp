package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    @Query(value = "select distinct u from User u left join fetch u.applications", countQuery = "select count(u) from User u")
    Page<User> findAllWithApplications(Pageable pageable);

    Optional<User> findByEmail(String email);

    List<User> findByRoleInAndActiveTrue(List<UserRole> roles);

    boolean existsByUsername(String username);

    boolean existsByEmail(String email);
}
