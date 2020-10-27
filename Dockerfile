FROM node:14-alpine AS node


###############
# Builder stage

FROM node AS builder

# Use /app as the CWD
WORKDIR /app

# Copy package.json and yarn.lock to /app
COPY package.json yarn.lock ./

# Install all dependencies
RUN yarn install

# Copy the rest of the code
COPY . .

# Invoke the build script to transpile code to js
RUN npm run build


#############
# Final stage

FROM node AS final

# Prepare destination directory and ensure user node owns it
RUN mkdir -p /home/node/app/dist && chown -R node:node /home/node/app

# Set CWD
WORKDIR /home/node/app

# Copy package.json and yarn.lock
COPY package.json yarn.lock ./

# Switch to user node
USER node

# Install only production dependencies
RUN yarn install --production

# Copy dist and change ownership to user node
COPY --chown=node:node --from=builder /app/dist ./dist

# Copy docs and change ownership to user node
COPY --chown=node:node --from=builder /app/docs ./docs
