using FluentValidation;
using InvenTU.Core.DTOs.StockLocations;

namespace InvenTU.Application.StockLocations.Validators;

public sealed class CreateStockLocationRequestValidator : AbstractValidator<CreateStockLocationRequest>
{
    public CreateStockLocationRequestValidator()
    {
        RuleFor(x => x.Zone)
            .NotEmpty().WithMessage("Zone is required.")
            .MaximumLength(50).WithMessage("Zone must not exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").WithMessage("Zone must contain only alphanumeric characters, hyphens, or underscores.");

        RuleFor(x => x.Aisle)
            .MaximumLength(50).WithMessage("Aisle must not exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").WithMessage("Aisle must contain only alphanumeric characters, hyphens, or underscores.")
            .When(x => x.Aisle is not null);

        RuleFor(x => x.Shelf)
            .MaximumLength(50).WithMessage("Shelf must not exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").WithMessage("Shelf must contain only alphanumeric characters, hyphens, or underscores.")
            .When(x => x.Shelf is not null);

        RuleFor(x => x.Bin)
            .MaximumLength(50).WithMessage("Bin must not exceed 50 characters.")
            .Matches(@"^[A-Za-z0-9\-_]+$").WithMessage("Bin must contain only alphanumeric characters, hyphens, or underscores.")
            .When(x => x.Bin is not null);

        RuleFor(x => x.MaxCapacity)
            .GreaterThan(0).WithMessage("MaxCapacity must be greater than 0.");
    }
}
