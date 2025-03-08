FROM node:22.11.0

WORKDIR .

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3050

CMD ["npx","tsx", "index.ts"]