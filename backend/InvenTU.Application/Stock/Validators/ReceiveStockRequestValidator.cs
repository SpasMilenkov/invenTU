using FluentValidation;
using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Application.Stock.Validators;

public sealed class ReceiveStockRequestValidator : AbstractValidator<ReceiveStockRequest>
{
    public ReceiveStockRequestValidator()
    {
        RuleFor(x => x.WarehouseId)
            .NotEmpty().WithMessage("Warehouse is required.");

        RuleFor(x => x.StockLocationId)
            .NotEmpty().WithMessage("Stock location is required.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Receipt quantity must be greater than 0.");

        RuleFor(x => x.ReferenceNumber)
            .MaximumLength(100).When(x => x.ReferenceNumber is not null)
            .WithMessage("Reference number must not exceed 100 characters.");
    }
}
