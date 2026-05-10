using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.Options;

public sealed class StockMonitoringOptions
{
    public double Interval { get; set; } = 15;
    public int ProductBatchSize { get; set; } = 1000;
}
