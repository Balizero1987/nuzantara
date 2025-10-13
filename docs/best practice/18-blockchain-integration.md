# 18. Blockchain Integration Best Practices (Zantara Bridge)

Goal: ship smart contracts and Web3 integrations that are secure, verifiable, and maintainable. Minimise risk, maximise transparency.

## A. Smart Contracts for Automation
- Follow ConsenSys smart contract best practices and Solidity security guidelines. Use OpenZeppelin libraries without local modifications.
- Test at multiple levels: unit (Foundry/Hardhat), property-based/fuzz (Echidna), static analysis (Slither). Trail of Bits maintains up-to-date tooling.
- Mainnet readiness: verify contracts on Etherscan/Sourcify, tag releases, publish migration changelog, maintain incident runbook.
- Upgrade pattern: use UUPS or Transparent proxies (OpenZeppelin Upgrades) with `Ownable`/`AccessControl` and governance for change management.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract ZantaraAutomation is UUPSUpgradeable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    function initialize(address owner_) public initializer {
        __Ownable_init(owner_);
        __ReentrancyGuard_init();
    }
    function _authorizeUpgrade(address) internal override onlyOwner {}
    function execute(bytes calldata payload) external nonReentrant onlyOwner {
        // business logic
    }
}
```

## B. IPFS for Distributed Storage
- IPFS is content-addressed: pin content (self-hosted node or pinning service) to ensure persistence; enable garbage collection only for non-pinned data.
- Use IPNS for mutable pointers and Filecoin/web3.storage for incentivised durability.

```ts
import { create } from 'ipfs-http-client'

const ipfs = create({ url: process.env.IPFS_API! })
const { cid } = await ipfs.add({
  path: 'metadata.json',
  content: Buffer.from(JSON.stringify(obj)),
})
// Pin via service API to prevent garbage collection
```

## C. Web3 Authentication
- Implement Sign-In with Ethereum (EIP-4361) with nonce, expiry, domain, and chainId; validate the exact signed payload server-side.
- Use EIP-712 typed data for human-readable signatures and support EIP-1271 for contract wallets.
- Support WalletConnect v2 for multi-wallet compatibility.
- For enterprise federation, consider SIWE-OIDC (SpruceID).

```ts
import { SiweMessage } from 'siwe'

export async function verifySiwe({ message, signature, domain, nonce }: {
  message: string
  signature: string
  domain: string
  nonce: string
}) {
  const msg = new SiweMessage(message)
  const fields = await msg.validate(signature)
  if (fields.domain !== domain) throw new Error('domain mismatch')
  if (fields.nonce !== nonce) throw new Error('nonce mismatch')
  return { address: fields.address, chainId: fields.chainId, expirationTime: fields.expirationTime }
}
```

## D. Crypto Payment Gateways
- Integrate regulated providers (Coinbase Commerce, BitPay). Manage quote TTL, confirmations, and reorg risk for L1 assets.
- Secure webhooks: verify HMAC SHA-256 against the raw payload (`X-CC-Webhook-Signature` for Coinbase). BitPay recommends out-of-band verification.
- Address compliance: FATF Recommendation 15, travel rule obligations, jurisdictional risk.
- Prefer stablecoins (USDC) for checkout to reduce volatility and pseudo-chargeback complexity.

```ts
import crypto from 'crypto'

export function verifyCoinbase(req: { rawBody: Buffer; headers: Record<string, string | string[] | undefined> }, secret: string) {
  const sig = req.headers['x-cc-webhook-signature']
  const hmac = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')
  if (sig !== hmac) throw new Error('invalid signature')
}
```

## E. NFT Integration
- Use ERC-721 or ERC-1155; adopt EIP-2981 for royalty signalling.
- Store metadata using ERC-721 schema with extensions (OpenSea) on IPFS; offer "freeze" options for immutability.

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract ZantaraNFT is ERC721, ERC2981, Ownable {
    string private baseUri;
    constructor(string memory baseURI, address royaltyReceiver, uint96 feeNumerator)
        ERC721("ZantaraNFT", "ZAN")
        Ownable(msg.sender)
    {
        baseUri = baseURI;
        _setDefaultRoyalty(royaltyReceiver, feeNumerator);
    }
    function _baseURI() internal view override returns (string memory) {
        return baseUri;
    }
    function supportsInterface(bytes4 iid) public view override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(iid);
    }
}
```

## Checklists

### SECURITY_CHECKLIST.md
- Latest Solidity 0.8.x; pragma pinned.
- OpenZeppelin contracts unmodified.
- Unit, fuzz, property tests passing (Foundry/Echidna).
- Static analysis clean (Slither).
- External audit completed (scope plus fixes).
- Verified on Etherscan/Sourcify with metadata published.
- Incident runbook and key rotation plan in place.

### PAYMENTS_CHECKLIST.md
- Quote TTL and currency lock defined.
- Confirmation policy per asset documented.
- Webhooks validated via HMAC on raw payload.
- Idempotency keys on fulfilment logic.
- Refund flow documented.
- AML/KYT provider integrated when required (FATF compliant).

## References
- ConsenSys, OpenZeppelin, Solidity security docs.
- Slither, Echidna, Medusa tooling (Trail of Bits).
- IPFS pinning, IPNS, Filecoin guidance.
- SIWE (EIP-4361), EIP-712, EIP-1271, WalletConnect.
- Coinbase/BitPay webhooks and confirmation docs.
- NFT standards and metadata references.
