import logging
from typing import Dict, Any
from .base import BaseAgent
from ..engine.llm import llm_gateway
from ..tools.doc_tools import save_report
from ..tools.fs_tools import write_file

logger = logging.getLogger("polyman.agent.lawyer")

class LawyerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            role="lawyer",
            name="Legal Counsel",
            system_prompt=(
                "You are a specialized Corporate Tech and Open-Source Legal Counsel. "
                "You assess open source dependency risks, GDPR/CCPA privacy guidelines, and "
                "draft license attribution and commercial Terms of Service."
            ),
            default_provider="openai",
            default_model="gpt-4o",
            avatar="Scale",
            color="#f59e0b"
        )

    async def execute_node(
        self,
        project_path: str,
        run_id: str,
        node_id: str,
        task_prompt: str,
        context: Dict[str, Any]
    ) -> Dict[str, Any]:
        await self.log_event(run_id, node_id, "thought", f"Conducting legal & licensing analysis for: '{task_prompt}'")

        prompt = (
            f"Provide a comprehensive Legal & License Compliance Audit Report and recommended open source license for:\n"
            f"TASK: {task_prompt}\n\n"
            f"Include dependency license categorization, GDPR/CCPA privacy advisories, and warranty clauses."
        )

        legal_report = await llm_gateway.generate_response(
            system_prompt=self.system_prompt,
            user_prompt=prompt,
            provider=self.default_provider,
            model=self.default_model
        )

        # Save legal audit report
        rep_meta = save_report(project_path, "legal", "legal_compliance_audit.md", legal_report)
        await self.log_event(run_id, node_id, "thought", f"Saved legal compliance audit to {rep_meta['report_path']}")

        # Ensure standard LICENSE file is in project root
        mit_license = (
            "MIT License\n\n"
            "Copyright (c) 2026 Polyman Project Contributors\n\n"
            "Permission is hereby granted, free of charge, to any person obtaining a copy\n"
            "of this software and associated documentation files (the 'Software'), to deal\n"
            "in the Software without restriction, including without limitation the rights\n"
            "to use, copy, modify, merge, publish, distribute, sublicense, and/or sell\n"
            "copies of the Software, and to permit persons to whom the Software is\n"
            "furnished to do so, subject to the following conditions:\n\n"
            "The above copyright notice and this permission notice shall be included in all\n"
            "copies or substantial portions of the Software.\n\n"
            "THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\n"
            "IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\n"
            "FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.\n"
        )
        write_file(project_path, "LICENSE", mit_license)
        await self.log_event(run_id, node_id, "tool_result", "Generated MIT LICENSE in project root.")
        await self.log_event(run_id, node_id, "output", f"Legal analysis completed. Reports in {rep_meta['report_path']}")

        return {
            "status": "completed",
            "report_path": rep_meta["report_path"],
            "license": "MIT",
            "summary": "Completed license risk assessment and published LICENSE."
        }
