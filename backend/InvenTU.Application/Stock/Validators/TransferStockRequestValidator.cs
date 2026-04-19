using FluentValidation;
using InvenTU.Core.DTOs.Stock;

namespace InvenTU.Application.Stock.Validators;

public sealed class TransferStockRequestValidator : AbstractValidator<TransferStockRequest>
{
    public TransferStockRequestValidator()
    {
        RuleFor(x => x.SourceWarehouseId)
            .NotEmpty().WithMessage("Source warehouse is required.");

        RuleFor(x => x.SourceStockLocationId)
            .NotEmpty().WithMessage("Source stock location is required.");

        RuleFor(x => x.DestinationWarehouseId)
            .NotEmpty().WithMessage("Destination warehouse is required.");

        RuleFor(x => x.DestinationStockLocationId)
            .NotEmpty().WithMessage("Destination stock location is required.");

        RuleFor(x => x.ProductId)
            .NotEmpty().WithMessage("Product is required.");

        RuleFor(x => x.Quantity)
            .GreaterThan(0).WithMessage("Transfer quantity must be greater than 0.");

        RuleFor(x => x)
            .Must(r => r.SourceWarehouseId != r.DestinationWarehouseId ||
                       r.SourceStockLocationId != r.DestinationStockLocationId)
            .WithName("Destination")
            .WithMessage("Source and destination locations must differ.");
    }
}
