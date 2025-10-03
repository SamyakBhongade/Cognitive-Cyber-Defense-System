import json
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
alerts_table = dynamodb.Table('CyberDefense-Alerts')
feedback_table = dynamodb.Table('CyberDefense-Feedback')

def lambda_handler(event, context):
    try:
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        
        if http_method == 'POST' and path == '/alerts':
            return create_alert(event)
        elif http_method == 'GET' and path == '/alerts':
            return get_alerts(event)
        elif http_method == 'POST' and path == '/feedback':
            return submit_feedback(event)
        else:
            return {
                'statusCode': 404,
                'headers': cors_headers(),
                'body': json.dumps({'error': 'Not found'})
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers(),
            'body': json.dumps({'error': str(e)})
        }

def create_alert(event):
    body = json.loads(event['body'])
    alert_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()
    
    alert_data = {
        'alert_id': alert_id,
        'timestamp': timestamp,
        'entity': body.get('entity', 'unknown'),
        'severity': body.get('severity', 'medium'),
        'anomaly_score': Decimal(str(body.get('anomaly_score', 0.5))),
        'reason': body.get('reason', 'Anomaly detected'),
        'features': body.get('features', []),
        'status': 'active',
        'ttl': int(datetime.utcnow().timestamp()) + (30 * 24 * 60 * 60)
    }
    
    alerts_table.put_item(Item=alert_data)
    
    return {
        'statusCode': 201,
        'headers': cors_headers(),
        'body': json.dumps({'alert_id': alert_id, 'message': 'Alert created'})
    }

def get_alerts(event):
    query_params = event.get('queryStringParameters') or {}
    limit = int(query_params.get('limit', 100))
    
    response = alerts_table.scan(Limit=limit)
    alerts = []
    
    for item in response['Items']:
        alert = dict(item)
        if 'anomaly_score' in alert:
            alert['anomaly_score'] = float(alert['anomaly_score'])
        alerts.append(alert)
    
    return {
        'statusCode': 200,
        'headers': cors_headers(),
        'body': json.dumps({'alerts': alerts})
    }

def submit_feedback(event):
    body = json.loads(event['body'])
    feedback_id = str(uuid.uuid4())
    
    feedback_data = {
        'feedback_id': feedback_id,
        'alert_id': body['alert_id'],
        'feedback_type': body['feedback']['type'],
        'comment': body['feedback'].get('comment', ''),
        'timestamp': datetime.utcnow().isoformat()
    }
    
    feedback_table.put_item(Item=feedback_data)
    
    return {
        'statusCode': 201,
        'headers': cors_headers(),
        'body': json.dumps({'message': 'Feedback submitted'})
    }

def cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    }