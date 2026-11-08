package com.quizapp.game.config;

import com.quizapp.security.CustomUserDetailsService;
import com.quizapp.security.JwtUtil;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.security.Principal;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Runs on every inbound STOMP frame.
 *
 *  CONNECT   - hosts send `Authorization: Bearer <jwt>` as a STOMP header and become an
 *              authenticated principal. Players send nothing and get a random guest
 *              principal (that name is how the server finds them again later).
 *  SUBSCRIBE - only room topics and the caller's own /user/queue/** are allowed.
 */
@Component
public class StompAuthInterceptor implements ChannelInterceptor {

    private static final Pattern ROOM_TOPIC = Pattern.compile("^/topic/room/\\d{6}$");

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsService;

    public StompAuthInterceptor(JwtUtil jwtUtil, CustomUserDetailsService userDetailsService) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    /** Anonymous player connection. */
    public record GuestPrincipal(String id) implements Principal {
        @Override
        public String getName() {
            return id;
        }
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }
        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            accessor.setUser(authenticate(accessor.getFirstNativeHeader("Authorization")));
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            checkSubscription(accessor.getDestination());
        }
        return message;
    }

    private Principal authenticate(String header) {
        if (!StringUtils.hasText(header)) {
            return new GuestPrincipal(UUID.randomUUID().toString());
        }
        if (!header.startsWith("Bearer ")) {
            throw new MessagingException("Malformed Authorization header");
        }
        UserDetails userDetails;
        try {
            String token = header.substring(7);
            userDetails = userDetailsService.loadUserByUsername(jwtUtil.extractUsername(token));
            if (!jwtUtil.validateToken(token, userDetails)) {
                userDetails = null;
            }
        } catch (Exception e) {
            userDetails = null;
        }
        if (userDetails == null) {
            // Reject the CONNECT outright so an expired host token fails loudly instead of
            // silently downgrading the host to a guest.
            throw new MessagingException("Invalid or expired token");
        }
        return new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
    }

    private void checkSubscription(String destination) {
        if (destination == null) {
            throw new MessagingException("Missing destination");
        }
        boolean allowed = ROOM_TOPIC.matcher(destination).matches()
                || destination.startsWith("/user/queue/");
        if (!allowed) {
            throw new MessagingException("Subscription not allowed: " + destination);
        }
    }
}