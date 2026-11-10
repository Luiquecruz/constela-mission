def _to_list(value):
    if value is None:
        return []
    return list(value) if isinstance(value, list) else [value]


def _commands(steps, key):
    return [step[key] for step in (steps or []) if key in step]


def _from_github(definition):
    return [
        {"id": job_id, "dependencies": _to_list(job.get("needs")), "commands": _commands(job.get("steps"), "run")}
        for job_id, job in definition["jobs"].items()
    ]


def _from_azure(definition):
    return [
        {"id": job["job"], "dependencies": _to_list(job.get("dependsOn")), "commands": _commands(job.get("steps"), "script")}
        for job in definition["jobs"]
    ]


def _from_gcp(definition):
    steps = definition["steps"]
    ids = [step.get("id", f"step-{index + 1}") for index, step in enumerate(steps)]
    tasks = []
    for index, step in enumerate(steps):
        wait_for = step.get("waitFor")
        if wait_for is None:
            dependencies = ids[:index]
        elif "-" in wait_for:
            dependencies = []
        else:
            dependencies = list(wait_for)
        command = " ".join([step.get("entrypoint", step["name"]), *step.get("args", [])])
        tasks.append({"id": ids[index], "dependencies": dependencies, "commands": [command]})
    return tasks


def _from_aws(definition):
    present = [phase for phase in ("install", "pre_build", "build", "post_build") if phase in definition["phases"]]
    return [
        {"id": phase, "dependencies": [] if index == 0 else [present[index - 1]], "commands": list(definition["phases"][phase].get("commands", []))}
        for index, phase in enumerate(present)
    ]


READERS = {"github": _from_github, "azure": _from_azure, "gcp": _from_gcp, "aws": _from_aws}


def normalize_pipeline(provider: str, definition: dict) -> list:
    if provider not in READERS:
        raise ValueError(f"Unsupported provider: {provider}")
    tasks = READERS[provider](definition)
    ids = {task["id"] for task in tasks}
    for task in tasks:
        for dependency in task["dependencies"]:
            if dependency not in ids:
                raise ValueError(f"Dependency {dependency} is missing from pipeline jobs")
    return tasks
