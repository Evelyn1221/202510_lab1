# 建構階段：編譯 PCRE2
FROM alpine:3.18 AS builder

# 安裝建構工具
RUN apk add --no-cache \
    build-base \
    wget \
    tar

# 下載並編譯 PCRE2 10.46
WORKDIR /src
RUN wget https://github.com/PCRE2Project/pcre2/releases/download/pcre2-10.46/pcre2-10.46.tar.gz && \
    tar xf pcre2-10.46.tar.gz && \
    cd pcre2-10.46 && \
    ./configure --prefix=/usr && \
    make -j$(nproc) && \
    make install DESTDIR=/pcre2-install

# 最終階段
FROM nginx:1.25.3-alpine3.18

# 複製編譯好的 PCRE2
COPY --from=builder /pcre2-install /

# 維護者資訊
LABEL org.opencontainers.image.source="https://github.com/YOUR_USERNAME/YOUR_REPO"
LABEL org.opencontainers.image.description="井字遊戲 - 靜態網頁應用"
LABEL org.opencontainers.image.licenses="MIT"

# 移除預設的 Nginx 網頁
RUN rm -rf /usr/share/nginx/html/*

# 複製靜態檔案到 Nginx 目錄
COPY app/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 修改 Nginx 配置並增加安全性設定
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf && \
    sed -i 's/listen\s*\[::\]:80;/listen [::]:8080;/g' /etc/nginx/conf.d/default.conf && \
    sed -i '/user\s*nginx;/d' /etc/nginx/nginx.conf && \
    sed -i 's,/var/run/nginx.pid,/tmp/nginx.pid,' /etc/nginx/nginx.conf && \
    sed -i "/^http {/a \    proxy_temp_path /tmp/proxy_temp;\n\
    client_body_temp_path /tmp/client_temp;\n\
    fastcgi_temp_path /tmp/fastcgi_temp;\n\
    uwsgi_temp_path /tmp/uwsgi_temp;\n\
    scgi_temp_path /tmp/scgi_temp;\n\
    pcre_jit on;\n\
    variables_hash_bucket_size 128;\n\
    variables_hash_max_size 2048;\n\
    add_header Content-Security-Policy \"default-src 'self'; script-src 'self'; style-src 'self';\";\n\
    server_tokens off;\n" /etc/nginx/nginx.conf && \
    chmod -R 755 /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

# 使用非特權用戶
USER nginx

# 暴露 8080 端口
EXPOSE 8080

# 啟動 Nginx
CMD ["nginx", "-g", "daemon off;"]