FROM node:lts-alpine AS builder
RUN apk --no-cache add python3
RUN mkdir -p /app
WORKDIR /app
COPY ./ ./
RUN npm install
RUN npm run build

FROM node:lts-alpine
RUN apk --no-cache add python3
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

CMD ["npm", "start"]
