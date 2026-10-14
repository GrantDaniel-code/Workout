"""Runs the workout app on this Mac so your phone can open it over Wi-Fi.

Start it with:  python3 serve.py   (or double-click start.command)
Stop it with:   Control + C
"""
import http.server
import os
import socket
import subprocess

PORT = 8000


def lan_ip():
    # Ask macOS for the Wi-Fi address first, then fall back to a generic trick.
    for iface in ("en0", "en1"):
        try:
            ip = subprocess.check_output(["ipconfig", "getifaddr", iface], text=True).strip()
            if ip:
                return ip
        except Exception:
            pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return None


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    # Tell the phone to always load the newest files, so changes show up right away.
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass  # keep the terminal quiet


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    ip = lan_ip()
    print("\n  WORKOUT APP IS RUNNING\n")
    print(f"  On this Mac:   http://localhost:{PORT}")
    if ip:
        print(f"  On your phone: http://{ip}:{PORT}   (same Wi-Fi network)")
    print("\n  Press Control + C to stop.\n")
    server = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  Stopped.")
