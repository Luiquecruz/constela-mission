def reconcile(desired: list, live: list, options: dict) -> dict:
    live_by_id = {resource["id"]: resource for resource in live}
    desired_ids = {resource["id"] for resource in desired}

    to_create = [resource["id"] for resource in desired if resource["id"] not in live_by_id]
    to_update = [resource["id"] for resource in desired if resource["id"] in live_by_id and resource["spec"] != live_by_id[resource["id"]]["spec"]]
    extra = [resource["id"] for resource in live if resource["id"] not in desired_ids]
    to_delete = extra if options["prune"] else []
    orphaned = [] if options["prune"] else extra

    in_sync = len(to_create) + len(to_update) + len(extra) == 0
    applied = options["autoSync"] and len(to_create) + len(to_update) + len(to_delete) > 0
    return {"inSync": in_sync, "toCreate": to_create, "toUpdate": to_update, "toDelete": to_delete, "orphaned": orphaned, "applied": applied}
