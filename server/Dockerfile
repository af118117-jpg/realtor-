FROM node:22-slim AS base
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate
COPY --from=base /app/dist ./dist
RUN mkdir -p /app/storage/images /app/storage/videos /app/storage/documents
EXPOSE 4000
CMD ["node", "dist/index.js"]
