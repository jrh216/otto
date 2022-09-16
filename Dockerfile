FROM node:lts-alpine AS builder
RUN mkdir -p /app
WORKDIR /app
COPY ./ ./
RUN npm install
RUN npm run build

FROM node:lts-alpine
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
COPY --from=builder /app/build ./build
RUN npm ci --omit=dev

# Elastic Beanstalk requirement
EXPOSE 8080 

CMD ["npm", "start"]