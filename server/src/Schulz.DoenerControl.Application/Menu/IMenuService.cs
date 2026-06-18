using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Menu;

public interface IMenuService
{
    Task<Result<MenuDetails>> GetMenuAsync(CancellationToken ct);
}
