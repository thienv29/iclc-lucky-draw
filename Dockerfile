# Use official Node.js image as the base image
FROM node:22

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install the dependencies
RUN npm install

# Copy the rest of the application files to the container
COPY . .

# Expose the port that the application will run on
EXPOSE 3111

# Command to start the server
CMD ["node", "index.js"]

# docker build --platform linux/amd64 -t hoaiphongpvt/iclc-lucky-draw:v4 .
# docker push hoaiphongpvt/iclc-lucky-draw:v1    