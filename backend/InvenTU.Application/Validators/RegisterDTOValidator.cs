using System;
using System.Collections.Generic;
using System.Text;
using FluentValidation;
using InvenTU.Application.DTOs;

namespace InvenTU.Application.Validators;

public class RegisterDTOValidator : AbstractValidator<RegisterDTO>
{
    public RegisterDTOValidator()
    {
        RuleFor(p => p.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Not a valid email address");

        RuleFor(p => p.Password)
                .NotEmpty().WithMessage("Password is required")
                .MinimumLength(8).WithMessage("Password must be at least 8 characters")
                .Matches(@"[A-Z]").WithMessage("Password must contain at least 1 uppercase character")
                .Matches(@"[a-z]").WithMessage("Password must contain at least 1 lowercase character")
                .Matches(@"[0-9]").WithMessage("Password must contain at least 1 digit")
                .Matches(@"[^a-zA-Z0-9]").WithMessage("Password must contain at least 1 special character")
                .Equal(p => p.ConfirmPassword).WithMessage("Passwords must match");

        RuleFor(p => p.FirstName)
            .NotEmpty().WithMessage("First name is required")
            .MinimumLength(2).WithMessage("First name must be at least 2 characters");

        RuleFor(p => p.FirstName)
            .NotEmpty().WithMessage("Last name is required")
            .MinimumLength(2).WithMessage("Last name must be at least 2 characters");
    }
}
