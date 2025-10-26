# test_web_layout_optimizer.py
from nodes.web_layout_optimizer import web_layout_optimizer

def web_layout_optimizer_standalone(state):
    # Chiama la funzione vera ma ignora il decorator
    func = web_layout_optimizer.func  # rimuove il wrapper LangGraph
    return func(state)

if __name__ == "__main__":
    state = {'file_path': 'test-smart-suggestions.html'}
    print(web_layout_optimizer_standalone(state))
