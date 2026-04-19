namespace InvenTU.Core.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException(string errorCode, string message)
        : base(404, errorCode, message)
    {
    }
}
