Infrastructure Decoupling

Identity and Access Management
Administrative Alias: Provision a dedicated alias within Google Workspace (e.g., admin@freedomaviationco.com).

Asset Transfer: Transfer ownership of Vercel, Supabase, Stripe, Resend, Namecheap, and GitHub to this alias.

Security Protocol: Implement a corporate password manager. Configure Two Factor Authentication using the password manager. Remove personal phone numbers and biometric passkeys from all infrastructure security profiles.

Domain and Network Architecture
Registrar: Maintain domain registration with Namecheap.

DNS Migration: Migrate DNS management to Cloudflare.

Proxy Configuration: Route all web traffic through Cloudflare to Vercel to activate Web Application Firewall and DDoS mitigation.

Record Replication: Replicate all required TXT, CNAME, and MX records for Google Workspace and Resend within the Cloudflare dashboard.

Environment Segregation
Database Isolation: Establish distinct Supabase projects for production data and development testing.

Deployment Pipeline: Configure Vercel to execute preview deployments for feature branches. Restrict production builds exclusively to the main branch.

Payment Processing: Isolate Stripe API keys. Store test keys in Vercel preview environments and live keys strictly in the production environment variables.

Financial Administration
Centralized Billing: Link the Mercury corporate card to all vendor billing portals.

Data Purge: Remove personal credit card data from all corporate vendor accounts.

Alert Routing: Configure automated billing alerts to route directly to the administrative alias to prevent service disruption from expired payment methods.

Version Control and Intellectual Property
Repository Migration: Establish a GitHub Organization for the corporate entity. Transfer the application repository from the personal account to the organization.

Branch Protection: Enforce rules on the main branch requiring pull request reviews for all code merges.

Local Git Configuration: Configure local Git environments to use the corporate email alias for all commits within the corporate directory. Keep personal project directories strictly bound to personal credentials to prevent intellectual property commingling.

Partner Interface Management
Interface Architecture
Access Restriction: Strip all database configuration, user management, API key access, and technical settings from the partner dashboard.

Scope Limitation: Restrict UI elements strictly to operational workflows required for line service and flight instruction.

Operational Controls
Action Targets: Implement large target area buttons for primary state changes including Plane Fueled, Staging Complete, and Squawk Resolved.

Automation: Automate state transitions upon button interaction to eliminate manual data entry requirements for line staff.

Data Integrity Protocols
Delete Restriction: Disable hard delete capabilities on all operational database rows via Supabase Row Level Security and frontend UI removal.

Archive Implementation: Implement boolean archive toggles to remove resolved items from the active view while preserving the underlying database record.

Immutability: Restrict historical logs, past maintenance records, and completed daily schedules to read only views. Eliminate edit access for past entries to maintain an immutable audit trail.