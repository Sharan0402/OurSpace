package com.ourspace.repository;

import com.ourspace.model.SpotifyTokenRecord;

import java.util.Optional;

public interface SpotifyTokenRepository {
    SpotifyTokenRecord save(SpotifyTokenRecord record);
    Optional<SpotifyTokenRecord> findByUserId(String userId);
    void deleteByUserId(String userId);
}
