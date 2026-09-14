import urllib.request
import json
import time

def run_test():
    url = "http://127.0.0.1:8000/api/runs"
    payload = json.dumps({
        "task_prompt": "Build a secure microservice API with JWT authentication, budget estimation, and MIT license compliance"
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        run_id = data["run_id"]
        print(f"Created Run: {run_id}")

    # Wait for autonomous DAG execution
    for i in range(10):
        time.sleep(1)
        with urllib.request.urlopen(f"http://127.0.0.1:8000/api/runs/{run_id}") as resp:
            state = json.loads(resp.read().decode("utf-8"))
            if state["status"] in ["completed", "failed"]:
                print(f"Run completed with status: {state['status']}")
                for node in state.get("nodes", []):
                    print(f"  [{node['agent_role'].upper()}] {node['title']}: {node['status']}")
                print(f"Total live log events generated: {len(state.get('logs', []))}")
                return state

if __name__ == "__main__":
    run_test()
