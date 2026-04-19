FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

COPY ["Directory.Packages.props", "./"]
COPY ["Directory.Build.props", "./"]

COPY ["backend/InvenTU.Api/InvenTU.Api.csproj", "backend/InvenTU.Api/"]
COPY ["backend/InvenTU.Application/InvenTU.Application.csproj", "backend/InvenTU.Application/"]
COPY ["backend/InvenTU.Core/InvenTU.Core.csproj", "backend/InvenTU.Core/"]
COPY ["backend/InvenTU.Infrastructure/InvenTU.Infrastructure.csproj", "backend/InvenTU.Infrastructure/"]

RUN dotnet restore "backend/InvenTU.Api/InvenTU.Api.csproj"

COPY backend/ ./backend/

WORKDIR "/src/backend/InvenTU.Api"
RUN dotnet publish "InvenTU.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine
RUN apk add --no-cache krb5-libs
WORKDIR /app
COPY --from=build /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "InvenTU.Api.dll"]