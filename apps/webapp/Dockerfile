FROM nginx:alpine

# Install envsubst
RUN apk add --no-cache gettext

# Copy Config & Scripts
# nginx.conf è ora una configurazione completa, non solo un server block
COPY nginx.conf /etc/nginx/nginx.conf
COPY . /usr/share/nginx/html
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

ENTRYPOINT ["/docker-entrypoint.sh"]
