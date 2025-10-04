import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const client = new SecretManagerServiceClient();
export async function getSecretString(projectId, secretId) {
    try {
        const name = `projects/${projectId}/secrets/${secretId}/versions/latest`;
        const [version] = await client.accessSecretVersion({ name });
        const payload = version.payload?.data?.toString();
        return payload ?? null;
    }
    catch (err) {
        // Not found or no versions
        if (err?.code === 5 || err?.code === 7)
            return null;
        throw err;
    }
}
export async function setSecretString(projectId, secretId, value) {
    const parent = `projects/${projectId}`;
    const secretName = `projects/${projectId}/secrets/${secretId}`;
    // Ensure secret exists
    try {
        await client.getSecret({ name: secretName });
    }
    catch (err) {
        if (err?.code === 5) {
            await client.createSecret({
                parent,
                secretId,
                secret: { replication: { automatic: {} } }
            });
        }
        else {
            throw err;
        }
    }
    // Add a new version
    await client.addSecretVersion({
        parent: secretName,
        payload: { data: Buffer.from(value, "utf8") }
    });
}
