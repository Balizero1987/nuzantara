import os
import subprocess

def get_git_files():
    try:
        # Get tracked files
        tracked = subprocess.check_output(['git', 'ls-files'], text=True).splitlines()
        # Get untracked but not ignored files
        untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], text=True).splitlines()
        return sorted(set(tracked + untracked))
    except subprocess.CalledProcessError:
        # Fallback if not a git repo (unlikely here)
        return []

def is_binary(file_path):
    try:
        with open(file_path, 'tr') as check_file:
            check_file.read()
            return False
    except:
        return True

def main():
    output_file = 'nuzantara_codebase.md'
    files = get_git_files()
    
    # Filter out unwanted files
    excluded_extensions = {
        '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', 
        '.ttf', '.eot', '.mp4', '.webm', '.mp3', '.wav', '.zip', '.tar.gz', 
        '.pyc', '.pyo', '.pyd', '.so', '.dll', '.exe', '.bin', '.lock',
        '.pdf', '.sqlite3', '.db', '.sqlite'
    }
    
    excluded_files = {
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb',
        'poetry.lock', 'Pipfile.lock', 'nuzantara_codebase.zip', output_file
    }

    with open(output_file, 'w', encoding='utf-8') as out:
        out.write('# Nuzantara Codebase\n\n')
        
        for file_path in files:
            # Skip excluded files and extensions
            if file_path in excluded_files:
                continue
            
            _, ext = os.path.splitext(file_path)
            if ext.lower() in excluded_extensions:
                continue
                
            # Skip specific directories if git didn't catch them (double check)
            if 'node_modules/' in file_path or '.git/' in file_path or '.next/' in file_path:
                continue

            if is_binary(file_path):
                continue

            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read()
                    
                # Skip empty files
                if not content.strip():
                    continue
                    
                out.write(f'## File: {file_path}\n\n')
                
                # Determine language for syntax highlighting
                lang = ''
                if ext == '.py': lang = 'python'
                elif ext in ['.js', '.jsx', '.cjs', '.mjs']: lang = 'javascript'
                elif ext in ['.ts', '.tsx']: lang = 'typescript'
                elif ext == '.html': lang = 'html'
                elif ext == '.css': lang = 'css'
                elif ext == '.json': lang = 'json'
                elif ext == '.md': lang = 'markdown'
                elif ext in ['.sh', '.bash', '.zsh']: lang = 'bash'
                elif ext == '.yaml' or ext == '.yml': lang = 'yaml'
                elif ext == '.toml': lang = 'toml'
                
                out.write(f'```{lang}\n')
                out.write(content)
                out.write('\n```\n\n')
                print(f"Added {file_path}")
                
            except Exception as e:
                print(f"Error reading {file_path}: {e}")

    print(f"Successfully created {output_file}")

if __name__ == "__main__":
    main()
