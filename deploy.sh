#!/bin/bash
# PMS Deploy Script
# Run on server: bash deploy.sh [--force]

set -e

STATE_FILE=".deploy-state"
FORCE=false
[[ "$1" == "--force" ]] && FORCE=true

echo "===== PMS DEPLOY ====="
cd "$(dirname "$0")"

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin master

# 2. Install backend dependencies (only if requirements changed)
echo "[2/5] Installing Python deps..."
PY_REQ_MD5=$(md5sum backend/requirements.txt 2>/dev/null | cut -d' ' -f1)
PY_SAVED_MD5=$(grep "requirements=" "$STATE_FILE" 2>/dev/null | cut -d= -f2 || echo "")
if $FORCE || [[ "$PY_REQ_MD5" != "$PY_SAVED_MD5" ]] || [ ! -d "backend/venv" ]; then
    cd backend
    python3 -m venv venv 2>/dev/null || true
    source venv/bin/activate 2>/dev/null || source ../venv/bin/activate 2>/dev/null || true
    pip install --upgrade pip -q
    pip install -r requirements.txt -q
    cd ..
    { grep -v "^requirements=" "$STATE_FILE" 2>/dev/null || true; echo "requirements=$PY_REQ_MD5"; } > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
    echo "   ✓ Python deps installed"
else
    echo "   ✓ Python deps up-to-date (skipped)"
fi

# 3. Build frontend (only if package.json or src changed)
echo "[3/5] Building frontend..."
FE_REQ_MD5=$(md5sum frontend/package.json 2>/dev/null | cut -d' ' -f1)
FE_SAVED_MD5=$(grep "packagejson=" "$STATE_FILE" 2>/dev/null | cut -d= -f2 || echo "")
FE_SRC_MD5=$(find frontend/src frontend/index.html -type f 2>/dev/null | xargs md5sum 2>/dev/null | md5sum | cut -d' ' -f1)
FE_SRC_SAVED=$(grep "srcmd5=" "$STATE_FILE" 2>/dev/null | cut -d= -f2 || echo "")

if $FORCE || [[ "$FE_REQ_MD5" != "$FE_SAVED_MD5" ]] || [[ "$FE_SRC_MD5" != "$FE_SRC_SAVED" ]] || [ ! -d "frontend/dist" ]; then
    cd frontend
    if [[ "$FE_REQ_MD5" != "$FE_SAVED_MD5" ]]; then
        npm install
    fi
    npm run build
    cd ..
    # write state atomically
    { grep -v "^packagejson=\|^srcmd5=" "$STATE_FILE" 2>/dev/null || true; echo "packagejson=$FE_REQ_MD5"; echo "srcmd5=$FE_SRC_MD5"; } > "${STATE_FILE}.tmp"
    mv "${STATE_FILE}.tmp" "$STATE_FILE"
    echo "   ✓ Frontend built"
else
    echo "   ✓ Frontend up-to-date (skipped)"
fi

# 4. Copy to Flask static
echo "[4/5] Copying to Flask static..."
mkdir -p backend/static
cp -r frontend/dist/* backend/static/ 2>/dev/null || true
rm -rf backend/static/index.html 2>/dev/null || true
cp frontend/dist/index.html backend/templates/ 2>/dev/null || true
echo "   ✓ Static files copied"

# 5. Restart server
echo "[5/5] Restarting server..."
if command -v systemctl &> /dev/null; then
    sudo systemctl restart pms 2>/dev/null || sudo systemctl restart flask-app 2>/dev/null || echo "   ! Restart manually (sudo systemctl restart pms)"
elif command -v supervisorctl &> /dev/null; then
    supervisorctl restart pms 2>/dev/null || echo "   ! Restart manually"
else
    pkill -f "python run.py" 2>/dev/null || true
    sleep 1
    cd backend
    nohup python run.py > ../pms.log 2>&1 &
    echo "   ✓ Server started on port 5002 (nginx :9090 → :5002)"
fi

echo "===== DONE ====="
