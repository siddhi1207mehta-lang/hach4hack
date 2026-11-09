import os
import signal
import subprocess
import sys
from pathlib import Path

def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent

    # Commands for each service
    # Use shell=True or direct executable lookup on Windows
    is_windows = sys.platform == "win32"
    npm_cmd = "npm.cmd" if is_windows else "npm"

    procs: list[subprocess.Popen] = []

    try:
        print("Starting store-api on http://localhost:8000 ...")
        p_api = subprocess.Popen(
            [
                "uv", "run", "--project", "store-api",
                "uvicorn", "--app-dir", "store-api", "app.main:app",
                "--host", "0.0.0.0", "--port", "8000",
            ],
            cwd=str(repo_root),
        )
        procs.append(p_api)

        print("Starting agent placeholder on http://localhost:8001 ...")
        p_agent = subprocess.Popen(
            [
                "uv", "run", "--project", "store-api",
                "uvicorn", "--app-dir", "agent", "main:app",
                "--host", "0.0.0.0", "--port", "8001",
            ],
            cwd=str(repo_root),
        )
        procs.append(p_agent)

        print("Starting store-web on http://localhost:5173 ...")
        cmd_web = f"{npm_cmd} run dev" if is_windows else ["npm", "run", "dev"]
        p_web = subprocess.Popen(
            cmd_web,
            cwd=str(repo_root / "store-web"),
            shell=is_windows,
        )
        procs.append(p_web)

        print("\nAll 3 services running. Press Ctrl+C to stop.\n")

        # Wait for any process to terminate
        while True:
            for p in procs:
                ret = p.poll()
                if ret is not None:
                    print(f"Process {p.pid} exited with code {ret}")
                    return
            try:
                signal.pause() if hasattr(signal, "pause") else sys.stdin.read(1)
            except (KeyboardInterrupt, SystemExit):
                break

    except KeyboardInterrupt:
        print("\nStopping services...")
    finally:
        for p in procs:
            if p.poll() is None:
                try:
                    p.terminate()
                    p.wait(timeout=3)
                except Exception:
                    p.kill()

if __name__ == "__main__":
    main()

