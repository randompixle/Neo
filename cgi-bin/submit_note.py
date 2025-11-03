#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import cgitb, os, sys, json, datetime
from pathlib import Path
from urllib.parse import parse_qs

cgitb.enable()

REPO_ROOT = Path(__file__).resolve().parent.parent
NOTES_PATH = REPO_ROOT / 'notes' / 'notes.json'

def today_key():
    d = datetime.date.today()
    code = (d.year * 97 + d.month * 31 + d.day * 17) % 10000
    return f"{code:04d}"

def respond(status_code: int, body: dict):
    status_text = {
        200: '200 OK',
        400: '400 Bad Request',
        401: '401 Unauthorized',
        405: '405 Method Not Allowed',
        500: '500 Internal Server Error',
    }.get(status_code, '200 OK')
    sys.stdout.write(f"Status: {status_text}\r\n")
    sys.stdout.write("Content-Type: application/json; charset=utf-8\r\n")
    sys.stdout.write("Access-Control-Allow-Origin: *\r\n\r\n")
    sys.stdout.write(json.dumps(body, ensure_ascii=False))
    sys.stdout.flush()

def get_post_data():
    try:
        length = int(os.environ.get('CONTENT_LENGTH', '0'))
    except ValueError:
        length = 0
    raw = sys.stdin.read(length) if length > 0 else ''
    ctype = os.environ.get('CONTENT_TYPE', '')
    if 'application/json' in ctype:
        try:
            return json.loads(raw or '{}')
        except Exception:
            return {}
    return {k: v[0] for k, v in parse_qs(raw).items()}

def main():
    if os.environ.get('REQUEST_METHOD') != 'POST':
        respond(405, {'ok': False, 'error': 'POST required'})
        return

    data = get_post_data()
    key = str(data.get('key', '')).strip()
    author = str(data.get('author', '')).strip()[:64]
    text = str(data.get('text', '')).strip()

    if not key or len(key) != 4 or not key.isdigit():
        respond(400, {'ok': False, 'error': 'Invalid key format'})
        return

    if key != today_key():
        respond(401, {'ok': False, 'error': 'Incorrect key'})
        return

    if not text:
        respond(400, {'ok': False, 'error': 'Text is required'})
        return

    # Read existing
    try:
        NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
        if NOTES_PATH.exists():
            with open(NOTES_PATH, 'r', encoding='utf-8') as fh:
                data_existing = json.load(fh)
        else:
            data_existing = []
        if not isinstance(data_existing, list):
            # backup old schema
            with open(str(NOTES_PATH) + '.bak', 'w', encoding='utf-8') as bk:
                json.dump(data_existing, bk, ensure_ascii=False, indent=2)
            data_existing = []
    except Exception:
        data_existing = []

    entry = {
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'author': author or 'anonymous',
        'text': text,
    }
    data_existing.append(entry)

    try:
        tmp = str(NOTES_PATH) + '.tmp'
        with open(tmp, 'w', encoding='utf-8') as fh:
            json.dump(data_existing, fh, ensure_ascii=False, indent=2)
        os.replace(tmp, NOTES_PATH)
    except Exception:
        respond(500, {'ok': False, 'error': 'Failed to write note'})
        return

    respond(200, {'ok': True, 'entry': entry})

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        respond(500, {'ok': False, 'error': 'Server error', 'detail': str(e)})