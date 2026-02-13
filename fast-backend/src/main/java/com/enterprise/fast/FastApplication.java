package com.enterprise.fast;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FastApplication {

    private static final Logger log = LoggerFactory.getLogger(FastApplication.class);

    public static void main(String[] args) {
        SpringApplication.run(FastApplication.class, args);
        log.info("FAST Backend started; application and audit logs are written to logs/ with automatic rotation and archiving");
    }
}
