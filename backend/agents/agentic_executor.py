"""
AgentHive Agentic Executor — A real tool-use loop like Claude Code.

Flow:
  1. Send task + tool definitions to the LLM
  2. LLM responds with either tool_calls or content
  3. If tool_calls → execute them → feed results back → loop
  4. If content only + no tool_calls → check if done
  5. Keep going until task_complete is called or max iterations reached
  6. Stream everything live via a callback
"""

import json
import os
from typing import Any, Callable
# pyrefly: ignore [missing-import]
from openai import OpenAI
from agents.tools import TOOL_DEFINITIONS, execute_tool, get_workspace_files


AGENT_SYSTEM_PROMPT = """You are AgentHive WorkerBot — an expert AI agent that builds real projects by creating actual files.

You have access to tools that create real files in a project workspace. USE THEM.

## How You Work
1. Analyze the task requirements
2. Plan the file structure
3. Create each file using the `create_file` tool — one file at a time
4. After creating ALL files, call `task_complete` with a summary

## CRITICAL RULES
- You MUST use `create_file` to create each deliverable file
- Do NOT just output code as text — call the tools to actually create files
- Create complete, production-ready files — never stubs or placeholders
- For web projects: create index.html, styles.css, script.js at minimum
- Call `task_complete` when ALL files are created
- Maximum quality — make it look professional with modern design

## File Creation Strategy
- Create files one at a time using the create_file tool
- Each file should be complete and working
- Use modern best practices for the language/framework
- Include responsive design, animations, and polish for web projects"""


class AgenticExecutor:
    """Runs a multi-turn tool-use loop with the LLM."""

    def __init__(self):
        self.client = OpenAI(
            base_url=os.getenv("LLM_BASE_URL", "https://integrate.api.nvidia.com/v1"),
            api_key=os.getenv("LLM_API_KEY", ""),
        )
        self.model = os.getenv("LLM_MODEL", "nvidia/nemotron-3-ultra-550b-a55b")
        self.max_iterations = 15  # safety limit

    def run(self, task: dict, task_id: str, on_event: Callable):
        """
        Execute a task with a tool-use loop. Calls on_event(event_dict) for each step.

        Event types:
          - {"type": "thinking", "text": "..."}       — reasoning tokens
          - {"type": "tool_call", "name": "...", "args": {...}}  — about to call a tool
          - {"type": "tool_result", "name": "...", "result": {...}} — tool execution result
          - {"type": "content", "text": "..."}         — text output from LLM
          - {"type": "complete", "files": [...], "summary": "..."} — all done
          - {"type": "error", "message": "..."}        — something went wrong
        """
        description = task.get("description", "")
        title = task.get("title", "Task")
        category = task.get("category", task.get("task_type", "general"))
        skills = task.get("skills", task.get("tags", []))
        skills_str = ", ".join(skills) if skills else "general"

        messages = [
            {"role": "system", "content": AGENT_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"## Task: {title}\n"
                f"## Category: {category}\n"
                f"## Skills: {skills_str}\n"
                f"## Description:\n{description}\n\n"
                "Create all deliverable files using the tools provided. "
                "Call task_complete when finished."
            )},
        ]

        iteration = 0
        task_done = False

        while iteration < self.max_iterations and not task_done:
            iteration += 1
            on_event({"type": "iteration", "current": iteration, "max": self.max_iterations})

            try:
                # Call LLM with tools
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                    temperature=0.5,
                    max_tokens=4096,
                    stream=True,
                )

                # Process streamed response
                content_parts = []
                tool_calls_data = {}
                reasoning_parts = []

                for chunk in response:
                    if not chunk.choices:
                        continue

                    delta = chunk.choices[0].delta

                    # Reasoning tokens
                    reasoning = getattr(delta, "reasoning_content", None)
                    if reasoning:
                        reasoning_parts.append(reasoning)
                        on_event({"type": "thinking", "text": reasoning})

                    # Content tokens
                    if delta.content:
                        content_parts.append(delta.content)
                        on_event({"type": "content", "text": delta.content})

                    # Tool calls (accumulated from stream)
                    if delta.tool_calls:
                        for tc in delta.tool_calls:
                            idx = tc.index
                            if idx not in tool_calls_data:
                                tool_calls_data[idx] = {
                                    "id": tc.id or "",
                                    "name": "",
                                    "arguments": ""
                                }
                            if tc.id:
                                tool_calls_data[idx]["id"] = tc.id
                            if tc.function:
                                if tc.function.name:
                                    tool_calls_data[idx]["name"] = tc.function.name
                                if tc.function.arguments:
                                    tool_calls_data[idx]["arguments"] += tc.function.arguments

                # Build the assistant message for conversation history
                assistant_msg: dict[str, Any] = {"role": "assistant"}
                full_content = "".join(content_parts)
                if full_content:
                    assistant_msg["content"] = full_content

                # Process tool calls
                if tool_calls_data:
                    tool_calls_list = []
                    for idx in sorted(tool_calls_data.keys()):
                        tc = tool_calls_data[idx]
                        tool_calls_list.append({
                            "id": tc["id"],
                            "type": "function",
                            "function": {
                                "name": tc["name"],
                                "arguments": tc["arguments"]
                            }
                        })
                    assistant_msg["tool_calls"] = tool_calls_list
                    if not full_content:
                        assistant_msg["content"] = None

                    messages.append(assistant_msg)

                    # Execute each tool call
                    for tc_msg in tool_calls_list:
                        tool_name = tc_msg["function"]["name"]
                        try:
                            args = json.loads(tc_msg["function"]["arguments"])
                        except json.JSONDecodeError:
                            args = {}

                        on_event({
                            "type": "tool_call",
                            "name": tool_name,
                            "args": {k: v[:200] if isinstance(v, str) and len(v) > 200 else v for k, v in args.items()},
                        })

                        # Execute the tool
                        result = execute_tool(tool_name, args, task_id)

                        on_event({
                            "type": "tool_result",
                            "name": tool_name,
                            "result": result,
                        })

                        # Check if task is done
                        if tool_name == "task_complete":
                            task_done = True

                        # Add tool result to messages
                        messages.append({
                            "role": "tool",
                            "tool_call_id": tc_msg["id"],
                            "content": json.dumps(result),
                        })
                else:
                    # No tool calls — just content
                    if full_content:
                        assistant_msg["content"] = full_content
                    messages.append(assistant_msg)
                    # If no tool calls and we have content, the model might be done
                    # but didn't call task_complete. Give it one more chance.
                    if iteration > 2:
                        task_done = True

            except Exception as e:
                on_event({"type": "error", "message": str(e)})
                break

        # Gather all workspace files
        files = get_workspace_files(task_id)
        on_event({
            "type": "complete",
            "files": files,
            "summary": f"Created {len(files)} files in {iteration} iterations",
            "iterations": iteration,
        })
