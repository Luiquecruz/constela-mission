# Decoupling Deploy from Release with Feature Flags

Decoupling technical deployment from functional release is an essential continuous delivery architecture pattern. By separating code installation from feature activation, teams can safely push incomplete or upcoming features to production servers inside main branch commits without exposing unapproved features to end users.

You need: Progressive Delivery Strategies

## Case study

A trading firm deployed new software to its servers and missed one of eight. A flag that had once controlled an old, retired feature was reused for the new code, so on the server that still ran the old software the same flag woke the retired behavior. In under an hour the firm lost hundreds of millions of dollars and it did not survive as an independent company. Flags need an owner, a lifecycle and a clean-up, and a deployment must reach every server or none.

## Feature Flags and Toggles

Feature Flags (or Feature Toggles) are runtime decision points in source code that dynamically route execution paths based on evaluated flag configurations.

Feature flags enable powerful operational patterns:

- **Dark Launching**: Deploying new backend services or user interface components to production while keeping them dormant behind a disabled flag (`false`). This allows testing infrastructure performance under live production load before releasing to users.
- **Targeted Percentage Rollouts**: Enabling a feature flag for specific user segments (e.g., 5% of beta users or specific geographic regions) and gradually expanding access.
- **Emergency Kill Switches**: Instantaneously disabling a malfunctioning feature flag in production without executing a code redeployment or pipeline rollback.

OpenFeature is a vendor-neutral API for evaluating flags in code, so an application can change the service behind it without rewriting the places that use a flag. Whatever the service, the code that uses a flag should be small and temporary. Branch by abstraction keeps two implementations behind one interface until the old one can be deleted:

```typescript
interface PaymentGateway {
  charge(orderId: string, cents: number): Promise<void>;
}

const gateway: PaymentGateway = flags.isActive('checkout-v2', user) ? new NewGateway() : new LegacyGateway();
```

::: github
A kill switch should be one click away for the people on call. In GitHub Actions, a manually started workflow can run the command of the cloud in use and leave a record of who started it:

```yaml
on:
  workflow_dispatch:
    inputs:
      enabled:
        description: New value of the checkout flag
        required: true
        type: boolean

jobs:
  flag:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - run: echo "Flag checkout-v2 set to $ENABLED by $ACTOR"
        env:
          ENABLED: ${{ inputs.enabled }}
          ACTOR: ${{ github.actor }}
```
:::

::: azure
Azure App Configuration keeps feature flags next to settings, and the Microsoft.FeatureManagement libraries evaluate them, including a targeting filter that rolls a flag out to a percentage of users and groups. From the command line:

```bash
az appconfig feature set --name my-store --feature checkout-v2
az appconfig feature enable --name my-store --feature checkout-v2
```

The same `az appconfig feature` commands perform the change from an Azure Pipelines step.
:::

::: aws
A flag is configuration that the application reads at run time, so each cloud offers a managed place for it. AWS AppConfig stores feature flags as a configuration profile in which each flag has an `enabled` switch and typed attributes, such as a rollout percentage the application interprets:

```json
{
  "version": "1",
  "flags": {
    "checkout-v2": {
      "name": "checkout-v2",
      "attributes": {
        "rolloutPercent": { "constraints": { "type": "number", "minimum": 0, "maximum": 100 } }
      }
    }
  },
  "values": {
    "checkout-v2": { "enabled": true, "rolloutPercent": 20 }
  }
}
```

A flag change is a configuration deployment, so each cloud has a command for it. On AWS, AppConfig deploys a new version of the flag configuration with a deployment strategy that decides how fast it spreads:

```bash
aws appconfig start-deployment \
  --application-id APPLICATION_ID \
  --environment-id ENVIRONMENT_ID \
  --deployment-strategy-id STRATEGY_ID \
  --configuration-profile-id PROFILE_ID \
  --configuration-version 2
```
:::

::: gcp
On Google Cloud Run, a flag kept in an environment variable changes with a new revision of the service:

```bash
gcloud run services update api-service --update-env-vars FEATURE_CHECKOUT_V2=true
```
:::

## Branch by Abstraction

To avoid long-lived feature branches when refactoring core application systems, engineering teams utilize **Branch by Abstraction**:

1. **Create Abstraction Layer**: Introduce a clean interface or abstraction layer in front of the existing system component on `main`.
2. **Implement New System**: Build the new implementation alongside the old one on `main`, keeping it dormant behind a Feature Flag.
3. **Switch Execution Path**: Update the Feature Flag to route traffic to the new implementation.
4. **Remove Legacy Code**: Once the new implementation is validated, delete the old implementation and abstraction layer.

Branch by Abstraction enables large-scale refactoring while maintaining daily integration into the primary trunk.

## Technical Debt and Flag Lifecycle Management

While Feature Flags unlock release flexibility, unmanaged flags create severe technical debt and operational risk:

- **Flag Debt Accumulation**: Leaving obsolete or dead flags in source code inflates code complexity and creates testing matrix bloat.
- **Stale Flag Incidents**: Accidentally toggling an unmaintained legacy flag can trigger dormant bugs or security vulnerabilities.

High-performing teams enforce strict flag lifecycle management: classifying flags by lifetime (short-lived release flags vs long-lived operational toggles) and scheduling mandatory flag cleanup tasks after features reach 100% rollout.

## Across the platforms

Every flag needs an owner and a removal date in the team's tracker. A flag that outlives its rollout is debt: the old code path stays in the program, tested by nobody, until it breaks the day the flag is switched.

## Common mistakes

- **Using Feature Flags as permanent configuration replacements**: Storing static application configuration inside feature flags creates unmaintainable flag management sprawl.
- **Failing to clean up retired release flags**: Leaving completed release toggles in code increases technical debt and code complexity.
- **Not testing both flag states in CI**: Running unit test suites against only the enabled flag state leaves dormant flag code paths unvalidated.

## In practice

Try it in a repository of your own.

1. Put a new behavior behind a flag that is off by default and deploy it.
2. Turn the flag on for a small percentage of users and then for everyone, without another deploy.
3. Turn it off again and write down who owns the flag and when it will be removed.

The challenge decides, with a stable bucket for each user, who sees the flag.

## Check yourself

1. What is the fundamental operational benefit of separating technical deployment from functional release?
2. How does Branch by Abstraction prevent the need for long-lived feature branches during refactoring?
3. Why is mandatory flag cleanup essential for managing feature flag technical debt?
