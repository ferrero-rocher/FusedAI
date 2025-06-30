from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from typing import List, Optional
import openai

# Load environment variables
load_dotenv()
print("Loaded OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))

app = FastAPI(
    title="FusedAI API",
    description="Backend API for FusedAI application",
    version="1.0.0"
)

# CORS middleware configuration
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load API key from environment
API_KEY = os.getenv("API_KEY", "default-api-key")

# Load OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY

# Pydantic models
class Message(BaseModel):
    content: str
    user_id: Optional[str] = None

class Response(BaseModel):
    message: str
    status: str
    data: Optional[dict] = None

class ApiKeyResponse(BaseModel):
    api_key_loaded: bool
    api_key_length: int
    api_key_preview: str

class GenerateUIRequest(BaseModel):
    prompt: str

class GenerateUIResponse(BaseModel):
    code: str
    model: str

class GenerateEndpointRequest(BaseModel):
    prompt: str

class GenerateEndpointResponse(BaseModel):
    code: str
    model: str

# Sample data store (in production, use a database)
messages = []

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to FusedAI API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "FusedAI API"}

@app.get("/api/key-status", response_model=ApiKeyResponse)
async def check_api_key():
    """Check if API key is loaded from environment"""
    return ApiKeyResponse(
        api_key_loaded=API_KEY != "default-api-key",
        api_key_length=len(API_KEY),
        api_key_preview=API_KEY[:8] + "..." if len(API_KEY) > 8 else API_KEY
    )

@app.get("/api/messages", response_model=List[Message])
async def get_messages():
    """Get all messages"""
    return messages

@app.post("/api/messages", response_model=Response)
async def create_message(message: Message):
    """Create a new message"""
    messages.append(message)
    return Response(
        message="Message created successfully",
        status="success",
        data={"id": len(messages), "content": message.content}
    )

@app.get("/api/messages/{message_id}")
async def get_message(message_id: int):
    """Get a specific message by ID"""
    if message_id < 0 or message_id >= len(messages):
        raise HTTPException(status_code=404, detail="Message not found")
    return messages[message_id]

@app.post("/api/generate-ui", response_model=GenerateUIResponse)
async def generate_ui(request: GenerateUIRequest):
    """Generate beautiful, production-ready React component code from a prompt using OpenAI"""
    if not OPENAI_API_KEY:
        raise HTTPException(status_code=500, detail="OpenAI API key not configured.")
    try:
        enrichment = (
            "You are Lovable, an expert UI engineer and designer. "
            "Always generate a beautiful, production-ready React component for the user's prompt, using BOTH Tailwind CSS and Bootstrap for styling and layout. "
            "Import Bootstrap CSS at the top of the file with: import 'bootstrap/dist/css/bootstrap.min.css'; "
            "Use Bootstrap classes for structure and ready-made components (like buttons, cards, forms), and Tailwind for custom colors, spacing, and effects. "
            "In addition, create a SEPARATE custom CSS block for advanced, designer-level polish: gradients, animations, unique button styles, custom fonts, and any effects that go beyond Tailwind and Bootstrap. "
            "Use creative, meaningful class names for your custom CSS and reference them in your component. "
            "The result should look like it was designed by a top UI/UX designer—visually impressive, modern, and interactive. "
            "Never return a minimal, placeholder, or hello world component. "
            "Output both the component and the CSS in separate code blocks, clearly labeled. "
            "Format your response as follows: \n\n"
            "```jsx\n// App.js\n<COMPONENT CODE HERE>\n```\n"
            "```css\n// styles.css\n<CSS CODE HERE>\n```\n"
        )
        user_prompt = enrichment + request.prompt.strip()
        messages = [
            {"role": "system", "content": enrichment},
            {"role": "user", "content": user_prompt}
        ]
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        code = response.choices[0].message.content.strip()
        print("OpenAI raw response:\n", code)
        return GenerateUIResponse(code=code, model="gpt-4o")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")

@app.post("/api/generate-endpoint", response_model=GenerateEndpointResponse)
async def generate_endpoint(request: GenerateEndpointRequest):
    """Generate FastAPI endpoint code from a prompt using OpenAI (or return mock if not configured)"""
    if not OPENAI_API_KEY:
        # Return a mocked FastAPI endpoint as a string
        mock_code = (
            "from fastapi import APIRouter\n\nrouter = APIRouter()\n\n@router.get(\"/mock\")\ndef mock_endpoint():\n    return {\"message\": \"This is a mocked endpoint.\"}"
        )
        return GenerateEndpointResponse(code=mock_code, model="mock")
    try:
        enrichment = (
            "You are an expert Python backend engineer. Generate a production-ready FastAPI endpoint for the user's prompt. "
            "The code should be clean, well-documented, and use best practices. Output only the code in a single code block."
        )
        user_prompt = enrichment + request.prompt.strip()
        messages = [
            {"role": "system", "content": enrichment},
            {"role": "user", "content": user_prompt}
        ]
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        code = response.choices[0].message.content.strip()
        print("OpenAI raw response (endpoint):\n", code)
        return GenerateEndpointResponse(code=code, model="gpt-4o")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI error: {e}")

print("OpenAI version:", openai.__version__)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=debug) 