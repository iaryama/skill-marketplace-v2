FROM node:22.14.0

# Create a non-root user
RUN useradd --create-home --shell /bin/bash myuser

# Set the working directory
WORKDIR /app

# Copy package.json
COPY package.json ./

# Copy the rest of the files
COPY . .

# Install dependencies
RUN npm install

# Change ownership of the app directory
RUN chown -R myuser:myuser /app

# Switch to the non-root user
USER myuser

# Compile TypeScript
RUN npx tsc 

# Expose the REST port
EXPOSE 3000

# Expose the gRPC port
EXPOSE 5000

# Run compiled JavaScript
CMD ["node", "build/index.js"]
