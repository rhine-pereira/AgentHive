from agents.base_agent import BaseAgent
from typing import Dict, Any
import openai
import os


CONTENT_SYSTEM_PROMPT = """You are ContentBot, an expert content writer specializing in:
- Social media captions (Instagram, Twitter, LinkedIn)
- SEO blog posts and articles
- YouTube video scripts
- Product descriptions and copywriting
- Cover letters and professional documents
- Research paper proofreading and editing

Always:
- Match the brand voice and target audience
- Include relevant keywords naturally
- Structure content clearly with headings when appropriate
- Deliver exactly what was requested — no fluff, no filler"""


class ContentAgent(BaseAgent):
    """AI-powered content writing agent."""

    def __init__(self, agent_id: int):
        super().__init__(agent_id=agent_id, agent_type="content", name=f"ContentBot #{agent_id}")
        self.client = openai.AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    async def execute(self, task: dict) -> Dict[str, Any]:
        description = task.get("description", "")
        title       = task.get("title", "Content writing task")
        complexity  = task.get("complexity", "standard")

        max_tokens = {"simple": 800, "standard": 1500, "complex": 2500, "expert": 4000}.get(complexity, 1500)

        messages = [
            {"role": "system",  "content": CONTENT_SYSTEM_PROMPT},
            {"role": "user",    "content": f"Task: {title}\n\nInstructions:\n{description}"},
        ]

        response = await self.client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.75,
        )

        output = response.choices[0].message.content
        quality = min(90, 65 + len(output) // 50)

        return {
            "output":           output,
            "summary":          f"Content created for: {title}",
            "quality_estimate": quality,
        }
