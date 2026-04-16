namespace InvenTU.Core.Exceptions;

public sealed class CategoryNotFoundException : NotFoundException
{
    public CategoryNotFoundException()
        : base("CATEGORY_NOT_FOUND", "Category not found.")
    {
    }

    public CategoryNotFoundException(Guid id)
        : base("CATEGORY_NOT_FOUND", $"Category with id '{id}' was not found.")
    {
    }
}
