FROM node:21

# Set the working directory in the container
# WORKDIR /usr/src/app
WORKDIR /app


# Copy package.json and package-lock.json
# COPY package*.json ./
COPY package.json /app

# Install any needed packages
RUN npm install

# Bundle app source
COPY . .

# Make port 3000 available to the world outside this container
EXPOSE 3000

# Define environment variable
ENV NODE_ENV=development

# Run app when the container launches
CMD npm run dev