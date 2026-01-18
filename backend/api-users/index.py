import json
import os
import psycopg2
from datetime import datetime
import uuid

def handler(event: dict, context) -> dict:
    """API для управления пользователями VoIP системы"""
    
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters', {})
    path = query_params.get('action', 'list')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if path == 'register' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            name = body.get('name', '')
            phone = body.get('phone', '')
            peer_id = f"peer_{uuid.uuid4().hex[:8]}"
            
            cur.execute(
                "INSERT INTO users (name, phone, peer_id, status) VALUES (%s, %s, %s, %s) RETURNING id, name, phone, peer_id, status",
                (name, phone, peer_id, 'online')
            )
            row = cur.fetchone()
            conn.commit()
            
            user = {
                'id': row[0],
                'name': row[1],
                'phone': row[2],
                'peer_id': row[3],
                'status': row[4]
            }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'user': user}),
                'isBase64Encoded': False
            }
        
        elif path == 'list' and method == 'GET':
            cur.execute("SELECT id, name, phone, peer_id, status FROM users WHERE status IN ('online', 'busy', 'in_call') ORDER BY name")
            rows = cur.fetchall()
            
            users = [
                {
                    'id': row[0],
                    'name': row[1],
                    'phone': row[2],
                    'peer_id': row[3],
                    'status': row[4]
                }
                for row in rows
            ]
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'users': users}),
                'isBase64Encoded': False
            }
        
        elif path.startswith('status/') and method == 'POST':
            peer_id = path.split('/')[-1]
            body = json.loads(event.get('body', '{}'))
            status = body.get('status', 'online')
            
            cur.execute(
                "UPDATE users SET status = %s, last_seen = %s WHERE peer_id = %s",
                (status, datetime.now(), peer_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Not found'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()