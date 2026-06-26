# Single-container build: build the React client, then run the Express server
# which serves both the API and the built client. One image, one Cloud Run service.

FROM node:20-slim

WORKDIR /app

# --- Install server deps ---
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

# --- Install client deps and build the frontend ---
COPY client/package*.json ./client/
RUN npm install --prefix client

# Copy the rest of the source (client/.env is included via .dockerignore config)
COPY . .

# Vite reads VITE_MAPS_KEY from client/.env during the build.
# Do NOT set ENV VITE_MAPS_KEY here — an empty env var would override the .env file
# (Vite prioritizes process env vars over .env files).
RUN npm run build --prefix client

# Cloud Run sets PORT (defaults to 8080). The server reads process.env.PORT.
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start", "--prefix", "server"]
