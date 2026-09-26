import json
import urllib.request
from urllib.error import URLError, HTTPError

url = 'http://localhost:8000/incidents'
data = json.dumps({
    'raw_report': 'Test incident from debug script',
    'manual_location': 'Debug Zone',
    'casualties_estimate': 1,
    'lat': 47.61,
    'lng': -122.33
}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print('status', resp.status)
        body = resp.read().decode('utf-8')
        print('body', body)
except HTTPError as e:
    print('HTTPError', e.code, e.read().decode('utf-8'))
except URLError as e:
    print('URLError', e)
except Exception as e:
    print('EXCEPTION', type(e).__name__, e)
