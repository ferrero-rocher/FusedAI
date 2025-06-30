import openai
print("OpenAI version:", openai.__version__)
openai.api_key = "sk-..."  # <-- put your real key here
response = openai.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "Say hello as a React component."},
        {"role": "user", "content": "Say hello!"}
    ],
    max_tokens=100,
)
print(response)