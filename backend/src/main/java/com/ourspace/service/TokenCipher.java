package com.ourspace.service;

import com.ourspace.config.AppProperties;
import org.springframework.stereotype.Component;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * AES-256-GCM encryption for Spotify refresh tokens at rest.
 *
 * The key is a base64-encoded 256-bit secret provided via TOKEN_ENCRYPTION_KEY
 * (store in AWS Secrets Manager / SSM in production). Output format is
 * base64(iv || ciphertext || tag).
 */
@Component
public class TokenCipher {

    private static final int IV_LENGTH = 12;
    private static final int TAG_BITS = 128;
    private static final String TRANSFORMATION = "AES/GCM/NoPadding";

    private final SecretKeySpec keySpec;
    private final SecureRandom random = new SecureRandom();

    public TokenCipher(AppProperties props) {
        String key = props.crypto() == null ? null : props.crypto().key();
        if (key == null || key.isBlank()) {
            // Dev fallback: deterministic key so the app boots without config.
            // NEVER rely on this in production — set TOKEN_ENCRYPTION_KEY.
            byte[] dev = new byte[32];
            System.arraycopy(
                    "our-space-dev-insecure-key-00000".getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    0, dev, 0, 32);
            this.keySpec = new SecretKeySpec(dev, "AES");
        } else {
            this.keySpec = new SecretKeySpec(Base64.getDecoder().decode(key), "AES");
        }
    }

    public String encrypt(String plaintext) {
        try {
            byte[] iv = new byte[IV_LENGTH];
            random.nextBytes(iv);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, new GCMParameterSpec(TAG_BITS, iv));
            byte[] ct = cipher.doFinal(plaintext.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            ByteBuffer buf = ByteBuffer.allocate(iv.length + ct.length);
            buf.put(iv).put(ct);
            return Base64.getEncoder().encodeToString(buf.array());
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt token", e);
        }
    }

    public String decrypt(String encoded) {
        try {
            byte[] all = Base64.getDecoder().decode(encoded);
            ByteBuffer buf = ByteBuffer.wrap(all);
            byte[] iv = new byte[IV_LENGTH];
            buf.get(iv);
            byte[] ct = new byte[buf.remaining()];
            buf.get(ct);
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, keySpec, new GCMParameterSpec(TAG_BITS, iv));
            return new String(cipher.doFinal(ct), java.nio.charset.StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt token", e);
        }
    }
}
