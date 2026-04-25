using System;
using System.Collections.Generic;
using System.Text;
using FluentValidation;
using InvenTU.Core.DTOs.Categories;

namespace InvenTU.Application.Categories.Validators;

public sealed class UpdateCategoryRequestValidator : AbstractValidator<UpdateCategoryRequest>
{
    public UpdateCategoryRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Category name is required.")
            .MaximumLength(200).WithMessage("Name must be less than 200 characters long");
        RuleFor(x => x.Description)
            .MaximumLength(500).WithMessage("Description must be less than 500 characters long");
    }
}
