using System;
using System.Collections.Generic;
using System.Text;

namespace InvenTU.Core.Exceptions;

public sealed class CategoryHasProductsException : ConflictException
{
    public CategoryHasProductsException() : base("CATEGORY_HAS_PRODUCTS", "Category can't be deleted because it includes active products")
    { }
}
