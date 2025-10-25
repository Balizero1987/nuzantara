# prompt_cleaner.py

# Script per trasformare linguaggio naturale in prompt per Claude Code
user_input = input("Scrivi il tuo messaggio naturale: ")

def format_prompt(text):
    return (
        "You are Claude Code, a powerful AI coding assistant. "
        "Transform the following request into clean, idiomatic Python code. "
        "Be concise and use best practices. Do not explain unless asked.\n\n"
        f"User request: {text.strip()}\n\n"
        "Now generate the code only:"
    )

formatted = format_prompt(user_input)

print("\n🎯 Prompt per Claude Code:\n")
print(formatted)

