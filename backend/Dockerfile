FROM node:19-alpine3.15

ENV NODE_ENV=production
WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
RUN npm i
COPY ./src /app/src
COPY ./prisma /app/prisma
COPY ./tsconfig.json /app/tsconfig.json
RUN npx prisma generate
CMD [ "npm", "run", "start" ]
