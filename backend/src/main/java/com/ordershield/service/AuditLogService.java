package com.ordershield.service;

import com.ordershield.entity.AuditLog;
import com.ordershield.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Transactional
    public AuditLog record(String actorEmail, String action, String resourceType, String resourceId, String details) {
        AuditLog log = new AuditLog(actorEmail, action, resourceType, resourceId, details);
        return auditLogRepository.save(log);
    }

    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    @Transactional
    public void deleteLog(Long id) {
        auditLogRepository.deleteById(id);
    }

    @Transactional
    public void clearAll() {
        auditLogRepository.deleteAll();
    }
}
