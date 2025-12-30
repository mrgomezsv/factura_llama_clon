# Build stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the Angular app
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Tell Puppeteer to skip installing Chrome v. we will use the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy only the necessary files
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
# COPY --from=build /app/.env.example ./.env  # Comentado por no existir

# Create certs directory
RUN mkdir -p server/certs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "server/index.js"]
