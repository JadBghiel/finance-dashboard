#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/dashboard/backend"
FRONTEND_DIR="$ROOT_DIR/dashboard/frontend"
VENV_DIR="$BACKEND_DIR/.venv"

if [[ ! -d "$VENV_DIR" ]]; then
  if ! python3 -m venv "$VENV_DIR"; then
    if command -v apt-get >/dev/null 2>&1; then
      echo "python3-venv missing. Installing..."
      sudo apt-get update
      sudo apt-get install -y python3-venv python3-full
      python3 -m venv "$VENV_DIR"
    else
      echo "python3-venv is required. Please install it and re-run."
      exit 1
    fi
  fi
fi

# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"

"$VENV_DIR/bin/python" -m pip install --upgrade pip
"$VENV_DIR/bin/python" -m pip install -r "$BACKEND_DIR/requirements.txt"

export PYTHONPATH="$BACKEND_DIR"
export DATABASE_URL="sqlite:///$BACKEND_DIR/finance.db"

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
trap 'kill "$BACKEND_PID"' EXIT

cd "$FRONTEND_DIR"
if [[ ! -d node_modules ]]; then
  npm install
fi

npm start
