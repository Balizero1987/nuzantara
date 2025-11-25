# ==============================================
# 🐳 Dockerfile for ZANTARA Frontend
# Static site serving with Nginx
# ==============================================

# Stage 1: Production (Nginx)
FROM nginx:alpine-slim

# Remove default Nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy static assets from the project
# Note: Assuming the context is the `apps/webapp` folder
COPY . /usr/share/nginx/html

# Expose port 8080 (as configured in nginx.conf)
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
