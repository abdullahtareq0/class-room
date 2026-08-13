# سيرفر محلي بدون كاش — يخلّي التعديلات تظهر فورًا بدون الحاجة لـ Ctrl+Shift+R.
# التشغيل:  python serve.py    ثم افتح  http://localhost:5501
import http.server
import socketserver

PORT = 5501


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


with socketserver.TCPServer(('127.0.0.1', PORT), NoCacheHandler) as httpd:
    print(f'Serving http://localhost:{PORT}  (no-cache)  —  Ctrl+C للإيقاف')
    httpd.serve_forever()
