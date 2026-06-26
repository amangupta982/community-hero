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

# Copy the rest of the source
COPY . .

# The Maps key is needed at BUILD time (Vite bakes it into the bundle).
# Cloud Run passes it as a build-time substitution via --set-env-vars only at
# runtime, so for Docker builds we accept it as a build arg too.
ARG VITE_MAPS_KEY
ENV VITE_MAPS_KEY=$VITE_MAPS_KEY
RUN npm run build --prefix client

# Cloud Run sets PORT (defaults to 8080). The server reads process.env.PORT.
ENV NODE_ENV=production
EXPOSE 8080

CMD ["npm", "start", "--prefix", "server"]
