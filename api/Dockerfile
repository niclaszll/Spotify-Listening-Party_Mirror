ARG NODE_VERSION=14

FROM node:${NODE_VERSION}-alpine

# install curl for healthcheck
RUN apk --no-cache add curl

# Switch into correct workspace (needed for permissions)
WORKDIR /home/node

# switch to non-root user for security reasons
USER node

COPY package*.json /home/node/
RUN yarn install
COPY . /home/node/
EXPOSE 9000
CMD ["yarn", "start"]

HEALTHCHECK --interval=30s \
  CMD curl -f http://localhost:9000/health || exit 1