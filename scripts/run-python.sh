#!/bin/bash
# Python Script Runner with Automatic Virtual Environment Management
# 
# This script automatically creates and manages a Python virtual environment
# for running Python scripts with dependencies.
#
# Usage: ./scripts/run-python.sh <script-name.py> [args...]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$SCRIPT_DIR/.venv"
REQUIREMENTS_FILE="$SCRIPT_DIR/requirements.txt"
PYTHON_SCRIPT="$SCRIPT_DIR/$1"

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ ERROR: python3 is not installed or not in PATH"
    echo "Please install Python 3.8 or higher"
    exit 1
fi

# Check if script argument is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: No script specified"
    echo "Usage: $0 <script-name.py> [args...]"
    exit 1
fi

# Shift arguments to pass remaining args to Python script
shift

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo "🔧 Creating Python virtual environment..."
    python3 -m venv "$VENV_DIR"
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Install/upgrade dependencies if requirements.txt exists
if [ -f "$REQUIREMENTS_FILE" ]; then
    # Check if we need to install dependencies
    if [ ! -f "$VENV_DIR/.deps_installed" ] || [ "$REQUIREMENTS_FILE" -nt "$VENV_DIR/.deps_installed" ]; then
        echo "📦 Installing Python dependencies..."
        pip install --quiet --upgrade pip
        pip install --quiet -r "$REQUIREMENTS_FILE"
        touch "$VENV_DIR/.deps_installed"
        echo "✅ Dependencies installed"
    fi
fi

# Run the Python script with remaining arguments
python3 "$PYTHON_SCRIPT" "$@"

# Capture exit code
EXIT_CODE=$?

# Deactivate virtual environment
deactivate

exit $EXIT_CODE
