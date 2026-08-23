# ---- build stage -----------------------------------------------------------
FROM rust:1.97-slim AS build
WORKDIR /src

# ort's download-binaries uses rustls (vendored) — no system OpenSSL needed.
COPY Cargo.toml Cargo.lock* ./
COPY src ./src
COPY benches ./benches
COPY tests ./tests
RUN cargo fetch

ARG FEATURES=cuda
COPY . .
RUN cargo build --release --features "$FEATURES" \
 && mkdir -p /out/lib \
 && find target/release -maxdepth 2 -name "*.so" -exec cp {} /out/lib/ \; || true \
 && cp target/release/tinyocr /out/

# ---- runtime stage (NVIDIA CUDA + cuDNN) ------------------------------------
FROM nvidia/cuda:12.8.1-cudnn-runtime-ubuntu22.04

RUN apt-get update \
 && apt-get install -y --no-install-recommends curl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

# Non-root runtime user.
RUN useradd --system --create-home --shell /usr/sbin/nologin tinyocr

COPY --from=build /out/tinyocr /usr/local/bin/tinyocr
COPY --from=build /out/lib/ /opt/tinyocr/lib/
COPY model/ /app/model/
COPY configs/container.toml /app/configs/production.toml

ENV LD_LIBRARY_PATH=/opt/tinyocr/lib \
    TINYOCR_CONFIG=/app/configs/production.toml \
    TINYOCR_HOST=0.0.0.0 \
    TINYOCR_PORT=8080 \
    RUST_LOG=info

USER tinyocr
WORKDIR /app
EXPOSE 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -sf http://localhost:8080/ready || exit 1

ENTRYPOINT ["/usr/local/bin/tinyocr"]
