from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from groq import Groq
from datetime import datetime
import os
import re
import time
import uuid
import threading
import db
import app as backend

app = Flask(__name__)

# Extra origins (your hosted frontend) come from ALLOWED_ORIGINS, comma separated.
_origins = [
    "http://localhost:5173",
    "https://dbmadeez.dev",
    "https://www.dbmadeez.dev",
] + [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]
CORS(app, origins=_origins, allow_headers=["Content-Type", "X-Session-Id"])

# ---------------------------------------------------------------------------
# Per-visitor sessions (keyed by the X-Session-Id header the frontend sends)
# ---------------------------------------------------------------------------
SESSION_TTL = 30 * 60  # seconds of inactivity before a session is dropped
_sessions = {}
_sessions_lock = threading.Lock()
_SID_RE = re.compile(r"^[A-Za-z0-9-]{8,64}$")


def _new_state():
    return {
        'db_connected': False,
        'conn': None,
        'schema_text': '',
        'schema_tables': {},
        'api_key': '',
        'model': 'openai/gpt-oss-120b',
        'api_connected': False,
        'query_history': [],
        'is_demo': False,
        'demo_queries': 0,
        'last_seen': time.time(),
    }


def _purge_expired():
    now = time.time()
    for sid in [s for s, st in _sessions.items() if now - st['last_seen'] > SESSION_TTL]:
        st = _sessions.pop(sid)
        if st['conn']:
            try:
                st['conn'].close()
            except Exception:
                pass


def get_state():
    sid = request.headers.get('X-Session-Id', '')
    with _sessions_lock:
        _purge_expired()
        st = _sessions.setdefault(sid, _new_state())
        st['last_seen'] = time.time()
        return st


@app.before_request
def require_session_id():
    if request.method == 'OPTIONS' or not request.path.startswith('/api/'):
        return None
    if not _SID_RE.match(request.headers.get('X-Session-Id', '')):
        return jsonify({'success': False, 'error': 'Missing or invalid X-Session-Id header'}), 400
    return None


# ---------------------------------------------------------------------------
# Demo mode: credentials and the Groq key live only in server env vars
# ---------------------------------------------------------------------------
DEMO_QUERY_LIMIT = int(os.environ.get("DEMO_QUERY_LIMIT", 25))   # per visitor session
DEMO_DAILY_LIMIT = int(os.environ.get("DEMO_DAILY_LIMIT", 300))  # all visitors, protects Groq quota
DEMO_MAX_ROWS = int(os.environ.get("DEMO_MAX_ROWS", 200))
ALLOW_CUSTOM_DB = os.environ.get("ALLOW_CUSTOM_DB", "true").lower() == "true"

_daily = {'day': None, 'count': 0}
_daily_lock = threading.Lock()


def demo_config():
    cfg = {
        'host': os.environ.get('DEMO_DB_HOST'),
        'port': int(os.environ.get('DEMO_DB_PORT', 3306)),
        'user': os.environ.get('DEMO_DB_USER'),
        'password': os.environ.get('DEMO_DB_PASSWORD'),
        'database': os.environ.get('DEMO_DB_NAME'),
        'api_key': os.environ.get('DEMO_GROQ_API_KEY'),
    }
    required = ('host', 'user', 'password', 'database', 'api_key')
    return cfg if all(cfg[k] for k in required) else None


def _take_daily_slot():
    today = datetime.utcnow().date()
    with _daily_lock:
        if _daily['day'] != today:
            _daily.update(day=today, count=0)
        if _daily['count'] >= DEMO_DAILY_LIMIT:
            return False
        _daily['count'] += 1
        return True


def _close(conn):
    if conn:
        try:
            conn.close()
        except Exception:
            pass


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.route('/api/start-demo', methods=['POST'])
def start_demo():
    cfg = demo_config()
    if not cfg:
        return jsonify({'success': False, 'error': 'Demo is not configured on this server'}), 503

    state = get_state()
    try:
        new_conn = mysql.connector.connect(
            host=cfg['host'], port=cfg['port'], user=cfg['user'],
            password=cfg['password'], database=cfg['database'],
            connection_timeout=10,
        )
        schema_text, schema_tables = db.db_schema(new_conn, write_file=False)
    except Exception as e:
        # Log the detail server-side; connector errors can include the DB host.
        app.logger.error('Demo connection failed: %s', e)
        return jsonify({'success': False, 'error': 'Could not reach the demo database. Try again shortly.'}), 502

    _close(state['conn'])
    state.update({
        'conn': new_conn,
        'db_connected': True,
        'schema_text': schema_text,
        'schema_tables': schema_tables,
        'api_key': cfg['api_key'],
        'api_connected': True,
        'is_demo': True,
        'demo_queries': 0,
    })
    return jsonify({
        'success': True,
        'message': f"Demo ready! {len(schema_tables)} table(s) found. {DEMO_QUERY_LIMIT} questions per session.",
    })


