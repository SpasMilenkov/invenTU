using System;
using System.Collections.Generic;
using System.Text;
using FluentValidation;
using InvenTU.Core.DTOs.Suppliers;

namespace InvenTU.Application.Suppliers.Validators;

public sealed class CreateSupplierRequestValidator : AbstractValidator<CreateSupplierRequest>
{
    public CreateSupplierRequestValidator()
    {
        RuleFor(x => x.ContactEmail)
            .EmailAddress().WithMessage("Contact email must be a valid email address");
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name can't be empty")
            .MaximumLength(200).WithMessage("Name must be no longer than 200 characters");
        RuleFor(x => x.ContactPhone)
            .Matches("^\\+?(\\d{1,3})?[-.\\s]?(\\(?\\d{3}\\)?[-.\\s]?)?(\\d[-.\\s]?){6,9}\\d$").WithMessage("Contact Phone must be a valid phone number");
    }
}
