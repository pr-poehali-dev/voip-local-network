import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import bcrypt
import secrets

def handler(event: dict, context) -> dict:
    '''API для регистрации и авторизации пользователей VoIP системы'''
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
        
        if method == 'POST' and path == '/register':
            body = json.loads(event.get('body', '{}'))
            username = body.get('username', '').strip()
            phone = body.get('phone', '').strip()
            password = body.get('password', '')
            
            if not username or not phone or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id FROM users WHERE username = %s OR phone = %s", (username, phone))
            if cur.fetchone():
                return {
                    'statusCode': 409,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким именем или телефоном уже существует'}),
                    'isBase64Encoded': False
                }
            
            password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cur.execute(
                "INSERT INTO users (username, phone, password_hash, role, status) VALUES (%s, %s, %s, 'user', 'offline') RETURNING id, username, phone, role",
                (username, phone, password_hash)
            )
            user = cur.fetchone()
            conn.commit()
            
            token = secrets.token_urlsafe(32)
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': dict(user), 'token': token}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST' and path == '/login':
            body = json.loads(event.get('body', '{}'))
            phone = body.get('phone', '').strip()
            password = body.get('password', '')
            
            if not phone or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Введите телефон и пароль'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, username, phone, password_hash, role FROM users WHERE phone = %s", (phone,))
            user = cur.fetchone()
            
            if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный телефон или пароль'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE users SET status = 'online', last_seen = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
            conn.commit()
            
            token = secrets.token_urlsafe(32)
            user_data = {k: v for k, v in user.items() if k != 'password_hash'}
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'user': user_data, 'token': token}),
                'isBase64Encoded': False
            }
        
        elif method == 'GET' and path == '/users':
            cur.execute("SELECT id, username, phone, role, status, last_seen FROM users ORDER BY last_seen DESC")
            users = cur.fetchall()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': [dict(u) for u in users]}, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT' and path == '/status':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('user_id')
            status = body.get('status', 'offline')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE users SET status = %s, last_seen = CURRENT_TIMESTAMP WHERE id = %s", (status, user_id))
            conn.commit()
            
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
