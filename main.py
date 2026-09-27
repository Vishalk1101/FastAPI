from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "Message": "Welcome to the FastAPI Project!"
    }