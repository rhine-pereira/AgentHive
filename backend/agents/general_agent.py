from agents.base_agent import BaseAgent
from typing import Dict, Any
from openai import OpenAI
import os

# Claude Code-inspired system prompt for the AgentHive worker
WORKER_SYSTEM_PROMPT = """You are AgentHive WorkerBot — an expert AI coding agent that executes tasks with professional-grade output.

You are given a task with a title and description. Think through the problem step by step, then produce complete deliverables.

## Your Approach
1. Analyze the requirements carefully
2. Plan the file structure and architecture
3. Write complete, production-ready code
4. Add polish: responsive design, animations, modern aesthetics

## Rules for Code Tasks
1. Produce COMPLETE working files — never stubs or placeholders
2. Wrap each file in a fenced code block with the language identifier
3. Put the filename as a comment on the FIRST line inside the code block
4. Use modern best practices for the language/framework
5. Include responsive design for web projects
6. Add subtle animations and polish — make it look professional
7. For HTML/CSS/JS projects: produce index.html, styles.css, and script.js as separate files

## Rules for Content Tasks
1. Write complete, publish-ready content
2. Match the requested tone and audience
3. Structure with clear headings and formatting
4. No filler — every sentence should add value

## Output Format
- Use markdown for structure
- Each file gets its own fenced code block
- Start each code block with a comment containing the filename
- After the code, add a brief "How to use" section

Be thorough. Be ambitious. Produce work that justifies the budget."""


class GeneralAgent(BaseAgent):
    """General-purpose AI agent using Nvidia Nemotron Ultra 550B with reasoning."""

    def __init__(self, agent_id: int = 1):
        super().__init__(
            agent_id=agent_id,
            agent_type="general",
            name=f"WorkerBot #{agent_id}",
        )
        self.client = OpenAI(
            base_url=os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("LLM_API_KEY", ""),
        )
        self.model = os.getenv("LLM_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")

    def _build_messages(self, task: dict) -> list:
        description = task.get("description", "")
        title = task.get("title", "Task")
        category = task.get("category", task.get("task_type", "general"))
        skills = task.get("skills", task.get("tags", []))
        skills_str = ", ".join(skills) if skills else "general"

        return [
            {"role": "system", "content": WORKER_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"## Task: {title}\n"
                f"## Category: {category}\n"
                f"## Skills: {skills_str}\n"
                f"## Description:\n{description}\n\n"
                "Think through this carefully, then produce all deliverables."
            )},
        ]

    def execute_stream(self, task: dict):
        """Yield (type, text) tuples — 'reasoning' for thinking, 'content' for output."""
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=self._build_messages(task),
            temperature=0.6,
            top_p=0.95,
            max_tokens=16384,
            extra_body={
                "chat_template_kwargs": {"enable_thinking": True},
                "reasoning_budget": 8192,
            },
            stream=True,
        )
        for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta
            # Reasoning tokens (the agent's thinking process)
            reasoning = getattr(delta, "reasoning_content", None)
            if reasoning:
                yield ("reasoning", reasoning)
            # Content tokens (the actual output)
            if delta.content:
                yield ("content", delta.content)

    async def execute(self, task: dict) -> Dict[str, Any]:
        """Consume the full stream and return a result dict."""
        output_parts = []
        for token_type, text in self.execute_stream(task):
            if token_type == "content":
                output_parts.append(text)

        output = "".join(output_parts)
        title = task.get("title", "Task")
        word_count = len(output.split())
        quality = min(95, 60 + word_count // 20)

        return {
            "output": output,
            "summary": f"Completed: {title} ({word_count} words generated)",
            "quality_estimate": quality,
        }
