FROM node:lts AS builder
RUN mkdir -p /app
WORKDIR /app
COPY ./ ./
RUN npm ci
RUN npm run build

FROM node:lts
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

CMD ["npm", "start"]
