#!/bin/bash

# Script להתקנת Dyad על שרת Ubuntu עם Docker, Nginx ו-SSL

set -e

echo "🚀 התחלת התקנת Dyad על השרת..."

# בדיקה שרץ כ-root או עם sudo
if [[ $EUID -ne 0 ]]; then
   echo "❌ סקריפט זה צריך לרוץ עם sudo או כ-root" 
   exit 1
fi

# קבלת שם הדומיין מהמשתמש
read -p "🌐 הכנס את שם הדומיין שלך (לדוגמה: mydyad.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ חובה להזין שם דומיין"
    exit 1
fi

echo "📦 עדכון מערכת..."
apt update && apt upgrade -y

echo "🐳 התקנת Docker..."
# התקנת Docker
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker כבר מותקן"
fi

# התקנת Docker Compose
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

echo "🔒 התקנת Certbot עבור SSL..."
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

echo "⚙️ הגדרת Nginx..."
# עדכון קובץ הגדרות Nginx עם הדומיין האמיתי
cat > /etc/nginx/sites-available/dyad << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
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
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }
    
    # Main application proxy
    location / {
        proxy_pass http://localhost:6080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400;
    }
}
EOF

# הפעלת האתר
ln -sf /etc/nginx/sites-available/dyad /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "📋 עכשיו בצע את השלבים הבאים:"
echo ""
echo "1. 🔗 וודא שהדומיין $DOMAIN מפנה לכתובת IP של השרת הזה"
echo ""
echo "2. 📂 העתק את קבצי הפרויקט לתיקייה /opt/dyad:"
echo "   scp -r /path/to/your/dyad-project/* user@your-server:/opt/dyad/"
echo ""
echo "3. 🐳 בנה והרץ את הדוקר:"
echo "   cd /opt/dyad"
echo "   docker-compose up -d --build"
echo ""
echo "4. 🔒 קבל תעודת SSL:"
echo "   certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "5. ✅ גש ל-https://$DOMAIN כדי לראות את האפליקציה!"
echo ""
echo "📝 פקודות שימושיות:"
echo "   docker-compose logs -f          # צפייה בלוגים"
echo "   docker-compose restart          # הפעלה מחדש"
echo "   docker-compose down             # עצירה"
echo "   docker-compose up -d --build    # בנייה והרצה מחדש" 