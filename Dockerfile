FROM node:22-alpine

WORKDIR /app

# Copia package files
COPY package*.json ./

# Instala solo dependencias de producción
RUN npm ci --only=production --legacy-peer-deps

# Copia los archivos compilados
COPY dist/frontend ./dist/frontend

# Variable de entorno para el puerto
ENV PORT=8080

EXPOSE 8080

# Ejecuta el servidor
CMD ["node", "dist/frontend/server/server.mjs"]
