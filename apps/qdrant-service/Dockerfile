FROM qdrant/qdrant:v1.7.4

# Fly.io port configuration
ENV QDRANT__SERVICE__HTTP_PORT=8080
ENV QDRANT__SERVICE__GRPC_PORT=6334
ENV QDRANT__STORAGE__STORAGE_PATH=/qdrant/storage

# Production settings
ENV QDRANT__LOG_LEVEL=INFO

EXPOSE 8080 6334

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/healthz || exit 1

CMD ["./qdrant"]
