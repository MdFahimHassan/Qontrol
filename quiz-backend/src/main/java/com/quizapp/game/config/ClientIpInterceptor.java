package com.quizapp.game.config;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

/**
 * Remembers who opened each socket. STOMP messages carry no IP of their own, so we
 * store it in the session attributes at handshake time and read it back when
 * rate-limiting joins (see GameSocketController).
 */
public class ClientIpInterceptor implements HandshakeInterceptor {

    public static final String ATTRIBUTE = "clientIp";

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                   WebSocketHandler wsHandler, Map<String, Object> attributes) {
        String ip = "unknown";
        if (request instanceof ServletServerHttpRequest servletRequest) {
            ip = servletRequest.getServletRequest().getRemoteAddr();
        }
        attributes.put(ATTRIBUTE, ip);
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // nothing to clean up
    }
}