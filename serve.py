# سيرفر محلي بدون كاش — يخلّي التعديلات تظهر فورًا بدون Ctrl+Shift+R.
# يلقى منفذًا فاضيًا تلقائيًا ويطبع الرابط. التشغيل:  python serve.py
import http.server
import socketserver


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()


httpd = None
for port in range(5501, 5600):
    try:
        httpd = socketserver.TCPServer(('127.0.0.1', port), NoCacheHandler)
        break
    except OSError:
        continue

if httpd is None:
    raise SystemExit('ما فيه منفذ فاضي بين 5501 و 5599.')

print('=' * 48)
print(f'  افتح المتصفح على:  http://localhost:{port}')
print('  (سيرفر بدون كاش — Ctrl+C للإيقاف)')
print('=' * 48)
httpd.serve_forever()
