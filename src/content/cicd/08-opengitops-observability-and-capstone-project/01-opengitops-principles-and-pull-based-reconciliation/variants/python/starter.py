def reconcile(desired: list, live: list, options: dict) -> dict:
    # TODO: compare the desired and live resources by id: missing ones are created, ones with a different spec are updated.
    # TODO: live resources that Git does not list are deleted when prune is on and reported as orphaned when it is off.
    # TODO: the state is in sync only when there is nothing to create, update, delete or report; changes are applied only with autoSync.
    return {"inSync": True, "toCreate": [], "toUpdate": [], "toDelete": [], "orphaned": [], "applied": False}
