package com.enterprise.fast.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${cors.allowed-origins:}")
    private String corsAllowedOriginsEnv;

    /**
     * Add CORS origins here when deploying (e.g. Windows Server / IIS).
     * These are merged with defaults and with CORS_ALLOWED_ORIGINS env.
     * Example: "http://WIN-SERVER", "http://192.168.1.10", "https://fast.company.com"
     */
    private static final List<String> CORS_ORIGINS_IN_CODE = List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost",
            "http://localhost:80",
            "http://127.0.0.1:5173"
            // Add your frontend origin(s) here, e.g.:
            // "http://WIN-SERVER",
            // "http://YOUR-SERVER-NAME"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        List<String> origins = CORS_ORIGINS_IN_CODE;
        if (StringUtils.hasText(corsAllowedOriginsEnv)) {
            origins = Stream.concat(
                    Arrays.stream(corsAllowedOriginsEnv.split(",")).map(String::trim).filter(StringUtils::hasText),
                    CORS_ORIGINS_IN_CODE.stream()
            ).distinct().collect(Collectors.toList());
        }
        config.setAllowedOrigins(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new SpaPageResourceResolver());
    }
}
