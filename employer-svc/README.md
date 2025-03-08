# CLIENT_AGENT-PARTNER-API

This is the backend for the client-agent-partner-api.

### Usage:

### Clone this repository

```
https://github.com/bookmydarshan/client-agent-partner-api.git
```

### Enter the client-agent-partner-api directory in the terminal<br/><br/>

### 1. Edit .env<br/><br/>

```
cp .example.env .env
```

### 2. Running the App<br/><br/>

**2.1 Dev Env**

1. Install Dependencies

```
npm i
```

2. Start the App

```
npm start
```

**2.2 Production Env**

1. Install Dependencies and pm2

```
npm i & npm i -g pm2
```

2. Start the App

```
pm2 start npm --name "client-agent-partner-api" -- run "build-run"
```
