package com.ordershield.exception;

public class SecurityViolationException extends ApiException {
    public SecurityViolationException(String message) {
        super(message);
    }
}
