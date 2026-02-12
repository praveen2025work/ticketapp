package com.enterprise.fast.domain.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "app_settings", indexes = @Index(columnList = "setting_key", unique = true))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "setting_key", nullable = false, unique = true, length = 100)
    private String settingKey;

    @Lob
    @Column(name = "setting_value")
    private String settingValue;

    @Column(length = 255)
    private String description;
}
