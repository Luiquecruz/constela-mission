# Planning Infrastructure Changes

Servers, networks and storage used to be created by clicking in a console, and nobody could say afterwards what exactly existed or why. Infrastructure as code replaces the clicks with files in Git: the files say what should exist, a tool compares them with what does exist and applies the difference. This lesson explains that calculation, the plan, because every IaC tool and every pipeline that runs one is built on it.

You need: YAML Without Surprises

## Case study

Atlantis was created at Hootsuite so that a Terraform plan runs automatically when someone opens a pull request, and the plan is posted as a comment for everyone to read before the change is applied. The team stopped running infrastructure changes from laptops, and reviewers saw what would change instead of imagining it. Planning in the pipeline is the practice behind this lesson: the plan is the artifact that gets reviewed.

## Desired State, Current State and the Plan

Infrastructure as code is **declarative**: you describe the end result, not the steps. The tool keeps a record of what it manages, the **state**, and on every run it compares three things: the desired state in the files, the state it recorded and the real resources in the cloud. The result of the comparison is a **plan**, a list of changes that you can read before anything happens. Applying the plan makes the real infrastructure match the files, and running it again changes nothing, which is what idempotent means.

A plan has a small vocabulary. A resource that is not yet known is **created**; one whose properties differ is **updated** in place; one that is no longer in the files is **deleted**. Some properties cannot be edited on a living resource, such as the name of a storage bucket or the zone of a virtual machine. Changing one forces a **replacement**: create the new resource and delete the old one, with everything that lives inside it. A plan that shows a replacement is a plan to read carefully.

## Dependencies and Order

Resources depend on each other: a subnet needs its network, a virtual machine needs its subnet. The tool builds a graph from references between resources and uses it to order the work. Creation follows the edges, so the network comes first; deletion walks them backwards, so the virtual machine goes before the subnet and the subnet before the network. A reference to a resource that does not exist, or two resources that depend on each other, is an error found before any change.

## Reading a Plan

Every tool can show the plan without applying it. Terraform prints a plan and can write it as JSON, CloudFormation produces a change set, and Azure shows the change types create, modify and delete:

```bash
terraform plan -out=tfplan
aws cloudformation deploy --stack-name artifacts --template-file template.yaml --no-execute-changeset
az deployment group what-if --resource-group apps --template-file main.bicep
```

The first thing to look for is what is destroyed or replaced, because those changes remove data. The second is what is surprising: a change you did not make usually means the real infrastructure drifted from the state, that someone edited it by hand.

::: github
A plan runs in any pipeline that can run the tool. In GitHub Actions:

```yaml
jobs:
  plan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: hashicorp/setup-terraform@v4
      - run: terraform init -input=false
      - run: terraform plan -input=false
```
:::

::: azure
Each cloud also has its own template language. Azure uses Bicep, which compiles to ARM templates:

```bicep
resource artifacts 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: 'acmeapiartifacts'
  location: resourceGroup().location
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
}
```
:::

::: aws
Terraform and OpenTofu describe resources in HCL and work with all three clouds through providers. A storage location in each cloud:

```hcl
resource "aws_s3_bucket" "artifacts" {
  bucket = "acme-api-artifacts"
  tags = {
    Owner = "platform"
  }
}

resource "azurerm_storage_account" "artifacts" {
  name                     = "acmeapiartifacts"
  resource_group_name      = azurerm_resource_group.apps.name
  location                 = azurerm_resource_group.apps.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "google_storage_bucket" "artifacts" {
  name                        = "acme-api-artifacts"
  location                    = "EU"
  uniform_bucket_level_access = true
}
```

AWS uses CloudFormation, written in YAML, so everything in the previous lesson applies to it:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Resources:
  Artifacts:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: acme-api-artifacts
      VersioningConfiguration:
        Status: Enabled
```
:::

::: gcp
In Google Cloud Build, a step uses the Terraform image:

```yaml
steps:
  - id: init
    name: hashicorp/terraform
    args: [init, -input=false]
  - id: plan
    name: hashicorp/terraform
    args: [plan, -input=false]
```
:::

## State and Drift

The state is the tool's memory, and it is as important as the code. It maps each resource in the files to the real resource, so it must be stored remotely, where a pipeline and a team can share it, and locked while one run uses it, so that two runs do not apply at once. It can also contain secrets, so it needs the same protection as one. **Drift** is any difference between the state and reality; a plan reveals it, and an apply removes it by bringing the real resource back to what the files say.

::: github
GitHub does not store the state. The workflow runs Terraform against a backend of one of the clouds below, and the job needs access to it.
:::

::: azure
On Azure, the state lives in a blob of a storage account:

```hcl
terraform {
  backend "azurerm" {
    resource_group_name  = "tfstate"
    storage_account_name = "tfstateaccount"
    container_name       = "tfstate"
    key                  = "api.tfstate"
  }
}
```
:::

::: aws
On AWS, the state lives in an S3 bucket:

```hcl
terraform {
  backend "s3" {
    bucket = "tfstate-bucket"
    key    = "api/terraform.tfstate"
    region = "us-east-1"
  }
}
```
:::

::: gcp
On Google Cloud, the state lives in a Cloud Storage bucket:

```hcl
terraform {
  backend "gcs" {
    bucket = "tfstate-bucket"
    prefix = "api"
  }
}
```
:::

## Across the platforms

In the Terraform providers for AWS and Azure, the name of the bucket or the storage account is documented as forcing a new resource, and Google Cloud states that you cannot change the name of an existing bucket: renaming it in the file is a replacement, not a rename. CloudFormation documents it for the bucket name: the property requires replacement, and a bucket with an explicit name cannot be replaced until you choose a new name, because two buckets cannot share one.

## Common mistakes

- **Reading only the summary of a plan**: a line saying one resource changes can hide a replacement that deletes a database; read the action of every resource.
- **Editing infrastructure by hand**: the change is not in Git, the next apply reverts it, and the team learns about it from an outage.
- **Keeping the state on one laptop**: another person or a pipeline will plan against a different record, and two applies can run at the same time.

## In practice

Try it in a repository of your own.

1. Describe a bucket or an equivalent resource in the syntax of your platform.
2. Run the plan and read what it says it will create.
3. Change the name of the resource and read the plan again, looking for a replacement.

The challenge computes the changes from the desired and the current state.

## Check yourself

1. What are the three things a tool compares to produce a plan?
2. Why does renaming a storage bucket in the files show up as a replacement?
3. In which order are resources created, and in which order are they deleted?
