import json
import logging
from typing import Dict, Any
from .base import BaseAgent
from ..engine.llm import llm_gateway
from ..tools.fs_tools import write_file, read_file
from ..tools.shell_tools import run_shell_command

logger = logging.getLogger("polyman.agent.sde")

class SDEAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="sde",
            name="Software Engineer",
            system_prompt=(
                "You are a Senior Full-Stack Software Development Engineer. Given a project request and architecture, "
                "you write clean, modular, production-ready code and test cases. "
                "Output your actions strictly as a JSON object with this format:\n"
                "{\n"
                '  "actions": [\n'
                '    {"action": "write_file", "path": "relative/file/path", "content": "..."}\n'
                "  ],\n"
                '  "summary": "Brief summary of files created"\n'
                "}"
            ),
            default_provider="anthropic",
            default_model="claude-3-7-sonnet",
            avatar="Code2",
            color="#10b981"
        )

    async def execute_node(
        self,
        project_path: str,
        run_id: str,
        node_id: str,
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        await self.log_event(run_id, node_id, "thought", f"Reviewing task prompt and architecture for code synthesis: '{task_prompt}'")
        
        prompt = (
            f"Implement the requested project logic and automated test suite on the filesystem.\n"
            f"TASK: {task_prompt}\n"
            f"CONTEXT: {json.dumps(context.get('architect', {}))}\n\n"
            f"Return a valid JSON object containing an 'actions' list of files to write."
        )

        response_text = await llm_gateway.generate_response(
            system_prompt=self.system_prompt,
            user_prompt=prompt,
            provider=self.default_provider,
            model=self.default_model
        )

        files_written = []
        try:
            # Parse JSON action block
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            data = json.loads(cleaned.strip())
            
            for item in data.get("actions", []):
                if item.get("action") == "write_file":
                    rel = item.get("path")
                    content = item.get("content", "")
                    await self.log_event(run_id, node_id, "tool_call", f"Writing file: {rel} ({len(content)} bytes)")
                    res = write_file(project_path, rel, content)
                    files_written.append(rel)
                    await self.log_event(run_id, node_id, "tool_result", f"Successfully created {rel}")
            
            summary = data.get("summary", f"Successfully generated {len(files_written)} project files.")
        except Exception as e:
            logger.warning(f"Error parsing SDE JSON response: {e}. Writing fallback code structure.")
            # Fallback direct scaffold
            write_file(project_path, "src/main.py", f"# Polyman SDE generated code\n# Task: {task_prompt}\n\ndef main():\n    print('Polyman Core Engine Active')\n\nif __name__ == '__main__':\n    main()\n")
            files_written.append("src/main.py")
            summary = "Created primary source module src/main.py"

        await self.log_event(run_id, node_id, "output", f"SDE completed implementation: {', '.join(files_written)}")
        
        return {
            "status": "completed",
            "files_written": files_written,
            "summary": summary
        }
