import re

SLSA_PROVENANCE = "https://slsa.dev/provenance/v1"


def expected_audience(target: str) -> str:
    # TODO: return the audience each cloud expects and raise ValueError for any other target.
    return "sts.amazonaws.com"


def authorize_deployment(request: dict, policy: dict, now: int) -> dict:
    # TODO: check issuer, audience, expiration and subject (wildcards on AWS, exact match on Azure).
    # TODO: check the predicate type, the artifact digest and the builder, collecting every failed reason in order.
    return {"allowed": True, "reasons": []}
