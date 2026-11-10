using Dojo;

public static class DoraTests
{
    private const long Start = 1_700_000_000_000;
    private const long Minute = 60_000;

    private static DeploymentRecord Deployment(string id, string status, double leadTime) => new(id, Start, status, leadTime);

    private static IncidentRecord Incident(string id, long? minutes) => new(id, "d", Start, minutes is null ? null : Start + minutes.Value * Minute);

    private static DoraMetrics Metrics(double frequency = 2, double failureRate = 3, double leadTime = 30, double restoreTime = 20) => new(frequency, failureRate, leadTime, restoreTime);

    [Test("computes frequency, failure rate and lead time over the window")]
    public static void ComputesOverWindow()
    {
        var deployments = new[] { Deployment("a", "SUCCESS", 60), Deployment("b", "FAILURE", 120), Deployment("c", "SUCCESS", 30), Deployment("d", "SUCCESS", 90) };
        Assert.Equal(new DoraMetrics(2, 25, 75, 0), DoraCalculator.CalculateDoraMetrics(deployments, [], 2));
    }

    // beginner mistake: counting an incident that is still open as if it had been restored instantly
    [Test("averages the restore time of resolved incidents only")]
    public static void IgnoresOpenIncidents()
    {
        var deployments = new[] { Deployment("a", "SUCCESS", 10) };
        Assert.Equal(60, DoraCalculator.CalculateDoraMetrics(deployments, [Incident("i1", 30), Incident("i2", 90), Incident("i3", null)], 1).MeanTimeToRestoreMinutes);
        Assert.Equal(0, DoraCalculator.CalculateDoraMetrics(deployments, [Incident("i3", null)], 1).MeanTimeToRestoreMinutes);
    }

    [Test("rounds to two decimals, returns zeros without deployments and rejects a window that is not positive")]
    public static void RoundsAndValidates()
    {
        var deployments = new[] { Deployment("a", "FAILURE", 10), Deployment("b", "SUCCESS", 10), Deployment("c", "SUCCESS", 11) };
        var result = DoraCalculator.CalculateDoraMetrics(deployments, [], 7);
        Assert.Equal(0.43, result.DeploymentFrequencyPerDay);
        Assert.Equal(33.33, result.ChangeFailureRatePercent);
        Assert.Equal(10.33, result.MeanLeadTimeMinutes);
        Assert.Equal(new DoraMetrics(0, 0, 0, 0), DoraCalculator.CalculateDoraMetrics([], [], 7));
        var error = Assert.Throws<ArgumentException>(() => DoraCalculator.CalculateDoraMetrics(deployments, [], 0));
        Assert.Contains("Window must be positive", error.Message);
    }

    [Test("classifies a team at the elite limits as elite and just outside them as high")]
    public static void ClassifiesElite()
    {
        Assert.Equal("ELITE", DoraCalculator.ClassifyPerformance(Metrics(frequency: 1, failureRate: 5, leadTime: 60, restoreTime: 60)));
        Assert.Equal("HIGH", DoraCalculator.ClassifyPerformance(Metrics(leadTime: 61)));
        Assert.Equal("HIGH", DoraCalculator.ClassifyPerformance(Metrics(frequency: 0.5)));
    }

    [Test("lets the weakest of the four measures decide the tier")]
    public static void WeakestMeasureDecides()
    {
        Assert.Equal("LOW", DoraCalculator.ClassifyPerformance(Metrics(failureRate: 40)));
        Assert.Equal("MEDIUM", DoraCalculator.ClassifyPerformance(Metrics(restoreTime: 5000)));
        Assert.Equal("LOW", DoraCalculator.ClassifyPerformance(Metrics(frequency: 0.01)));
    }

    [Test("turns a service level objective into an error budget that gates releases")]
    public static void ComputesErrorBudget()
    {
        Assert.Equal(new ErrorBudget(100, 60, true), DoraCalculator.CalculateErrorBudget(99.9, 100000, 40));
        Assert.Equal(new ErrorBudget(100, 0, false), DoraCalculator.CalculateErrorBudget(99.9, 100000, 100));
        Assert.Equal(new ErrorBudget(100, -50, false), DoraCalculator.CalculateErrorBudget(99.9, 100000, 150));
    }
}
