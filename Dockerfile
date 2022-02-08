FROM node:14.17.4-alpine
ENV NODE_ENV production
WORKDIR /bin
COPY package*.json ./
RUN npm install
COPY --chown=node:node . .
EXPOSE 5000
RUN node -r dotenv/config ./bin/migrate.js dotenv_config_path=.env.production
CMD [ "npm", "run", "start" ]
