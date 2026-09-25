import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentServer, AgentSession, room_io
from livekit.plugins import google

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / '.env')
load_dotenv(Path(__file__).resolve().parent / '.env.local')

# The web app uses GEMINI_API_KEY; the LiveKit Google plugin expects GOOGLE_API_KEY.
if os.getenv('GEMINI_API_KEY') and not os.getenv('GOOGLE_API_KEY'):
    os.environ['GOOGLE_API_KEY'] = os.environ['GEMINI_API_KEY']

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('agrovani-agent')

PERSONA = """You are AgroVani, a concise agricultural voice advisor for farmers in India.
Speak simply and naturally. Support English, Hindi, Punjabi, Marathi, Tamil, and Telugu;
reply in the language the farmer uses. Give practical crop, weather, soil, residue, and
farm-management guidance. Never invent weather, disease diagnoses, pesticide doses, or
prices. For high-risk chemical questions, recommend a local agronomist. Ask one short
clarifying question when necessary."""


class AgroVaniAgent(Agent):
    def __init__(self):
        super().__init__(instructions=PERSONA)


server = AgentServer()


@server.rtc_session()
async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        llm=google.realtime.RealtimeModel(
            model=os.getenv('GEMINI_LIVE_MODEL', 'gemini-2.5-flash-native-audio-preview-12-2025'),
            voice=os.getenv('GEMINI_LIVE_VOICE', 'Aoede'),
        ),
    )
    await session.start(
        room=ctx.room,
        agent=AgroVaniAgent(),
        room_options=room_io.RoomOptions(video_input=False),
    )
    await session.generate_reply(instructions='Greet the farmer and ask how you can help today.')


if __name__ == '__main__':
    agents.cli.run_app(server)
