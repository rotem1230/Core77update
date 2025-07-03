#!/bin/bash

# סקריפט פריסה מהירה עבור core77.app
# הרץ על שרת Ubuntu עם sudo

set -e

echo "🚀 מתחיל פריסה של Dyad על core77.app..."

# בדיקה שרץ כ-root או עם sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ סקריפט זה צריך לרוץ עם sudo" 
   exit 1
fi

DOMAIN="core77.app"

echo "📦 עדכון מערכת..."
apt update && apt upgrade -y

echo "🐳 התקנת Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker כבר מותקן"
fi

echo "🐳 התקנת Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/download/v2.24.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose כבר מותקן"
fi

echo "🌐 התקנת Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
else
    echo "✅ Nginx כבר מותקן"
fi

echo "🔒 התקנת Certbot..."
if ! command -v certbot &> /dev/null; then
    apt install snapd -y
    snap install core; snap refresh core
    snap install --classic certbot
    ln -sf /snap/bin/certbot /usr/bin/certbot
else
    echo "✅ Certbot כבר מותקן"
fi

echo "🔥 הגדרת Firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "📁 יצירת תיקיות..."
mkdir -p /opt/dyad
cd /opt/dyad

echo "⚙️ הגדרת Nginx עבור core77.app..."
cat > /etc/nginx/sites-available/dyad << 'EOF'
server {
    listen 80;
    server_name core77.app www.core77.app;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name core77.app www.core77.app;
    
    # SSL configuration will be added by Certbot
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # noVNC WebSocket proxy
    location /websockify {
        proxy_pass http://localhost:6080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:6080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

# הפעלת האתר
ln -sf /etc/nginx/sites-available/dyad /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "✅ התקנה הושלמה בהצלחה!"
echo ""
echo "📋 השלבים הבאים:"
echo ""
echo "1. 🔗 וודא שהדומיין core77.app מפנה לכתובת IP של השרת הזה"
echo ""
echo "2. 📂 העתק את קבצי הפרויקט:"
echo "   # מהמחשב המקומי שלך:"
echo "   scp -r /path/to/dyad-project/* user@your-server:/opt/dyad/"
echo ""
echo "3. 🐳 בנה והרץ את הדוקר:"
echo "   cd /opt/dyad"
echo "   docker-compose up -d --build"
echo ""
echo "4. 🔒 קבל תעודת SSL:"
echo "   certbot --nginx -d core77.app -d www.core77.app"
echo ""
echo "5. ✅ גש ל-https://core77.app כדי לראות את האפליקציה!"
echo ""
echo "📝 פקודות שימושיות:"
echo "   docker-compose logs -f          # צפייה בלוגים"
echo "   docker-compose restart          # הפעלה מחדש"
echo "   docker-compose down             # עצירה"
echo "   systemctl status nginx          # בדיקת Nginx" 