server {
    listen 80;
    server_name api.schoolactive.ru;

    # Redirect HTTP to HTTPS if certs are configured later
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name api.schoolactive.ru;

    # ssl_certificate /etc/letsencrypt/live/api.schoolactive.ru/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/api.schoolactive.ru/privkey.pem;

    access_log /var/log/nginx/api.schoolactive.ru.access.log;
    error_log  /var/log/nginx/api.schoolactive.ru.error.log;

    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optionally serve uploads directly if needed
    location /uploads/ {
        proxy_pass http://127.0.0.1:5000/uploads/;
        add_header Access-Control-Allow-Origin *;
    }
}
