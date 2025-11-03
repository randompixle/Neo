#!/usr/bin/env python3
import cgitb
import json
import os
import sys
from pathlib import Path

cgitb.enable()

PASSWORD = os.environ.get('SOLAR_NOTES_PASSWORD', 'Supersecrectcode1!')
REPO_ROOT = Path(__file__).resolve().parent.parent
NOTES_PATH = REPO_ROOT / 'notes' / 'notes.json'


def respond(status_code: int, body: dict) -> None:
    status_text = {
        200: '200 OK',
        400: '400 Bad Request',
        401: '401 Unauthorized',
        405: '405 Method Not Allowed',
        500: '500 Internal Server Error',
    }.get(status_code, f'{status_code} Unknown')
    print(f'Status: {status_text}')
    print('Content-Type: application/json')
    print('Cache-Control: no-store')
    print()
    print(json.dumps(body))


def load_payload() -> dict:
    try:
        length = int(os.environ.get('CONTENT_LENGTH') or '0')
    except ValueError:
        length = 0
    if length <= 0:
        return {}
    data = sys.stdin.buffer.read(length)
    try:
        return json.loads(data.decode('utf-8'))
    except Exception:
        return {}


def main() -> None:
    method = os.environ.get('REQUEST_METHOD', 'GET').upper()
    if method != 'POST':
        respond(405, {'ok': False, 'error': 'POST required'})
        return

    payload = load_payload()
    password = (payload.get('password') or '').strip()
    package = (payload.get('pkg') or '').strip()
    note = (payload.get('note') or '').strip()

    if password != PASSWORD:
        respond(401, {'ok': False, 'error': 'Invalid password'})
        return
    if not package or not note:
        respond(400, {'ok': False, 'error': 'Package and note are required'})
        return

    try:
        if NOTES_PATH.exists():
            with NOTES_PATH.open('r', encoding='utf-8') as fh:
                data = json.load(fh)
        else:
            data = {}
    except Exception:
        respond(500, {'ok': False, 'error': 'Failed to read notes store'})
        return

    if not isinstance(data, dict):
        data = {}

    bucket = data.get(package)
    if not isinstance(bucket, list):
        bucket = []
        data[package] = bucket
    bucket.append(note)

    try:
        NOTES_PATH.parent.mkdir(parents=True, exist_ok=True)
        with NOTES_PATH.open('w', encoding='utf-8') as fh:
            json.dump(data, fh, indent=2, ensure_ascii=False)
            fh.write('\n')
    except Exception:
        respond(500, {'ok': False, 'error': 'Failed to write note'})
        return

    respond(200, {'ok': True})


if __name__ == '__main__':
    main()
