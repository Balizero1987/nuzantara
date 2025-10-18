# Security Checklist (Blockchain Deployments)

- [ ] Solidity compiler pinned to latest 0.8.x release.
- [ ] OpenZeppelin contracts used without local modifications.
- [ ] Unit, fuzz, and property tests (Foundry/Echidna) passing in CI.
- [ ] Static analysis (Slither) clean with findings triaged.
- [ ] External audit completed and remediations merged.
- [ ] Contracts verified on Etherscan/Sourcify with metadata artifacts.
- [ ] Incident runbook documented (upgrade, pause, revoke) and key rotation plan ready.
