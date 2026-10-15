package com.ordershield.repository;

import com.ordershield.entity.AuthorizationRequest;
import com.ordershield.entity.AuthorizationRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthorizationRequestRepository extends JpaRepository<AuthorizationRequest, Long> {
    @Query("SELECT r FROM AuthorizationRequest r WHERE LOWER(r.owner.email) = LOWER(:ownerEmail) ORDER BY r.requestedAt DESC")
    List<AuthorizationRequest> findByOwnerEmailIgnoreCaseOrderByRequestedAtDesc(@Param("ownerEmail") String ownerEmail);

    @Query("SELECT r FROM AuthorizationRequest r WHERE r.owner.id = :ownerId ORDER BY r.requestedAt DESC")
    List<AuthorizationRequest> findByOwnerIdOrderByRequestedAtDesc(@Param("ownerId") Long ownerId);

    Optional<AuthorizationRequest> findByOrderId(Long orderId);
    List<AuthorizationRequest> findByStatus(AuthorizationRequestStatus status);
    List<AuthorizationRequest> findByProtectedAddressId(Long protectedAddressId);
    void deleteByProtectedAddressId(Long protectedAddressId);
}
