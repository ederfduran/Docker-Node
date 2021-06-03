FROM node:10-slim

EXPOSE 3000

# Created as root
WORKDIR /node
# copy package.json and package-lock into /node 
COPY package*.json ./
# create app dir and change permission recursively under current directory
RUN mkdir app && chown -R node:node
# Change the user to use node
USER node
# it is save to run these commands with node user
# because we already change permissions in directory
RUN npm install && npm cache clean --force

WORKDIR /node/app
# in case you need to edit those files in the container later on
COPY --chown=node:node . .

CMD ["node", "app.js"]
