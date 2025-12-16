FROM node:20-slim
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps || npm install --force

COPY . .
RUN npm run build

EXPOSE 3003
CMD ["npm", "run", "start"]
