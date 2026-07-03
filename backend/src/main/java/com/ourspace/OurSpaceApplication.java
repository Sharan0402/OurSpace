package com.ourspace;

import com.ourspace.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
public class OurSpaceApplication {
    public static void main(String[] args) {
        SpringApplication.run(OurSpaceApplication.class, args);
    }
}
