package com.pulsetrade.service;

import com.pulsetrade.dto.request.LoginRequest;
import com.pulsetrade.dto.request.RegisterRequest;
import com.pulsetrade.dto.response.AuthResponse;
import com.pulsetrade.dto.response.UserResponse;
import com.pulsetrade.entity.User;
import com.pulsetrade.exception.ConflictException;
import com.pulsetrade.exception.NotFoundException;
import com.pulsetrade.repository.UserRepository;
import com.pulsetrade.security.JwtService;

import java.util.Locale;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (users.existsByEmailIgnoreCase(email)) {
            throw new ConflictException("An account with this email already exists");
        }
        String name = request.name() == null || request.name().isBlank()
                ? email.substring(0, email.indexOf('@'))
                : request.name().trim();
        User user = users.save(new User(email, passwordEncoder.encode(request.password()), name));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        User user = users.findByEmailIgnoreCase(request.email().trim())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(Long userId) {
        return users.findById(userId).map(UserResponse::from)
                .orElseThrow(() -> new NotFoundException("User not found"));
    }

    private AuthResponse toResponse(User user) {
        return new AuthResponse(jwtService.generateToken(user.getId(), user.getEmail()), UserResponse.from(user));
    }
}
