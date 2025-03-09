FROM node:22.11.0

RUN adduser --disabled-password --gecos "" myuser

WORKDIR /app

RUN chown -R myuser:myuser /app

USER myuser

COPY package.json .

RUN npm install

COPY . .

EXPOSE 3000

CMD ["npx","tsx", "index.ts"]