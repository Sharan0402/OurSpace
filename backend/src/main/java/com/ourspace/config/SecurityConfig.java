package com.ourspace.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.ourspace.service.JwtService;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Stateless security.
 *
 * When Cognito is configured (app.cognito.user-pool-id set), every /api/** call
 * must carry a valid Cognito JWT bearer token (validated against the Cognito
 * JWKS), except the Spotify OAuth login/callback (browser redirects) and health.
 * The two-user allow-list is additionally enforced in {@link AuthorizedUserFilter}.
 *
 * When Cognito is NOT configured (local dev), JWT auth is disabled and the API
 * is open locally; the frontend's mock auth is used instead.
 */
@Configuration
public class SecurityConfig {

    private final AppProperties props;
    private final JwtService jwtService;

    public SecurityConfig(AppProperties props, JwtService jwtService) {
        this.props = props;
        this.jwtService = jwtService;
    }

    /** Endpoints reachable without authentication in any mode. */
    private static final String[] PUBLIC = {
            "/health",
            "/api/auth/login",
            "/api/spotify/login",
            "/api/spotify/callback",
            "/ws/**", // STOMP CONNECT is authorized by the channel interceptor
    };

    @Bean
    public SecurityFilterChain filterChain(
            HttpSecurity http,
            AuthorizedUserFilter authorizedUserFilter,
            JwtAuthFilter jwtAuthFilter
    ) throws Exception {
        String issuer = props.cognito() == null ? null : props.cognito().issuerUri();

        http
            .csrf(csrf -> csrf.disable())
            .cors(Customizer.withDefaults())
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));

        // Built-in two-person auth (chosen for the small private deploy).
        if (issuer == null && jwtService.enabled()) {
            http
                .authorizeHttpRequests(auth -> auth
                    .requestMatchers(PUBLIC).permitAll()
                    .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
            return http.build();
        }

        if (issuer == null) {
            // Dev mode: no auth configured → open API (frontend uses mock auth).
            http.authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }

        http
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(
                        "/health",
                        "/api/spotify/login",
                        "/api/spotify/callback",
                        "/ws/**"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .oauth2ResourceServer(oauth -> oauth.jwt(jwt -> jwt.decoder(jwtDecoder(issuer))))
            // Enforce the two-user allow-list right after JWT authentication.
            .addFilterAfter(authorizedUserFilter,
                    org.springframework.security.web.access.intercept.AuthorizationFilter.class);
        return http.build();
    }

    private static JwtDecoder jwtDecoder(String issuer) {
        return JwtDecoders.fromIssuerLocation(issuer);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration cfg = new CorsConfiguration();
        cfg.setAllowedOrigins(List.of(props.frontendOrigin()));
        cfg.setAllowedMethods(List.of("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        cfg.setAllowedHeaders(List.of("*"));
        cfg.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", cfg);
        return source;
    }
}
