import json
import logging
from typing import Dict, Any
from .base import BaseAgent
from ..engine.llm import llm_gateway
from ..tools.doc_tools import save_report

logger = logging.getLogger("polyman.agent.architect")

class ArchitectAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="architect",
            name="System Architect",
            system_prompt=(
                "You are a Principal Software Architect. You decompose technical requirements into "
                "robust architectural blueprints, module boundaries, system topologies, and directory layouts. "
                "Always generate a thorough Architecture Decision Record (ADR) in Markdown."
            ),
            default_provider="gemini",
            default_model="gemini-2.5-flash",
            avatar="Layers",
            color="#0ea5e9"
        )

    async def execute_node(
        self,
        project_path: str,
        run_id: str,
        node_id: str,
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        await self.log_event(run_id, node_id, "thought", f"Analyzing architecture requirements for: '{task_prompt}'")
        
        prompt = (
            f"Design the system architecture and component structure for the following project request:\n\n"
            f"TASK: {task_prompt}\n\n"
            f"Provide a complete Architecture Decision Record (ADR) with System Topology, Component Seams, "
            f"Directory Structure, and API Contracts."
        )

        adr_content = await llm_gateway.generate_response(
            system_prompt=self.system_prompt,
            user_prompt=prompt,
            provider=self.default_provider,
            model=self.default_model
        )

        await self.log_event(run_id, node_id, "thought", "Drafted system blueprint. Persisting to docs/architecture/ADR_system_design.md...")
        report_meta = save_report(project_path, "architecture", "ADR_system_design.md", adr_content)
        
        await self.log_event(run_id, node_id, "output", f"Architecture Decision Record created at {report_meta['report_path']}")
        
        return {
            "status": "completed",
            "adr_path": report_meta["report_path"],
            "summary": "Generated comprehensive Architecture Decision Record and module boundaries."
        }
