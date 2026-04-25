namespace InvenTU.Core.Exceptions;

public class BadRequestException(string errorCode, string message) : AppException(400, errorCode, message)
{
}
