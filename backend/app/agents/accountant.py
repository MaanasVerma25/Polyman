import logging
from typing import Dict, Any
from .base import BaseAgent
from ..engine.llm import llm_gateway
from ..tools.doc_tools import save_report

logger = logging.getLogger("polyman.agent.accountant")

class AccountantAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="accountant",
            name="Financial Accountant",
            system_prompt=(
                "You are a Cloud FinOps and Software Financial Accountant. You model server compute costs, "
                "database storage tiers, API token consumption, operational margins, and unit economics."
            ),
            default_provider="gemini",
            default_model="gemini-2.5-flash",
            avatar="Calculator",
            color="#8b5cf6"
        )

    async def execute_node(
        self,
        project_path: str,
        run_id: str,
        node_id: str,
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        await self.log_event(run_id, node_id, "thought", f"Modeling cloud infrastructure and API budget for: '{task_prompt}'")

        prompt = (
            f"Generate a Cloud FinOps Cost Estimation Model and Monthly OpEx breakdown for:\n"
            f"TASK: {task_prompt}\n\n"
            f"Include compute hosting, database, API token projections, unit economics per user, and break-even thresholds."
        )

        cost_report = await llm_gateway.generate_response(
            system_prompt=self.system_prompt,
            user_prompt=prompt,
            provider=self.default_provider,
            model=self.default_model
        )

        rep_meta = save_report(project_path, "financial", "cost_and_budget_model.md", cost_report)
        await self.log_event(run_id, node_id, "thought", f"Persisted financial model to {rep_meta['report_path']}")
        await self.log_event(run_id, node_id, "output", f"Financial projection modeled. Deliverable in {rep_meta['report_path']}")

        return {
            "status": "completed",
            "report_path": rep_meta["report_path"],
            "summary": "Generated comprehensive FinOps cost and infrastructure budget model."
        }
