using FluentValidation;
using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Application.Stock.Validators;

public sealed class IssueStockRequestValidator : AbstractValidator<IssueStockRequest>
{
    public IssueStockRequestValidator()
    {
        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("Warehouse is required.");

        RuleFor(x => x.StockLocationId)
            .NotEmpty().WithMessage("Stock location is required.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Issue quantity must be greater than 0.");

        RuleFor(x => x.ReasonCode)
            .NotEmpty().WithMessage("Reason code is required.")
            .MaximumLength(100).WithMessage("Reason code must not exceed 100 characters.");

        RuleFor(x => x.Notes)
            .MaximumLength(500).When(x => x.Notes is not null)
            .WithMessage("Notes must not exceed 500 characters.");
    }
}
