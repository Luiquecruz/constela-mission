def normalize_pipeline(provider: str, definition: dict) -> list:
    # TODO: reject a provider other than github, azure, gcp and aws (ValueError).
    # TODO: GitHub jobs use `needs` and `run` steps; Azure jobs use `dependsOn` and `script` steps.
    # TODO: Cloud Build steps wait for every earlier step unless `waitFor` says otherwise; CodeBuild phases run one after another.
    # TODO: raise ValueError when a task depends on an id that is not in the pipeline.
    return []
