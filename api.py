from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from groq import Groq
from datetime import datetime
import uuid
import db
import app as backend

app = Flask(__name__)
CORS(app)

session_state = {
    'db_connected': False,
    'conn': None,
    'schema_text': '',
    'schema_tables': {},
    'api_key': '',
    'model': 'openai/gpt-oss-120b',
    'api_connected': False,
    'query_history': []
}

@app.route('/api/connect-db', methods=['POST'])
def connect_db():
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
        
        schema_text, schema_tables = db.db_schema(new_conn)
        
        if session_state['conn']:
            try:
                session_state['conn'].close()
            except:
                pass
        
        session_state.update({
            'conn': new_conn,
            'db_connected': True,
            'schema_text': schema_text,
            'schema_tables': schema_tables
        })
        
        return jsonify({
            'success': True,
            'schema_text': schema_text,
            'schema_tables': schema_tables,
            'message': f'Connected to {database}! {len(schema_tables)} table(s) found.'
        })
        
    except mysql.connector.Error as e:
        session_state['db_connected'] = False
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
    try:
        if session_state['conn']:
            session_state['conn'].close()
        
        session_state.update({
            'conn': None,
            'db_connected': False,
            'schema_text': '',
            'schema_tables': {}
        })
        
        return jsonify({'success': True, 'message': 'Disconnected successfully'})
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/get-schema', methods=['GET'])
def get_schema():
    if not session_state['db_connected']:
        return jsonify({
            'success': False,
            'error': 'Not connected to database'
        }), 400
    
    try:
        schema_text, schema_tables = db.db_schema(session_state['conn'])
        session_state.update({
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
        
        session_state.update({
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
        session_state['api_connected'] = False
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/clear-api', methods=['POST'])
def clear_api():
    session_state.update({
        'api_key': '',
        'api_connected': False
    })
    
    return jsonify({'success': True})

@app.route('/api/query', methods=['POST'])
def execute_query():
    if not session_state['db_connected']:
        return jsonify({
            'success': False,
            'error': 'Not connected to database'
        }), 400
    
    if not session_state['api_connected']:
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
            sql = backend.create_query(question, api_key=session_state['api_key'])
        except Exception as e:
            entry['error'] = f'LLM error: {str(e)}'
            session_state['query_history'].append(entry)
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
                result = db.execute_query(session_state['conn'], sql)
                session_state['schema_text'] = result['schema_text']
                session_state['schema_tables'] = result['schema_tables']
                
                entry['result'] = {
                    'query': result['query'],
                    'with_rows': result['with_rows'],
                    'columns': result['columns'],
                    'rows': result['rows'],
                    'row_count': result['row_count'],
                    'message': result['message']
                }
                
            except Exception as e:
                entry['error'] = str(e)
        
        session_state['query_history'].append(entry)
        
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
        'history': session_state['query_history']
    })

@app.route('/api/clear-history', methods=['POST'])
def clear_history():
    session_state['query_history'] = []
    return jsonify({'success': True})

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        'success': True,
        'db_connected': session_state['db_connected'],
        'api_connected': session_state['api_connected'],
        'db_name': session_state.get('conn').database if session_state['db_connected'] and session_state['conn'] else None,
        'model': session_state['model']
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)
