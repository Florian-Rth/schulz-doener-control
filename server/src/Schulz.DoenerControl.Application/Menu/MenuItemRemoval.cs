namespace Schulz.DoenerControl.Application.Menu;

// The outcome of removing a menu item: a referenced item cannot be hard-deleted without orphaning
// the FK that past orders froze onto, so it is soft-retired (IsAvailable=false) instead. An
// unreferenced item is hard-deleted. Both are a 204 to the caller; this just records which happened.
public enum MenuItemRemoval
{
    Deleted,
    Retired,
}
