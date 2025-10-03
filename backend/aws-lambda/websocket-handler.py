import json
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
connections_table = dynamodb.Table('WebSocket-Connections')

def lambda_handler(event, context):
    route_key = event.get('requestContext', {}).get('routeKey')
    connection_id = event.get('requestContext', {}).get('connectionId')
    
    if route_key == '$connect':
        return handle_connect(connection_id)
    elif route_key == '$disconnect':
        return handle_disconnect(connection_id)
    elif route_key == 'message':
        return handle_message(event)
    
    return {'statusCode': 200}

def handle_connect(connection_id):
    try:
        connections_table.put_item(
            Item={
                'connection_id': connection_id,
                'timestamp': datetime.utcnow().isoformat(),
                'ttl': int(datetime.utcnow().timestamp()) + 86400  # 24 hours
            }
        )
        return {'statusCode': 200}
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_disconnect(connection_id):
    try:
        connections_table.delete_item(Key={'connection_id': connection_id})
        return {'statusCode': 200}
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}

def handle_message(event):
    connection_id = event.get('requestContext', {}).get('connectionId')
    body = json.loads(event.get('body', '{}'))
    
    # Echo message back or handle specific commands
    response_message = {
        'type': 'response',
        'message': f"Received: {body.get('message', 'ping')}",
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # Send response back to client
    apigateway = boto3.client('apigatewaymanagementapi',
                             endpoint_url=f"https://{event['requestContext']['domainName']}/{event['requestContext']['stage']}")
    
    try:
        apigateway.post_to_connection(
            ConnectionId=connection_id,
            Data=json.dumps(response_message)
        )
    except Exception as e:
        print(f"Failed to send message: {e}")
    
    return {'statusCode': 200}