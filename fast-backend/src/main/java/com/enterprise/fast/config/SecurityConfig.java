package com.enterprise.fast.config;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    private final BamAuthenticationFilter bamAuthenticationFilter;

    private final CorsConfigurationSource corsConfigurationSource;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .headers(headers -> headers.frameOptions(HeadersConfigurer.FrameOptionsConfig::disable))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no auth needed)
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                        .requestMatchers("/h2-console/**").permitAll()
                        .requestMatchers("/actuator/**").permitAll()
                        .requestMatchers("/api/v1/bam/**").permitAll() // BAM SSO endpoints
                        .requestMatchers("/api/v1/auth/login").permitAll() // Login form (local mode)

                        // Allow all authenticated users (including READ_ONLY) to view data
                        .requestMatchers(HttpMethod.GET, "/api/v1/**").authenticated()

                        // Problem endpoints — ADMIN creates tickets
                        .requestMatchers(HttpMethod.POST, "/api/v1/problems")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/problems/**")
                        .hasAnyRole("ADMIN", "RTB_OWNER", "TECH_LEAD")
                        .requestMatchers(HttpMethod.DELETE, "/api/v1/problems/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/v1/problems/*/status")
                        .hasAnyRole("ADMIN", "RTB_OWNER", "TECH_LEAD")

                        // Knowledge base (update = ADMIN + TECH_LEAD)
                        .requestMatchers(HttpMethod.PUT, "/api/v1/knowledge/**")
                        .hasAnyRole("ADMIN", "TECH_LEAD")

                        // Approval endpoints — ADMIN submits; REVIEWER, APPROVER, RTB_OWNER approve/reject
                        .requestMatchers(HttpMethod.POST, "/api/v1/approvals/problems/*/submit")
                        .hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/v1/approvals/*/approve", "/api/v1/approvals/*/reject")
                        .hasAnyRole("REVIEWER", "APPROVER", "RTB_OWNER", "ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/v1/approvals/pending")
                        .hasAnyRole("REVIEWER", "APPROVER", "RTB_OWNER", "ADMIN")

                        // Admin endpoints
                        .requestMatchers("/api/v1/auth/register").hasRole("ADMIN")
                        .requestMatchers("/api/v1/audit/recent").hasRole("ADMIN")

                        // All other authenticated endpoints
                        .anyRequest().authenticated())
                .addFilterBefore(bamAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
