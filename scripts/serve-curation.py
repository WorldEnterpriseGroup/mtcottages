#!/usr/bin/env python3
"""
Development server for the photo curation gallery that also accepts
POST /api/save-decisions to persist approve/reject decisions to a
file on disk where Claude can read them.

Usage: python3 scripts/serve-curation.py [port]
Default port: 8000
"""

import http.server
import json
import os
import sys
from urllib.parse import urlparse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
DECISIONS_FILE = os.path.join(
    os.path.dirname(__file__), '..', 'admin', 'photo-curation-decisions.json'
)


class CurationHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == '/api/save-decisions':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length) if length > 0 else b'{}'

            try:
                data = json.loads(body)
                os.makedirs(os.path.dirname(DECISIONS_FILE), exist_ok=True)
                with open(DECISIONS_FILE, 'w') as f:
                    json.dump(data, f, indent=2, ensure_ascii=False)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'status': 'ok',
                    'path': DECISIONS_FILE,
                    'approved': len(data.get('houses', {})),
                    'rejected': len(data.get('rejected', [])),
                }).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        # CORS headers for local development
        if self.path == '/api/decisions':
            try:
                with open(DECISIONS_FILE) as f:
                    data = json.load(f)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(data).encode())
            except FileNotFoundError:
                self.send_response(404)
                self.end_headers()
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode())
            return

        return super().do_GET()


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(__file__), '..'))
    print(f'Serving at http://localhost:{PORT}')
    print(f'Save endpoint: POST /api/save-decisions -> {DECISIONS_FILE}')
    httpd = http.server.HTTPServer(('', PORT), CurationHandler)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down...')
