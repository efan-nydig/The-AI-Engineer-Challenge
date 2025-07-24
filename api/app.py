# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
from typing import Optional

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-nano"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication

# Define the data model for model testing
class ModelTestRequest(BaseModel):
    api_key: str
    model: str

# Define the data model for getting available models
class AvailableModelsRequest(BaseModel):
    api_key: str

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=[
                    {"role": "developer", "content": request.developer_message},
                    {"role": "user", "content": request.user_message}
                ],
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Define an endpoint to debug API key format
@app.post("/api/debug-key")
async def debug_api_key(request: AvailableModelsRequest):
    return {
        "api_key_length": len(request.api_key),
        "api_key_starts_with": request.api_key[:10] if len(request.api_key) > 10 else request.api_key,
        "api_key_ends_with": request.api_key[-10:] if len(request.api_key) > 10 else request.api_key,
        "has_whitespace": any(c.isspace() for c in request.api_key),
        "api_key_repr": repr(request.api_key)
    }

# Define an endpoint to get available models for an API key
@app.post("/api/available-models")
async def get_available_models(request: AvailableModelsRequest):
    try:
        # Debug logging
        print(f"Received API key - Length: {len(request.api_key)}, Starts with: {request.api_key[:20]}, Ends with: {request.api_key[-20:]}")
        
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Get list of available models directly from OpenAI API
        models_response = client.models.list()
        
        # Filter for chat completion models (GPT models)
        chat_models = []
        for model in models_response.data:
            model_id = model.id
            # Filter for GPT models that support chat completions
            if any(keyword in model_id.lower() for keyword in ['gpt', 'davinci', 'curie', 'babbage', 'ada']):
                chat_models.append(model_id)
        
        # Sort models by preference (GPT-4.1 models first, then GPT-4, etc.)
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
        
        print(f"Found {len(sorted_models)} available models: {sorted_models}")  # Debug output
        
        return {"available_models": sorted_models}
    except Exception as e:
        print(f"Error fetching models: {str(e)}")  # Debug output
        return {"available_models": [], "error": str(e)}

# Define a model testing endpoint
@app.post("/api/test-model")
async def test_model(request: ModelTestRequest):
    try:
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Try a minimal completion request to test model access
        response = client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": "Hi"}],
            max_tokens=1
        )
        
        return {"available": True}
    except Exception as e:
        error_msg = str(e)
        return {"available": False, "error": error_msg}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
