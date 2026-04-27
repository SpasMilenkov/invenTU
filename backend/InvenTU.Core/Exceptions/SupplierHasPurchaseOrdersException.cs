using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.Exceptions;

public sealed class SupplierHasPurchaseOrdersException : ConflictException
{
    public SupplierHasPurchaseOrdersException() : base("SUPPLIER_HAS_PURCHASE_ORDERS", "Supplier can't be deleted because it has active purchase orders")
    { }
}
