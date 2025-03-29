from fastapi import FastAPI
from pydantic import BaseModel
from langchain_groq import ChatGroq
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Initialize LLM
llm = ChatGroq(model="deepseek-r1-distill-llama-70b")

class MeetingSummary(BaseModel):
    text: str

@app.post("/analyze")
def analyze_meeting(summary: MeetingSummary):
    response = llm.invoke(f"""
        Provide a structured and well-formatted analysis of this meeting transcript, including:
        **📊 Sentiment Analysis**: (positive, negative, neutral, and overall tone)
        **📌 Key Topics Discussed**: A list of the main topics covered.
        **🤝 Interaction & Engagement**: Insights on participant engagement and collaboration.
        **⚠️ Conflicts & Unresolved Issues**: Any disagreements or pending matters.
        **✅ Actionable Recommendations**: Steps to improve future meetings.
        
        Here is the meeting summary:
        {summary.text}
    """)
    
    sentiment = llm.invoke(f"Summarize the sentiment of this meeting in a concise, structured manner: {summary.text}")
    key_topics = llm.invoke(f"Extract and format the key topics discussed as bullet points: {summary.text}")
    engagement = llm.invoke(f"Provide a well-structured analysis of participant engagement and interactions: {summary.text}")
    conflicts = llm.invoke(f"Identify and describe any conflicts or unresolved issues in a professional tone: {summary.text}")
    recommendations = llm.invoke(f"Provide clear, structured, and actionable recommendations: {summary.text}")
    
    return {
        "Detailed Analysis": f"""\n### 📊 Sentiment Analysis\n{sentiment}\n\n### 📌 Key Topics Discussed\n{key_topics}\n\n### 🤝 Interaction & Engagement\n{engagement}\n\n### ⚠️ Conflicts & Unresolved Issues\n{conflicts}\n\n### ✅ Actionable Recommendations\n{recommendations}\n"""
    }
