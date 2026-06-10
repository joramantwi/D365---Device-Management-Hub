"""Local dev server that disables caching so edits show up immediately."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 5173


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    with ThreadingHTTPServer(("0.0.0.0", PORT), NoCacheHandler) as httpd:
        print(f"Serving (no-cache) on http://localhost:{PORT}/")
        httpd.serve_forever()
