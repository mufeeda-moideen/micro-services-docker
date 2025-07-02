# Base Node.js 18 image (LTS)
FROM node:18

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Start app in development mode
CMD ["npx", "ts-node", "src/server.ts"]
