FROM node:21
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
RUN rm -rf ./src
RUN apt-get update && apt-get install -y bash curl && curl -1sLf \
'https://dl.cloudsmith.io/public/infisical/infisical-cli/setup.deb.sh' | bash \
&& apt-get update && apt-get install -y infisical
RUN chmod +x ./ops/scripts/entrypoint.sh
ENTRYPOINT [ "./ops/scripts/entrypoint.sh" ]
CMD ["npm", "run", "start"]
