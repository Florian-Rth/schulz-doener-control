using Schulz.DoenerControl.Core;

namespace Schulz.DoenerControl.Application.Menu;

public interface IMenuService
{
    // Public order-form menu: available items only, plus the order vocabularies.
    Task<Result<MenuDetails>> GetMenuAsync(CancellationToken ct);

    // Admin menu management: every item including retired ones.
    Task<Result<IReadOnlyList<MenuItemDetails>>> ListAllAsync(CancellationToken ct);

    Task<Result<MenuItemDetails>> CreateAsync(CreateMenuItemCommand command, CancellationToken ct);

    Task<Result<MenuItemDetails>> UpdateAsync(UpdateMenuItemCommand command, CancellationToken ct);

    Task<Result<MenuItemRemoval>> RemoveAsync(string id, CancellationToken ct);
}
