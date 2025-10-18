/**
 * Deployment tools for Zero mode
 * Trigger GitHub Actions workflows
 */
import { Octokit } from '@octokit/rest';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const OWNER = 'Balizero1987';
const REPO = 'nuzantara';
/**
 * Deploy TypeScript backend via GitHub Actions
 */
export async function deployBackendZero() {
    try {
        if (!GITHUB_TOKEN) {
            return { ok: false, error: 'GITHUB_TOKEN not configured' };
        }
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        await octokit.actions.createWorkflowDispatch({
            owner: OWNER,
            repo: REPO,
            workflow_id: 'deploy-backend-api.yml',
            ref: 'main'
        });
        // GitHub API doesn't return run ID immediately, need to poll
        await new Promise(resolve => setTimeout(resolve, 2000));
        const runs = await octokit.actions.listWorkflowRuns({
            owner: OWNER,
            repo: REPO,
            workflow_id: 'deploy-backend-api.yml',
            per_page: 1
        });
        const latestRun = runs.data.workflow_runs[0];
        const result = { ok: true };
        if (latestRun?.id) {
            result.workflowId = latestRun.id;
            result.runId = latestRun.id;
        }
        if (latestRun?.html_url) {
            result.url = latestRun.html_url;
        }
        return result;
    }
    catch (error) {
        return {
            ok: false,
            error: error.message
        };
    }
}
/**
 * Deploy RAG backend via GitHub Actions
 */
export async function deployRagZero() {
    try {
        if (!GITHUB_TOKEN) {
            return { ok: false, error: 'GITHUB_TOKEN not configured' };
        }
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        await octokit.actions.createWorkflowDispatch({
            owner: OWNER,
            repo: REPO,
            workflow_id: 'deploy-rag-amd64.yml',
            ref: 'main'
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        const runs = await octokit.actions.listWorkflowRuns({
            owner: OWNER,
            repo: REPO,
            workflow_id: 'deploy-rag-amd64.yml',
            per_page: 1
        });
        const latestRun = runs.data.workflow_runs[0];
        const result = { ok: true };
        if (latestRun?.id) {
            result.workflowId = latestRun.id;
            result.runId = latestRun.id;
        }
        if (latestRun?.html_url) {
            result.url = latestRun.html_url;
        }
        return result;
    }
    catch (error) {
        return {
            ok: false,
            error: error.message
        };
    }
}
/**
 * Check workflow run status
 */
export async function checkWorkflowStatusZero(runId) {
    try {
        if (!GITHUB_TOKEN) {
            return { ok: false, error: 'GITHUB_TOKEN not configured' };
        }
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const { data } = await octokit.actions.getWorkflowRun({
            owner: OWNER,
            repo: REPO,
            run_id: runId
        });
        return {
            ok: true,
            status: data.status,
            conclusion: data.conclusion,
            url: data.html_url
        };
    }
    catch (error) {
        return {
            ok: false,
            error: error.message
        };
    }
}
/**
 * List recent workflow runs
 */
export async function listRecentDeploymentsZero(limit = 5) {
    try {
        if (!GITHUB_TOKEN) {
            return { ok: false, error: 'GITHUB_TOKEN not configured' };
        }
        const octokit = new Octokit({ auth: GITHUB_TOKEN });
        const { data } = await octokit.actions.listWorkflowRunsForRepo({
            owner: OWNER,
            repo: REPO,
            per_page: limit
        });
        const deployments = data.workflow_runs.map(run => {
            const deployment = {
                id: run.id,
                name: run.name || '',
                status: run.status || '',
                createdAt: run.created_at,
                url: run.html_url
            };
            if (run.conclusion) {
                deployment.conclusion = run.conclusion;
            }
            return deployment;
        });
        return {
            ok: true,
            deployments
        };
    }
    catch (error) {
        return {
            ok: false,
            error: error.message
        };
    }
}
