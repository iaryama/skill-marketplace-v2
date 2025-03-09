FROM node:22.14.0

# Create a non-root user
RUN adduser -D myuser

# Set the working directory
WORKDIR /app

# Change ownership of the app directory
RUN chown -R myuser:myuser /app

# Switch to the non-root user
USER myuser

# Copy package.json and package-lock.json
COPY package.json ./

# Install dependencies
RUN npm install

# Copy the rest of the files
COPY . .

# Compile TypeScript
RUN npx tsc 

# Expose the REST port
EXPOSE 3000

# Expose the gRPC port
EXPOSE 5000

# Run compiled JavaScript
CMD ["node", "build/index.js"]
