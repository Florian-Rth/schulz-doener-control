# syntax=docker/dockerfile:1
#
# Schulz Döner Control — API image.
# Build context MUST be the `server/` directory (it needs the .sln, props files and all
# referenced projects). Build from the repo root with:
#   docker build -f server/Dockerfile server
#
# ── build stage ──────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Restore first, with only the files that affect the dependency graph, so the
# (slow) restore layer stays cached across source-only changes.
COPY global.json Directory.Build.props Directory.Packages.props ./
COPY src/Schulz.DoenerControl.Api/Schulz.DoenerControl.Api.csproj                     src/Schulz.DoenerControl.Api/
COPY src/Schulz.DoenerControl.Application/Schulz.DoenerControl.Application.csproj     src/Schulz.DoenerControl.Application/
COPY src/Schulz.DoenerControl.Core/Schulz.DoenerControl.Core.csproj                   src/Schulz.DoenerControl.Core/
COPY src/Schulz.DoenerControl.Infrastructure/Schulz.DoenerControl.Infrastructure.csproj src/Schulz.DoenerControl.Infrastructure/
RUN dotnet restore src/Schulz.DoenerControl.Api/Schulz.DoenerControl.Api.csproj

# Copy the rest of the sources and publish a framework-dependent, self-contained-trimmed-off
# build. Restore is skipped (already done above).
COPY src/ src/
RUN dotnet publish src/Schulz.DoenerControl.Api/Schulz.DoenerControl.Api.csproj \
    -c Release \
    --no-restore \
    -o /app/publish \
    -p:UseAppHost=false

# ── runtime stage ────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Kestrel listens on 8080 (the .NET 8+ image default); be explicit anyway.
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    ConnectionStrings__AppDb="Data Source=/data/doenercontrol.db"

# Persistent SQLite location. Mount a volume here so the DB survives container
# recreation. Owned by the image's non-root `app` user (UID 1654).
RUN mkdir -p /data && chown -R $APP_UID:$APP_UID /data
VOLUME ["/data"]

COPY --from=build --chown=$APP_UID:$APP_UID /app/publish ./

USER $APP_UID
EXPOSE 8080
ENTRYPOINT ["dotnet", "Schulz.DoenerControl.Api.dll"]
