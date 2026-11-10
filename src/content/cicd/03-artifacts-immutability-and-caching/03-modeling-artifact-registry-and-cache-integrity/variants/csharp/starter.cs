using System.Text.RegularExpressions;

public record RegistrationResult(bool Registered, string Digest);

public class ArtifactRegistry
{
    public RegistrationResult Register(string name, string version, string digest)
    {
        // TODO: reject a digest that is not "sha256:" followed by 64 hexadecimal characters (ArgumentException).
        // TODO: store the digest in lower case; accept the same digest again, refuse a different one for a published version.
        return new RegistrationResult(false, digest);
    }

    public string Resolve(string name, string version)
    {
        // TODO: return the digest of a published version or throw InvalidOperationException when it was never registered.
        return "";
    }

    public string[] ListVersions(string name)
    {
        // TODO: return the versions of an artifact in the order they were first registered.
        return [];
    }
}
