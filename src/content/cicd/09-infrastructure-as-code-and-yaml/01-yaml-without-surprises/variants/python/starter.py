import re


def lint_yaml(text: str) -> list:
    issues = []
    # TODO: skip blank lines and comment lines; flag tab indentation, then indentation that is not a multiple of 2.
    # TODO: flag a key that appears twice in the same mapping; every list item starts a new mapping.
    # TODO: flag unquoted yes/no/on/off/y/n values and unquoted two-part numbers under a key that ends in "version".
    return issues
