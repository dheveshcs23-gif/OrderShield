package com.ordershield.repository;

import com.ordershield.entity.ProtectedAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProtectedAddressRepository extends JpaRepository<ProtectedAddress, Long> {
    Optional<ProtectedAddress> findByNormalizedHashAndIsActiveTrue(String normalizedHash);

    @Query("SELECT p FROM ProtectedAddress p WHERE p.owner.id = :ownerId")
    List<ProtectedAddress> findByOwnerId(@Param("ownerId") Long ownerId);

    @Query("SELECT p FROM ProtectedAddress p WHERE LOWER(p.owner.email) = LOWER(:ownerEmail) AND p.isActive = true")
    List<ProtectedAddress> findByOwnerEmailIgnoreCase(@Param("ownerEmail") String ownerEmail);

    boolean existsByNormalizedHash(String normalizedHash);
}
