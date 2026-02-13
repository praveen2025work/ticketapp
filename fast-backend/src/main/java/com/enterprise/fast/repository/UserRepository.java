package com.enterprise.fast.repository;

import com.enterprise.fast.domain.entity.User;
import com.enterprise.fast.domain.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    Optional<User> findByUsernameIgnoreCase(String username);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.applications WHERE LOWER(u.username) = LOWER(:username)")
    Optional<User> findByUsernameWithApplicationsIgnoreCase(@Param("username") String username);

    @Query("SELECT u FROM User u LEFT JOIN FETCH u.applications WHERE u.username = :username")
    Optional<User> findByUsernameWithApplications(@Param("username") String username);

    @Query(value = "select distinct u from User u left join fetch u.applications", countQuery = "select count(u) from User u")
    Page<User> findAllWithApplications(Pageable pageable);

    Optional<User> findByEmail(String email);

    List<User> findByRoleInAndActiveTrue(List<UserRole> roles);

    /** TECH_LEAD users that are linked to at least one of the given application IDs (for BTB Tech Lead by ticket impacted apps). */
    @Query("SELECT DISTINCT u FROM User u LEFT JOIN FETCH u.applications WHERE u.role = :role AND u.active = true AND u.id IN (SELECT u2.id FROM User u2 JOIN u2.applications a WHERE a.id IN :applicationIds)")
    Set<User> findTechLeadsByApplicationIds(@Param("role") UserRole role, @Param("applicationIds") List<Long> applicationIds);

    boolean existsByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByEmail(String email);
}