@app.route('/api/connect-db', methods=['POST'])
def connect_db():
    if not ALLOW_CUSTOM_DB:
        return jsonify({
            'success': False,
            'error': 'Custom database connections are disabled on this deployment. Use the demo.'
        }), 403

    state = get_state()
    try:
        data = request.json
        host = data.get('host', 'localhost')
        port = int(data.get('port', 3306))
        user = data.get('user', 'root')
        password = data.get('password', '')
        database = data.get('database', '')

        new_conn = mysql.connector.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database
        )

        schema_text, schema_tables = db.db_schema(new_conn, write_file=False)

        _close(state['conn'])

        state.update({
            'conn': new_conn,
            'db_connected': True,
            'schema_text': schema_text,
            'schema_tables': schema_tables,
            'is_demo': False,
        })

        return jsonify({
            'success': True,
            'schema_text': schema_text,
            'schema_tables': schema_tables,
            'message': f'Connected to {database}! {len(schema_tables)} table(s) found.'
        })

    except mysql.connector.Error as e:
        state['db_connected'] = False
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/disconnect-db', methods=['POST'])
def disconnect_db():
    state = get_state()
    try:
        _close(state['conn'])
        state.update({
            'conn': None,
            'db_connected': False,
            'schema_text': '',
            'schema_tables': {},
            'is_demo': False,
        })
        return jsonify({'success': True, 'message': 'Disconnected successfully'})
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/get-schema', methods=['GET'])
def get_schema():
    state = get_state()
    if not state['db_connected']:
        return jsonify({
            'success': False,
            'error': 'Not connected to database'
        }), 400

    try:
        schema_text, schema_tables = db.db_schema(state['conn'], write_file=False)
        state.update({
            'schema_text': schema_text,
            'schema_tables': schema_tables
        })

        return jsonify({
            'success': True,
            'schema_text': schema_text,
            'schema_tables': schema_tables
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/configure-api', methods=['POST'])
def configure_api():
    state = get_state()
    try:
        data = request.json
        api_key = data.get('api_key', '').strip()
        model = data.get('model', 'openai/gpt-oss-120b').strip()

        if not api_key:
            return jsonify({
                'success': False,
                'error': 'API key cannot be empty'
            }), 400

        Groq(api_key=api_key).models.list()

        state.update({
            'api_key': api_key,
            'model': model,
            'api_connected': True
        })

        return jsonify({
            'success': True,
            'message': 'API key verified successfully',
            'model': model
        })

    except Exception as e:
        state['api_connected'] = False
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400


@app.route('/api/clear-api', methods=['POST'])
def clear_api():
    state = get_state()
    state.update({
        'api_key': '',
        'api_connected': False
    })

    return jsonify({'success': True})


@app.route('/api/query', methods=['POST'])
def execute_query():
    state = get_state()
    if not state['db_connected']:
        return jsonify({
            'success': False,
            'error': 'Not connected to database'
        }), 400

    if not state['api_connected']:
        return jsonify({
            'success': False,
            'error': 'API not configured'
        }), 400

    try:
        data = request.json
        question = data.get('question', '').strip()

        if not question:
            return jsonify({
                'success': False,
                'error': 'Question cannot be empty'
            }), 400

        if state['is_demo']:
            if len(question) > 500:
                return jsonify({'success': False, 'error': 'Demo questions are limited to 500 characters'}), 400
            if state['demo_queries'] >= DEMO_QUERY_LIMIT:
                return jsonify({
                    'success': False,
                    'error': f'Demo limit reached ({DEMO_QUERY_LIMIT} questions per session). Clone the repo to run it on your own database.'
                }), 429
            if not _take_daily_slot():
                return jsonify({
                    'success': False,
                    'error': 'The demo has reached its daily limit. Please try again tomorrow.'
                }), 429
            state['demo_queries'] += 1

        entry = {
            'id': str(uuid.uuid4()),
            'question': question,
            'sql': None,
            'result': None,
            'clarify': None,
            'error': None,
            'timestamp': datetime.utcnow().isoformat()
        }

        try:
            sql = backend.create_query(
                question, api_key=state['api_key'], schema_text=state['schema_text']
            )
        except Exception as e:
            app.logger.error('LLM error: %s', e)
            entry['error'] = 'LLM error: the model request failed. Please try again.' if state['is_demo'] else f'LLM error: {e}'
            state['query_history'].append(entry)
            return jsonify({
                'success': False,
                'error': entry['error'],
                'entry': entry
            }), 500

        if sql.upper().startswith('CLARIFY'):
            entry['clarify'] = sql.split(':', 1)[1].strip().rstrip(';')
        else:
            entry['sql'] = sql

            try:
                result = db.execute_query(state['conn'], sql, write_file=False)
                state['schema_text'] = result['schema_text']
                state['schema_tables'] = result['schema_tables']

                rows = result['rows']
                message = result['message']
                if state['is_demo'] and len(rows) > DEMO_MAX_ROWS:
                    message = f"{message} Showing the first {DEMO_MAX_ROWS}."
                    rows = rows[:DEMO_MAX_ROWS]

                entry['result'] = {
                    'query': result['query'],
                    'with_rows': result['with_rows'],
                    'columns': result['columns'],
                    'rows': rows,
                    'row_count': result['row_count'],
                    'message': message
                }

            except Exception as e:
                entry['error'] = str(e)

        state['query_history'].append(entry)

        return jsonify({
            'success': True,
            'entry': entry
        })

    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify({
        'success': True,
        'history': get_state()['query_history']
    })


@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    get_state()['query_history'] = []
    return jsonify({'success': True})


@app.route('/api/status', methods=['GET'])
def get_status():
    state = get_state()
    return jsonify({
        'success': True,
        'db_connected': state['db_connected'],
        'api_connected': state['api_connected'],
        'db_name': state['conn'].database if state['db_connected'] and state['conn'] else None,
        'model': state['model'],
        'is_demo': state['is_demo'],
        'demo_available': demo_config() is not None,
        'custom_db_allowed': ALLOW_CUSTOM_DB,
        'demo_remaining': max(DEMO_QUERY_LIMIT - state['demo_queries'], 0) if state['is_demo'] else None,
    })


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port)
