using System.Text.RegularExpressions;

public record RegistrationResult(bool Registered, string Digest);

public class ArtifactRegistry
{
    private static readonly Regex DigestPattern = new("\\Asha256:[a-f0-9]{64}\\z", RegexOptions.IgnoreCase);

    private readonly Dictionary<string, List<(string Version, string Digest)>> _artifacts = new();

    public RegistrationResult Register(string name, string version, string digest)
    {
        if (!DigestPattern.IsMatch(digest))
        {
            throw new ArgumentException("Invalid SHA256 digest format");
        }
        var normalized = digest.ToLowerInvariant();
        if (!_artifacts.TryGetValue(name, out var versions))
        {
            versions = [];
            _artifacts[name] = versions;
        }

        var index = versions.FindIndex(entry => entry.Version == version);
        if (index < 0)
        {
            versions.Add((version, normalized));
            return new RegistrationResult(true, normalized);
        }
        if (versions[index].Digest != normalized)
        {
            throw new InvalidOperationException($"Artifact {name}:{version} is immutable");
        }
        return new RegistrationResult(false, normalized);
    }

    public string Resolve(string name, string version)
    {
        if (_artifacts.TryGetValue(name, out var versions))
        {
            foreach (var entry in versions)
            {
                if (entry.Version == version)
                {
                    return entry.Digest;
                }
            }
        }
        throw new InvalidOperationException($"Artifact {name}:{version} not found");
    }

    public string[] ListVersions(string name) =>
        _artifacts.TryGetValue(name, out var versions) ? versions.Select(entry => entry.Version).ToArray() : [];
}
