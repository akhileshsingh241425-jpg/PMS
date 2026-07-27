#!/bin/bash
# PMS Deploy Script
# Run on server: bash deploy.sh [--force] [--branch <name>]

set -e

STATE_FILE=".deploy-state"
FORCE=false
BRANCH=""
ARGS=("$@")
for i in "${!ARGS[@]}"; do
  case "${ARGS[$i]}" in
    --force) FORCE=true ;;
    --branch) BRANCH="${ARGS[$i+1]}" ;;
  esac
done

echo "===== PMS DEPLOY ====="
cd "$(dirname "$0")"

# 0. Verify we're on the right branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
TARGET_BRANCH="${BRANCH:-$CURRENT_BRANCH}"
if [[ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]]; then
  echo "   ! Switching from $CURRENT_BRANCH to $TARGET_BRANCH..."
  git checkout "$TARGET_BRANCH"
fi

# 1. Pull latest code
echo "[1/5] Pulling latest code from $TARGET_BRANCH..."
git pull origin "$TARGET_BRANCH"

# 1.5 Backup DB before deploy (optional, requires DB creds)
if [ -f "backend/.env" ]; then
  BACKUP_DIR="backups"
  mkdir -p "$BACKUP_DIR"
  BACKUP_FILE="$BACKUP_DIR/pms_$(date +%Y%m%d_%H%M%S).sql"
  echo "   [backup] Creating DB backup: $BACKUP_FILE..."
  source backend/.env 2>/dev/null || true
  DB_NAME="${DB_NAME:-pms}"
  DB_USER="${DB_USER:-root}"
  mysqldump -u "$DB_USER" ${DB_PASSWORD:+-p"$DB_PASSWORD"} "$DB_NAME" > "$BACKUP_FILE" 2>/dev/null && echo "   ✓ DB backed up" || echo "   ! DB backup skipped (no mysqldump or bad creds)"
  # Keep last 5 backups
  ls -t "$BACKUP_DIR"/*.sql 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null || true
fi

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
    PORT=${PORT:-5002}
    nohup python run.py --port "$PORT" > ../pms.log 2>&1 &
    echo "   ✓ Server started on port $PORT (nginx → :$PORT)"
fi

echo "===== DONE ====="
