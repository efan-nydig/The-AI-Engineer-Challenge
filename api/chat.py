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
            developer_message = request_data.get('developer_message', 'You are a helpful AI assistant.')
            user_message = request_data.get('user_message')
            model = request_data.get('model', 'gpt-4.1-nano')
            
            if not api_key or not user_message:
                self.send_error(400, "API key and user message are required")
                return
            
            # Initialize OpenAI client
            client = OpenAI(api_key=api_key)
            
            # Create streaming chat completion
            stream = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "developer", "content": developer_message},
                    {"role": "user", "content": user_message}
                ],
                stream=True
            )
            
            # Send response headers for streaming
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            
            # Stream the response
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    self.wfile.write(chunk.choices[0].delta.content.encode())
                    self.wfile.flush()
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            error_response = {"error": str(e)}
            self.wfile.write(json.dumps(error_response).encode())
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
