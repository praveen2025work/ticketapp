package com.enterprise.fast.config;

import org.springframework.core.io.Resource;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

/**
 * Serves index.html for SPA client-side routes (e.g. /dashboard, /tickets) when no static file exists.
 * API, swagger, and other backend paths are excluded.
 */
public class SpaPageResourceResolver extends PathResourceResolver {

    @Override
    protected Resource getResource(String resourcePath, Resource location) throws IOException {
        // Root path: resolve index.html directly to avoid returning a directory (causes 500 when writing response)
        if (resourcePath == null || resourcePath.isEmpty() || "/".equals(resourcePath)) {
            resourcePath = "index.html";
        }
        Resource resource = location.createRelative(resourcePath);
        if (resource.exists() && resource.isReadable()) {
            return resource;
        }
        // SPA fallback: serve index.html for client-side routes (paths without file extension)
        // Exclude API, swagger, h2-console, actuator
        if (!resourcePath.startsWith("api")
                && !resourcePath.startsWith("swagger")
                && !resourcePath.startsWith("v3")
                && !resourcePath.startsWith("h2-console")
                && !resourcePath.startsWith("actuator")) {
            Resource indexHtml = location.createRelative("index.html");
            if (indexHtml.exists() && indexHtml.isReadable()) {
                return indexHtml;
            }
        }
        return null;
    }
}
