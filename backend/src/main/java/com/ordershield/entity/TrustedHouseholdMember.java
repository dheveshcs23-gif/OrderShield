package com.ordershield.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "trusted_household_members")
public class TrustedHouseholdMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "protected_address_id", nullable = false)
    private ProtectedAddress protectedAddress;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "member_user_id")
    private User memberUser;

    @Column(name = "member_email")
    private String memberEmail;

    @Column(name = "member_phone")
    private String memberPhone;

    @Column(name = "member_name", nullable = false)
    private String memberName;

    @Column
    private String relationship;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HouseholdMemberStatus status = HouseholdMemberStatus.ACTIVE;

    @Column(name = "invited_at", nullable = false, updatable = false)
    private Instant invitedAt = Instant.now();

    @Column(name = "accepted_at")
    private Instant acceptedAt = Instant.now();

    @Column(name = "revoked_at")
    private Instant revokedAt;

    public TrustedHouseholdMember() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ProtectedAddress getProtectedAddress() { return protectedAddress; }
    public void setProtectedAddress(ProtectedAddress protectedAddress) { this.protectedAddress = protectedAddress; }

    public User getMemberUser() { return memberUser; }
    public void setMemberUser(User memberUser) { this.memberUser = memberUser; }

    public String getMemberEmail() { return memberEmail; }
    public void setMemberEmail(String memberEmail) { this.memberEmail = memberEmail; }

    public String getMemberPhone() { return memberPhone; }
    public void setMemberPhone(String memberPhone) { this.memberPhone = memberPhone; }

    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }

    public String getRelationship() { return relationship; }
    public void setRelationship(String relationship) { this.relationship = relationship; }

    public HouseholdMemberStatus getStatus() { return status; }
    public void setStatus(HouseholdMemberStatus status) { this.status = status; }

    public Instant getInvitedAt() { return invitedAt; }
    public void setInvitedAt(Instant invitedAt) { this.invitedAt = invitedAt; }

    public Instant getAcceptedAt() { return acceptedAt; }
    public void setAcceptedAt(Instant acceptedAt) { this.acceptedAt = acceptedAt; }

    public Instant getRevokedAt() { return revokedAt; }
    public void setRevokedAt(Instant revokedAt) { this.revokedAt = revokedAt; }
}
