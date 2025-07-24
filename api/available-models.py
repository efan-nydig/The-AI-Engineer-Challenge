from http.server import BaseHTTPRequestHandler
import json
from openai import OpenAI

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read the request body
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))
            
            api_key = request_data.get('api_key')
            if not api_key:
                self.send_error(400, "API key is required")
                return
            
            # Initialize OpenAI client
            client = OpenAI(api_key=api_key)
            
            # Get available models
            models_response = client.models.list()
            
            # Filter for GPT models
            chat_models = []
            for model in models_response.data:
                model_id = model.id
                if any(keyword in model_id.lower() for keyword in ['gpt', 'davinci', 'curie', 'babbage', 'ada']):
                    chat_models.append(model_id)
            
            # Sort models by preference
            def model_priority(model_name):
                if 'gpt-4.1-nano' in model_name:
                    return 1
                elif 'gpt-4.1-mini' in model_name:
                    return 2
                elif 'gpt-4.1' in model_name:
                    return 3
                elif 'gpt-4o' in model_name:
                    return 4
                elif 'gpt-4' in model_name:
                    return 5
                elif 'gpt-3.5' in model_name:
                    return 6
                elif 'davinci' in model_name:
                    return 7
                else:
                    return 8
            
            sorted_models = sorted(chat_models, key=model_priority)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            response = {"available_models": sorted_models}
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {"available_models": [], "error": str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
