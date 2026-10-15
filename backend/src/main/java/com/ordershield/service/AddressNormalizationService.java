package com.ordershield.service;

import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

@Service
public class AddressNormalizationService {

    public String normalize(String street, String unit, String city, String postalCode) {
        String cleanStreet = standardizeTokens(street);
        String cleanUnit = standardizeUnitTokens(unit);
        String cleanCity = cleanAlphanumeric(city);
        String cleanPostal = cleanAlphanumeric(postalCode);

        return String.format("%s|%s|%s|%s", cleanStreet, cleanUnit, cleanCity, cleanPostal);
    }

    public String computeHash(String street, String unit, String city, String postalCode) {
        String normalized = normalize(street, unit, city, postalCode);
        return sha256(normalized);
    }

    private String standardizeTokens(String text) {
        if (text == null) return "";
        String lower = text.toLowerCase(Locale.ROOT).trim();
        String standardized = lower
                .replaceAll("\\b(street|st\\.?)\\b", "st")
                .replaceAll("\\b(avenue|ave\\.?)\\b", "ave")
                .replaceAll("\\b(road|rd\\.?)\\b", "rd")
                .replaceAll("\\b(boulevard|blvd\\.?)\\b", "blvd")
                .replaceAll("\\b(drive|dr\\.?)\\b", "dr")
                .replaceAll("\\b(terrace|ter\\.?)\\b", "terrace")
                .replaceAll("\\b(court|ct\\.?)\\b", "court")
                .replaceAll("\\b(lane|ln\\.?)\\b", "lane");
        return cleanAlphanumeric(standardized);
    }

    private String standardizeUnitTokens(String text) {
        if (text == null) return "";
        String lower = text.toLowerCase(Locale.ROOT).trim();
        String standardized = lower
                .replaceAll("\\b(apartment|apt\\.?)\\b", "apt")
                .replaceAll("\\b(suite|ste\\.?)\\b", "ste")
                .replaceAll("\\b(unit|un\\.?)\\b", "unit");
        return cleanAlphanumeric(standardized);
    }

    private String cleanAlphanumeric(String text) {
        if (text == null) return "";
        return text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]", "");
    }

    private String sha256(String base) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm unavailable", e);
        }
    }
}
