#!/bin/bash
set -e

# ========== ПЕРЕМЕННЫЕ ==========
DOMAIN="YOUR_DOMAIN.RU"
APP_DIR="/var/www/ProjectX"
DB_DIR="/var/www/db"
DB_FILE="$DB_DIR/database.sqlite"

# ========== ОБНОВЛЕНИЕ ==========
apt update && apt upgrade -y

# ========== УСТАНОВКА ЗАВИСИМОСТЕЙ ==========
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs git build-essential nginx sqlite3
npm install -g pm2
apt install -y certbot python3-certbot-nginx

# ========== КЛОНИРОВАНИЕ ПРОЕКТА ==========
mkdir -p /var/www
cd /var/www
if [ ! -d "$APP_DIR" ]; then
  git clone https://github.com/ElnurBabaev/ProjectX.git
fi
cd ProjectX
git pull

# ========== НАСТРОЙКА БАЗЫ ==========
mkdir -p $DB_DIR
if [ ! -f "$DB_FILE" ]; then
  touch $DB_FILE
fi

# ========== BACKEND ==========
cd $APP_DIR/backend
npm install
cp -n .env.example .env

# Обновляем .env
sed -i "s|DB_FILE=.*|DB_FILE=$DB_FILE|g" .env
sed -i "s|DATABASE_TYPE=.*|DATABASE_TYPE=sqlite|g" .env
sed -i "s|JWT_SECRET=.*|JWT_SECRET=$(openssl rand -hex 16)|g" .env

# Старт backend
pm2 start npm --name "projectx-backend" -- run start || pm2 restart projectx-backend
pm2 save

# ========== FRONTEND ==========
cd $APP_DIR/frontend
npm install
npm run build

# ========== NGINX ==========
cat > /etc/nginx/sites-available/projectx <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    root $APP_DIR/frontend/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/projectx /etc/nginx/sites-enabled/projectx
nginx -t && systemctl restart nginx

# ========== SSL ==========
certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN || true

echo "✅ Деплой завершён! Открой https://$DOMAIN"
