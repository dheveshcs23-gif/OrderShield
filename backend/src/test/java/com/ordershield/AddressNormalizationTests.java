package com.ordershield;

import com.ordershield.service.AddressNormalizationService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class AddressNormalizationTests {

    private final AddressNormalizationService service = new AddressNormalizationService();

    @Test
    @DisplayName("Should normalize street abbreviations and casing consistently")
    void testStreetNormalization() {
        String norm1 = service.normalize("742 Evergreen Street", "Apt 4B", "Springfield", "97477");
        String norm2 = service.normalize("742 Evergreen St.", "apt 4b", "Springfield", "97477");
        String norm3 = service.normalize("742 EVERGREEN ST", "Apt. 4B", "springfield", "97477");

        assertEquals(norm1, norm2, "Abbreviation 'St.' should match 'Street'");
        assertEquals(norm1, norm3, "Casing and punctuation variations should normalize identically");
    }

    @Test
    @DisplayName("Should produce identical hash for equivalent addresses")
    void testAddressHashConsistency() {
        String hash1 = service.computeHash("100 Main Avenue", "Suite 200", "Portland", "97201");
        String hash2 = service.computeHash("100 Main Ave.", "ste 200", "portland", "97201");

        assertNotNull(hash1);
        assertEquals(hash1, hash2, "Hashes for matching addresses must be identical");
    }

    @Test
    @DisplayName("Should differentiate distinct addresses")
    void testDistinctAddresses() {
        String hash1 = service.computeHash("742 Evergreen Terrace", "Apt 4B", "Springfield", "97477");
        String hash2 = service.computeHash("743 Evergreen Terrace", "Apt 4B", "Springfield", "97477");

        assertNotEquals(hash1, hash2, "Different house numbers must yield different hashes");
    }
}
