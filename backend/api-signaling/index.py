import json
import asyncio
from datetime import datetime

connections = {}

def handler(event: dict, context) -> dict:
    """WebSocket сервер для сигнализации WebRTC звонков"""
    
    method = event.get('httpMethod', 'GET')
    
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
    
    request_context = event.get('requestContext', {})
    connection_id = request_context.get('connectionId')
    route_key = request_context.get('routeKey', '$default')
    
    if route_key == '$connect':
        query_params = event.get('queryStringParameters', {})
        peer_id = query_params.get('peer_id', '')
        
        connections[connection_id] = {
            'peer_id': peer_id,
            'connected_at': datetime.now().isoformat()
        }
        
        return {
            'statusCode': 200,
            'body': '',
            'isBase64Encoded': False
        }
    
    elif route_key == '$disconnect':
        if connection_id in connections:
            del connections[connection_id]
        
        return {
            'statusCode': 200,
            'body': '',
            'isBase64Encoded': False
        }
    
    elif route_key == '$default':
        body_str = event.get('body', '{}')
        if not body_str or body_str.strip() == '':
            body_str = '{}'
        body = json.loads(body_str)
        message_type = body.get('type')
        to_peer_id = body.get('to')
        
        target_connection_id = None
        for conn_id, conn_data in connections.items():
            if conn_data['peer_id'] == to_peer_id:
                target_connection_id = conn_id
                break
        
        if target_connection_id:
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'action': 'send_to_connection',
                    'connection_id': target_connection_id,
                    'data': body
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Peer not found'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Unknown route'}),
        'isBase64Encoded': False
    }