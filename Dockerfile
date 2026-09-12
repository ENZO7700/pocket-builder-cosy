# Dockerfile for Cosy Pocket Builder with Self-Repair Loop
# Uses official Playwright base image for Chromium support
# Designed for VPS deployment (Hetzner CPX21/CPX31)

# Use official Playwright base image with Node 22
# Version must match package.json's playwright dependency
FROM mcr.microsoft.com/playwright:v1.62.0-jammy

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN useradd -m -u 1000 app && \
    mkdir -p /home/app && \
    chown app:app /home/app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (as non-root)
USER app
RUN npm ci --only=production && \
    npm cache clean --force

# Copy application files
COPY . .

# Ensure proper permissions
RUN chown -R app:app /app

# Expose port
EXPOSE 8080

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0

# Health check - uses /api/validationHealth endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8080/api/validationHealth || exit 1

# Start command
CMD ["npm", "run", "start"]
