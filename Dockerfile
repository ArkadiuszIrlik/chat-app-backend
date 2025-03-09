FROM node:21
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
RUN rm -rf ./src
CMD ["node", "test.js"]
