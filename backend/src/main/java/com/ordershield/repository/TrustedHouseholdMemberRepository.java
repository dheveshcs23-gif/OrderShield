package com.ordershield.repository;

import com.ordershield.entity.HouseholdMemberStatus;
import com.ordershield.entity.TrustedHouseholdMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrustedHouseholdMemberRepository extends JpaRepository<TrustedHouseholdMember, Long> {
    List<TrustedHouseholdMember> findByProtectedAddressId(Long protectedAddressId);
    
    List<TrustedHouseholdMember> findByProtectedAddressIdAndStatus(Long protectedAddressId, HouseholdMemberStatus status);

    void deleteByProtectedAddressId(Long protectedAddressId);

    Optional<TrustedHouseholdMember> findByProtectedAddressIdAndMemberEmailIgnoreCaseAndStatus(
            Long protectedAddressId, String memberEmail, HouseholdMemberStatus status);

    boolean existsByProtectedAddressIdAndMemberEmailIgnoreCaseAndStatus(
            Long protectedAddressId, String memberEmail, HouseholdMemberStatus status);

    List<TrustedHouseholdMember> findByMemberEmailIgnoreCaseAndStatus(String memberEmail, HouseholdMemberStatus status);
}
