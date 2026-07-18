#!/bin/bash
# PMS Deploy Script
# Run on server: bash deploy.sh

set -e

echo "===== PMS DEPLOY ====="
cd "$(dirname "$0")"

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin master

# 2. Install backend dependencies
echo "[2/5] Installing Python deps..."
cd backend
source venv/bin/activate 2>/dev/null || source ../venv/bin/activate 2>/dev/null || true
pip install -r requirements.txt 2>/dev/null || true
cd ..

# 3. Build frontend
echo "[3/5] Building frontend..."
cd frontend
npm install
npm run build
cd ..

# 4. Copy to Flask static
echo "[4/5] Copying to Flask static..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/ 2>/dev/null || true
rm -rf backend/static/index.html 2>/dev/null || true
cp frontend/dist/index.html backend/templates/ 2>/dev/null || true

# 5. Restart server
echo "[5/5] Restarting server..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart pms 2>/dev/null || sudo systemctl restart flask-app 2>/dev/null || echo "Restart manually"
elif command -v supervisorctl &> /dev/null; then
    supervisorctl restart pms 2>/dev/null || echo "Restart manually"
else
    # Kill existing and restart
    pkill -f "python run.py" 2>/dev/null || true
    sleep 1
    cd backend
    nohup python run.py > ../pms.log 2>&1 &
    echo "Server started on :9090"
fi

echo "===== DONE ====="
