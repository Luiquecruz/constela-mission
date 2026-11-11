# OpenGitOps Principles and Pull-Based Reconciliation

GitOps is a cloud-native operational framework that uses Git repositories as the single source of truth for infrastructure and application configuration. Unlike traditional push-based deployment models where external CI pipelines execute commands against target clusters, GitOps relies on automated software agents running inside runtime environments to continuously pull and reconcile the declared state stored in Git.

You need: Validating OIDC Policies and SLSA Attestations

## Case study

Weaveworks coined the term GitOps after running its own platform by changing Git and letting an agent in the cluster apply the changes. Its Flux controller later became a graduated project of the Cloud Native Computing Foundation. The idea is simple: Git holds the desired state, a controller pulls it and corrects any drift. The pipeline no longer needs credentials to the cluster, and a change made by hand is reverted.

## The Four Core OpenGitOps Principles

The OpenGitOps specification (CNCF TAG App Delivery) defines four foundational principles governing GitOps-compliant deployment systems:

1. **Declarative State**: The target system must be expressed declaratively in version-controlled manifests (e.g., Kubernetes YAML, Helm charts, Kustomize overlays).
2. **Versioned and Immutable**: Desired state is stored in a version control system (Git) with complete revision history, immutability, and audit trails.
3. **Pulled Automatically**: Software agents running inside the target environment continuously fetch declared state updates from Git without requiring external administrative access.
4. **Continuously Reconciled**: Software agents continuously compare the declared state in Git with the actual live state in the cluster, automatically applying changes to eliminate drift.

Flux describes the same thing with a `Kustomization` that points at a path of a Git source and reconciles it on an interval:

```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1
kind: Kustomization
metadata:
  name: api-service
  namespace: flux-system
spec:
  interval: 5m
  path: ./overlays/production
  prune: true
  sourceRef:
    kind: GitRepository
    name: deploy-config
```

## Push-Based versus Pull-Based Reconcilers

Traditional CI/CD pipelines use a **Push-Based** deployment model, where the CI runner holds cluster administrative credentials and pushes updates over the network via CLI commands (e.g., `kubectl apply`).

Push-based deployment introduces operational and security vulnerabilities:
- **Broad Attack Surface**: CI runners must store long-lived cluster credentials, creating single-point-of-failure targets for credential exfiltration (OWASP CICD-SEC-6).
- **Network Ingress Insecurity**: Production Kubernetes control planes must open external network ports to receive push commands from external CI runners.

In a **Pull-Based** GitOps architecture (using tools such as Argo CD or Flux):
- An agent operates entirely inside the cluster private network.
- The agent polls or listens for Git webhooks, pulls updated manifests, and applies changes locally.
- Ingress network ports remain completely closed, and CI build runners require zero production cluster credentials.

The controller is installed once per cluster and then follows the repository. Flux bootstraps itself into any Kubernetes cluster, whether it runs on Amazon EKS, Azure AKS or Google GKE, and commits its own configuration to the repository it will follow:

```bash
flux bootstrap github \
  --owner=org \
  --repository=deploy-config \
  --path=clusters/production
```

::: github
The pipeline's part is to change the repository, not the cluster. In GitHub Actions, the job that promotes a release only needs permission to open a pull request in the configuration repository:

```yaml
jobs:
  promote:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v7
        with:
          repository: org/deploy-config
      - run: gh pr create --title "Promote api-service" --body "Pins the verified digest."
        env:
          GH_TOKEN: ${{ github.token }}
```
:::

::: azure
The clouds package these controllers instead of replacing them. On Azure, Kubernetes clusters can enable GitOps with Flux through the CLI:

```bash
az k8s-configuration flux create \
  --resource-group apps --cluster-name aks-prod --cluster-type managedClusters \
  --name api-service --namespace flux-system \
  --url https://git.example.com/org/deploy-config --branch main \
  --kustomization name=production path=./overlays/production prune=true
```
:::

::: aws
Before the bootstrap, the command line needs credentials for the cluster. On Amazon EKS:

```bash
aws eks update-kubeconfig --name CLUSTER_NAME --region REGION
```
:::

::: gcp
On Google GKE:

```bash
gcloud container clusters get-credentials CLUSTER_NAME --location LOCATION
```
:::

## Drift Detection and Automatic Remediation

Drift occurs when manual changes, operator interventions, or emergency hotfixes cause the actual live cluster state to diverge from the declared manifest state in Git.

A GitOps reconciler handles configuration drift through automated loops:
- **Drift Detection**: Periodically comparing live Kubernetes resource specifications against Git commit HEAD.
- **Automated Self-Healing**: If drift is detected (e.g., a manual change modified a replica count or environment variable in production), the controller automatically re-applies the declared Git manifest, overwriting manual cluster edits.

This self-healing loop guarantees that manual, un-audited changes cannot persist in production runtimes.

Argo CD and Flux are the two widely used controllers, and they run on any Kubernetes cluster, in every cloud. Both express the policy of the challenge in a few fields. In Argo CD, `automated` turns on auto sync, `prune` allows deleting resources that Git no longer lists, and `selfHeal` reverts changes made directly in the cluster:

```yaml
syncPolicy:
  automated:
    prune: true
    selfHeal: true
```

::: github
A controller in the cluster does the detection, so the pipeline never needs cluster credentials. The pipeline's part is to change the repository, in GitHub Actions with a pull request to the configuration repository.
:::

::: azure
On Azure Kubernetes Service, the Flux extension runs the controller and reports the state of each configuration:

```bash
az k8s-configuration flux show --name apps --cluster-name CLUSTER --resource-group GROUP --cluster-type managedClusters
```
:::

::: aws
On Amazon EKS, Flux or Argo CD run as in any cluster, and the CLI of the controller shows the difference:

```bash
flux get kustomizations
```
:::

::: gcp
On Google Kubernetes Engine, Config Sync reports the sync status of the cluster:

```bash
gcloud container fleet config-management status
```
:::

## Across the platforms

Google Kubernetes Engine offers Config Sync, and Amazon EKS runs Argo CD or Flux like any other cluster. In every one the model is pull-based: an agent inside the cluster fetches the desired state and applies it, so the pipeline does not need cluster credentials and a change made by hand is noticed and either reverted or reported on the next loop.

Turning on `prune` and `selfHeal` is a decision with consequences: it makes Git the only way to change the cluster, which is the point of GitOps, and it deletes things that were created outside Git. Teams usually start with reporting only and turn them on once the repository holds everything the cluster needs.

The `flux bootstrap github` command shown above then runs unchanged against any of these clusters.

## Common mistakes

- **Mixing push and pull mechanisms**: Allowing CI pipelines to run imperative `kubectl` commands while a GitOps controller is active creates race conditions.
- **Using GitOps for raw source code compilation**: Attempting to run unit tests or compile application source code inside GitOps controllers instead of dedicated CI build runners.
- **Storing secret credentials in plaintext inside Git**: Committing unencrypted database passwords into Git repositories violates secret management rules.

## In practice

Try it in a repository of your own.

1. Install a GitOps controller in a test cluster and point it at a repository.
2. Change an image version in the repository and watch the cluster follow.
3. Change a replica count by hand in the cluster and watch the controller revert it.

The challenge is the reconciliation that detects that difference and corrects it.

## Check yourself

1. What are the four core principles of the OpenGitOps specification?
2. Why is a pull-based GitOps architecture more secure than a push-based CI deployment model?
3. How does a GitOps reconciler detect and remediate infrastructure drift?
