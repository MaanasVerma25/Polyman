import subprocess
import sys
import os
import time
import signal
from pathlib import Path

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

ROOT = Path(__file__).resolve().parent
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIR = ROOT / "frontend"

def main():
    print("=" * 60)
    print(">> STARTING POLYMAN MULTI-AGENT PLATFORM")
    print("=" * 60)
    print(f"[*] Workspace Root : {ROOT}")
    print("[*] Backend API     : http://127.0.0.1:8000")
    print("[*] Frontend UI     : http://localhost:5173")
    print("=" * 60)

    # 1. Start backend server
    print("Starting FastAPI Backend...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload"],
        cwd=str(BACKEND_DIR)
    )

    time.sleep(2)

    # 2. Start frontend server
    print("Starting Vite React Frontend...")
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    frontend_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=str(FRONTEND_DIR)
    )

    print("\n[+] Polyman is running! Open http://localhost:5173 in your browser.")
    print("Press Ctrl+C to stop both servers.\n")

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Backend stopped unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend stopped unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nShutting down Polyman...")
    finally:
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
        except Exception:
            pass
        print("Goodbye!")

if __name__ == "__main__":
    main()
