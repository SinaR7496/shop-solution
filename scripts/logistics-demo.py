"""Run from repository root: python scripts/logistics-demo.py [--production]."""
import os
import secrets
import signal
import socket
import subprocess
import sys
import time
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "src/features/logistics/api"

def free(port):
    with socket.socket() as s:
        return s.connect_ex(("127.0.0.1", port)) != 0

def main():
    if not all(free(p) for p in [3000, 8000]):
        raise SystemExit("Ports 3000 and 8000 must be free. Stop the old demo first.")
    if not (ROOT / "node_modules/next/dist/bin/next").exists():
        raise SystemExit("Run pnpm install --frozen-lockfile first.")
    env = dict(os.environ, LOGISTICS_DEMO="1", LOGISTICS_DEMO_PASSWORD="logistics-demo", LOGISTICS_DEMO_TOKEN=secrets.token_urlsafe(32), LOGISTICS_API_TOKEN=secrets.token_urlsafe(32), LOGISTICS_API_URL="http://127.0.0.1:8000", NEXT_TELEMETRY_DISABLED="1", BETTER_AUTH_URL="http://127.0.0.1:3000", BETTER_AUTH_SECRET=secrets.token_urlsafe(48))
    processes = []
    def stop(*_):
        for p in reversed(processes):
            p.terminate()
        for p in reversed(processes):
            try: p.wait(timeout=5)
            except subprocess.TimeoutExpired: p.kill()
    signal.signal(signal.SIGINT, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, lambda *_: (_ for _ in ()).throw(KeyboardInterrupt()))
    try:
        processes.append(subprocess.Popen([sys.executable, "-m", "uvicorn", "demo_api:app", "--host", "127.0.0.1", "--port", "8000"], cwd=API, env=env))
        mode = "start" if "--production" in sys.argv else "dev"
        processes.append(subprocess.Popen(["node", str(ROOT / "node_modules/next/dist/bin/next"), mode, "--hostname", "127.0.0.1", "--port", "3000"], cwd=ROOT, env=env))
        print("\nOpen http://127.0.0.1:3000/logistics\nDemo: staff@logistics.demo / logistics-demo\nCtrl+C stops both servers. In-memory shipments reset on restart.\n", flush=True)
        while all(p.poll() is None for p in processes):
            time.sleep(0.25)
        raise SystemExit("A server stopped; inspect the messages above.")
    except KeyboardInterrupt:
        pass
    finally:
        stop()
if __name__ == "__main__":
    main()
