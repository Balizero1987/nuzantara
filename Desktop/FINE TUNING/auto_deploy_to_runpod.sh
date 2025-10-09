#!/bin/bash
# Auto-deploy script changes to RunPod
# Usage: ./auto_deploy_to_runpod.sh [pod_ssh_address]

POD_SSH="${1:-tgbuho4gr9w9oe-6441195e@ssh.runpod.io}"
SSH_KEY="$HOME/.runpod/ssh/RunPod-Key-Go"
REPO_URL="https://github.com/Balizero1987/nuzantara.git"

echo "🚀 Auto-deploying to RunPod: $POD_SSH"

# 1. Commit local changes
git add .
git commit -m "Auto-update from Claude Code $(date +%Y%m%d_%H%M%S)" || echo "No changes to commit"
git push origin claude

# 2. Deploy to RunPod via SSH
ssh -T "$POD_SSH" -i "$SSH_KEY" << 'REMOTE_COMMANDS'
cd /workspace

# Clone or pull repo
if [ ! -d "nuzantara" ]; then
  git clone https://github.com/Balizero1987/nuzantara.git
  cd nuzantara
  git checkout claude
else
  cd nuzantara
  git pull origin claude
fi

# Copy training files to workspace
cp -f "FINE TUNING/train_fixed.py" /workspace/train_fixed.py 2>/dev/null || echo "No train_fixed.py"
cp -f "FINE TUNING/"*.py /workspace/ 2>/dev/null || true

echo "✅ Deployment complete!"
ls -lh /workspace/*.py
REMOTE_COMMANDS

echo "✅ Done! Files deployed to RunPod"
