from nodes.html_validator import html_validator

state = {
    "optimized_file": "test-smart-suggestions.optimized.html"
}

result = html_validator.func(state)  # usa .func per bypassare LangGraph
print(result["validation_report"])
