FROM node:26-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production
COPY *.html *.js *.txt preview.mjs ./
COPY assets/ ./assets/
COPY student-pilot/server.mjs student-pilot/backup.mjs student-pilot/container-start.mjs ./student-pilot/

USER node
EXPOSE 8080
CMD ["node", "student-pilot/container-start.mjs", "--student-hosted"]
