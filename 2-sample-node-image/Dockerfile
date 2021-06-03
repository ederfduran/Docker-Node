# fill in the blanks to dockerize this node app
FROM node:12-alpine

EXPOSE 3000
# remember to install all required os packages 
# before to copy your code stuff
RUN apk add --no-cache tini

WORKDIR /node
# forward slash needed to copy multiple files
COPY package.json package-lock*.json ./
# the difference between '&&' and ';' is that
# with '&&' your first command need to succeed 
# in order to execute the second one.
RUN npm install && npm cache clean --force

COPY . .

#ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "app.js"]
