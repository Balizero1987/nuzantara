import os, json, subprocess
from qwen_agent import QwenAgent
from langchain.vectorstores import Chroma
from langchain.embeddings import OpenAIEmbeddings
from datetime import datetime

# Load config
config = json.load(open("learning_agent_config.json"))
vector_store = Chroma(persist_directory=config["vector_store"], embedding_function=OpenAIEmbeddings())

agent = QwenAgent(model=config["model"], api_key=os.getenv("QWEN_API_KEY"))

def collect_code_diffs():
    """Get last 10 commits diff"""
    diffs = subprocess.check_output(["git", "log", "-10", "-p"], text=True)
    return diffs

def update_vector_memory(diffs):
    vector_store.add_texts([diffs], metadatas=[{"timestamp": datetime.utcnow().isoformat()}])
    vector_store.persist()

def generate_pattern_suggestions():
    prompt = f"""
    You are a Learning Agent observing code evolution.
    Analyze the recent diffs and suggest architectural or stylistic improvements
    that align with clean, maintainable, secure code patterns.
    """
    result = agent.chat(prompt)
    return result["output_text"]

if __name__ == "__main__":
    diffs = collect_code_diffs()
    update_vector_memory(diffs)
    suggestions = generate_pattern_suggestions()

    os.makedirs(config["output_dir"], exist_ok=True)
    report_path = f"{config['output_dir']}/learning_report_{datetime.now().strftime('%Y%m%d')}.md"
    with open(report_path, "w") as f:
        f.write("# 🧠 Learning Agent Report\n\n")
        f.write(suggestions)
    print(f"✅ Report saved: {report_path}")

