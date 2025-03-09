FROM node:22.11.0

WORKDIR .

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3001

CMD ["npx","tsx", "index.ts"]