ARG NODE_VERSION=14

FROM node:${NODE_VERSION}-alpine

# install dependencies
RUN apk --no-cache add curl python make gcc g++

# Switch into correct workspace (needed for permissions)
WORKDIR /home/node

# switch to non-root user for security reasons
USER node

COPY package*.json /home/node/
RUN yarn install
COPY . /home/node/
EXPOSE 3000
CMD ["yarn", "start"]

HEALTHCHECK --interval=30s \
  CMD curl -f http://localhost:3000/ || exit 1