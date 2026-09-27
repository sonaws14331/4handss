# BIMZI · BIMZI

An original exchange-inspired website, installable mobile web app, protected admin backend and fixed-supply BSC token contract. BIMZI is independent of KuCoin and does not use its identity or assets.

**Current status:** pre-launch software. Market prices, charts, volumes and swaps are labeled simulations. No token is deployed by installing or running this app. No deposit, custodial exchange, staking pool, real order execution or guaranteed return is provided.

## Run locally

Requires Node.js 24+ and npm. Node's built-in SQLite stores project settings and sessions.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000`. Use `/#admin` for the admin area. Create an account in a separate terminal:

```bash
npm run admin:create
```

Enter a username. A random password is displayed once in your terminal. Save it privately. There is no public default password. Passwords are stored with salted scrypt; session tokens are hashed in SQLite. Accounts and settings live in `data/platform.sqlite`, excluded from Git.

To rotate a password, use `RESET_ADMIN=yes npm run admin:create` with the existing username. This revokes its sessions. Alternatively set `ADMIN_USERNAME` and `ADMIN_PASSWORD` privately for noninteractive provisioning. Passwords must be 14–256 characters. Do not put secrets in source files, shell history or public build variables.

## Production server

```bash
npm ci
npm run build
APP_ORIGIN=https://your-public-host.example npm start
```

Set `PORT` if needed (default 3000), and `DATA_DIR` to a persistent writable directory. `APP_ORIGIN` must match the browser's HTTPS origin exactly, without a trailing slash. Run behind one trusted TLS reverse proxy. The Node port must not be publicly reachable around that proxy. Production sessions use Secure, HttpOnly, SameSite=Strict, host-only cookies. `/api/health` is the readiness route.

On first startup, if no admin exists, the server can provision `ADMIN_USERNAME` with `ADMIN_PASSWORD` from private hosting environment variables. It does not reset an existing password. Use the CLI to rotate it. The app has one administrator role; administrator credentials do not grant control of user wallets or the contract owner wallet.

## Free hosting

`render.yaml` supplies a Render Free web-service blueprint. Connect your own Render/GitHub accounts, create a Blueprint from this branch and set `APP_ORIGIN` to the assigned HTTPS URL. Redeploy after setting it. Render generates a private `ADMIN_PASSWORD` environment variable and uses `admin` as the username; find that password in your service's private Environment page.

**Free-host limitation:** Render Free has an ephemeral filesystem and can spin down; SQLite settings and sessions are lost on redeploy or instance replacement. First-start credentials are restored from environment variables, but project settings must be re-entered. For durable administration, use a persistent disk on a suitable plan or migrate storage to a managed database. See [Render Free documentation](https://render.com/docs/free). A permanent deployment requires access to the hosting account; a sandbox preview is not permanent hosting.

The inactive `deployment/github-pages.yml` template can publish the public website to GitHub Pages. A repository owner with workflow-write permission must copy it to `.github/workflows/pages.yml` on the default branch, enable Pages with GitHub Actions, and run the workflow manually. The current repository connection cannot publish executable workflows. That deployment is static: **admin APIs are unavailable**, while browsing, documentation, favorites and the swap simulator work. GitHub Pages cannot run this Node admin backend. Review the workflow before enabling it on an existing website.

## Mobile app

BIMZI includes a manifest, 192/512px icons, offline app-shell caching and responsive layouts. On an HTTPS deployment use Chrome's Install app option, or Safari → Share → Add to Home Screen. This is a progressive web app, not an APK, IPA or store-published native app. A first online visit is required for offline assets; wallet and admin functions always require online services.

## BSC contract

`contracts/BIMZI.sol` uses OpenZeppelin 5.6.1:

- Name **BIMZI**, symbol **BIMZI**, 18 decimals.
- Fixed **1,000,000,000 BIMZI**, minted once to the chosen treasury/owner.
- No additional minting, transfer tax, holder confiscation or blacklist.
- The owner can pause/unpause **all transfers** and propose a new owner; the new owner must accept.
- Ownership can be renounced only when unpaused, preventing permanent freezing through renunciation.
- These owner powers are disclosed in the app. Website settings do not call owner functions.

The 1-billion supply is provisional until the project owner confirms it. Change the contract and site disclosures together before deploying if another supply is required. The deployment script will not pick an owner address for you.

```bash
npm run contract:compile
npm test
```

For deployment, set these privately in the process environment: `BSC_RPC_URL`, `DEPLOYER_PRIVATE_KEY`, `TOKEN_OWNER_ADDRESS`. Use a dedicated funded deployer wallet. Never paste a seed phrase into the website. The script accepts chain 97 (BSC testnet) or 56 (mainnet), verifies the chain, compiles, deploys and records the public receipt under ignored `artifacts/`.

```bash
npm run contract:deploy
```

Mainnet additionally requires `CONFIRM_MAINNET=BIMZI-1B`. Actual deployment incurs network fees. First test on BSC testnet, review the treasury address, verify source on BscScan and obtain an independent contract review. Local tests and an automated code review are not a smart-contract audit. There is no live deployment transaction or contract address included in this repository.

After deployment, publish the verified address and owner in the admin panel. Token controls can be used by connecting the actual owner wallet to a verified contract interface (e.g. BscScan's Write Contract). Contract ownership is not transferred by changing website metadata. To make the token tradable, a separate owner-approved liquidity transaction and funding are required. This project does not promise financial profit or a KuCoin listing.

## Verification

```bash
npm test                 # API auth/CSRF/persistence plus local-EVM token invariants
npm run build           # production frontend bundle
npm run contract:compile
```

Node may print an experimental SQLite warning. Hardhat runs contract tests in an isolated local EVM. Tests do not contact a live blockchain or spend funds.

## BIMZI rebrand

BIMZI (pronounced **bim-zee**) uses the ticker **BIMZI**, a violet-and-mint identity and a smiling coin mascot. The website, installable app, admin interface and undeployed token contract share this identity.

On September 27, 2026, the public [CoinGecko search API](https://api.coingecko.com/api/v3/search?query=BIMZI) returned no coins and the [DexScreener search API](https://api.dexscreener.com/latest/dex/search?q=BIMZI) returned no pairs for BIMZI. This is a limited name check, not a guarantee of worldwide availability, trademark clearance or future listing approval. No CoinMarketCap or exchange-listing approval is claimed.

### Updating an existing installation

Keep the existing `DATA_DIR`: older installations continue using their existing `amber.sqlite` database, including admin accounts and settings, when `platform.sqlite` is absent. An existing `platform.sqlite` takes precedence; fresh installations use that filename. Do not move or delete SQLite files while the server is running. Cookies have a new name, so administrators must sign in again with their existing password. Existing browser favorites are carried forward; the old token favorite becomes BIMZI. The new service worker clears older app-shell caches for this app's path after activation. Close and reopen installed app windows to activate an available update.

Custom announcements, community URLs and contract addresses are retained. Legacy addresses are hidden from public token details until an administrator verifies the deployed name and symbol on the selected network, selects the BIMZI contract identity and saves. Editing an address or network clears the form’s confirmation. This is an administrator assertion, not automated on-chain verification. Review these settings when changing the public brand. If you independently deployed an older token, this source update does not rename its on-chain identity: deploy and verify the new contract separately, then publish the correct address. No live token has been deployed by this project.
