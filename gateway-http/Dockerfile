FROM node:krypton-slim

WORKDIR /app

# ---------- Install shared dependency first (better caching) ----------
COPY shared/node /shared/node
WORKDIR /shared/node
RUN npm install --omit=dev

# ---------- Install gateway ----------
WORKDIR /app
COPY gateway-http/package*.json ./
RUN npm install --omit=dev

# copy gateway source
COPY gateway-http/ .

CMD ["npm", "start"]
