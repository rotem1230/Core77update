#!/bin/bash

echo "Starting Dyad..."

Xvfb :99 -screen 0 1920x1080x24 -ac &
export DISPLAY=:99

sleep 2

fluxbox &
sleep 2

x11vnc -display :99 -nopw -listen 0.0.0.0 -xkb -forever -shared &
sleep 2

websockify --web=/usr/share/novnc/ 6080 localhost:5900 &
sleep 2

cd /app
export DISPLAY=:99
export ELECTRON_DISABLE_SANDBOX=1

npm start &

echo "Open browser: http://localhost:6080"

tail -f /dev/null