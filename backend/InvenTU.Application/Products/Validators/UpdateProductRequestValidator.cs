using FluentValidation;
using InvenTU.Core.DTOs.Products;

namespace InvenTU.Application.Products.Validators;

public sealed class UpdateProductRequestValidator : AbstractValidator<UpdateProductRequest>
{
    public UpdateProductRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required.")
            .MaximumLength(200).WithMessage("Name must not exceed 200 characters.");

        RuleFor(x => x.CategoryId)
            .NotEqual(Guid.Empty).WithMessage("A valid CategoryId is required.");

        RuleFor(x => x.UnitPrice)
            .GreaterThan(0).WithMessage("UnitPrice must be greater than 0.");

        RuleFor(x => x.CostPrice)
            .GreaterThanOrEqualTo(0).WithMessage("CostPrice must be greater than or equal to 0.");

        RuleFor(x => x.UnitOfMeasure)
            .NotEmpty().WithMessage("UnitOfMeasure is required.")
            .MaximumLength(20).WithMessage("UnitOfMeasure must not exceed 20 characters.");

        RuleFor(x => x.MinStockLevel)
            .GreaterThanOrEqualTo(0).WithMessage("MinStockLevel must be 0 or greater.")
            .When(x => x.MaxStockLevel.HasValue);

        RuleFor(x => x.MaxStockLevel)
            .GreaterThanOrEqualTo(0).WithMessage("MaxStockLevel must be 0 or greater.")
            .GreaterThanOrEqualTo(x => x.MinStockLevel).WithMessage("MaxStockLevel must be greater than or equal to MinStockLevel.").When(x => x.MaxStockLevel.HasValue);

        RuleFor(x => x.ReorderPoint)
            .GreaterThanOrEqualTo(0).WithMessage("ReorderPoint must be 0 or greater.")
            .GreaterThanOrEqualTo(x => x.MinStockLevel).WithMessage("ReorderPoint must be greater than or equal to MinStockLevel.");
    }
}
