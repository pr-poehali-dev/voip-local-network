import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''WebRTC signaling сервер для установки P2P соединений между пользователями'''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Authorization'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database connection not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        path = event.get('params', {}).get('path', '')
        
        if method == 'POST' and path == '/initiate':
            body = json.loads(event.get('body', '{}'))
            caller_id = body.get('caller_id')
            receiver_id = body.get('receiver_id')
            offer = body.get('offer')
            
            if not caller_id or not receiver_id or not offer:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'caller_id, receiver_id и offer обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT phone FROM users WHERE id = %s", (caller_id,))
            caller = cur.fetchone()
            cur.execute("SELECT phone FROM users WHERE id = %s", (receiver_id,))
            receiver = cur.fetchone()
            
            if not caller or not receiver:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO call_logs (caller_id, receiver_id, caller_phone, receiver_phone, status) VALUES (%s, %s, %s, %s, 'ringing') RETURNING id",
                (caller_id, receiver_id, caller['phone'], receiver['phone'])
            )
            call = cur.fetchone()
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'call_id': call['id'],
                    'status': 'ringing',
                    'offer': offer
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == '/answer':
            body = json.loads(event.get('body', '{}'))
            call_id = body.get('call_id')
            answer = body.get('answer')
            
            if not call_id or not answer:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'call_id и answer обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE call_logs SET status = 'active' WHERE id = %s", (call_id,))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'call_id': call_id,
                    'status': 'active',
                    'answer': answer
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == '/end':
            body = json.loads(event.get('body', '{}'))
            call_id = body.get('call_id')
            
            if not call_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'call_id обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE call_logs SET status = 'completed', ended_at = CURRENT_TIMESTAMP, duration = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))::INTEGER WHERE id = %s",
                (call_id,)
            )
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'call_id': call_id, 'status': 'completed'}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == '/ice':
            body = json.loads(event.get('body', '{}'))
            candidate = body.get('candidate')
            call_id = body.get('call_id')
            
            if not candidate or not call_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'candidate и call_id обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'candidate': candidate}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == '/calls':
            query = event.get('queryStringParameters', {})
            user_id = query.get('user_id')
            
            if user_id:
                cur.execute(
                    "SELECT * FROM call_logs WHERE caller_id = %s OR receiver_id = %s ORDER BY started_at DESC LIMIT 50",
                    (user_id, user_id)
                )
            else:
                cur.execute("SELECT * FROM call_logs ORDER BY started_at DESC LIMIT 50")
            
            calls = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'calls': [dict(c) for c in calls]}, default=str),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Not found'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
