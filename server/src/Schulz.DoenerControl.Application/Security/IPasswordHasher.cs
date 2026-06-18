namespace Schulz.DoenerControl.Application.Security;

// One-way password hashing. Hashing is never reversible: there is no method to recover a
// plaintext password from a stored hash. A server-side pepper (from configuration, never in the
// DB) is mixed into every hash so a database-only breach cannot be cracked offline.
public interface IPasswordHasher
{
    // Hashes the password with a freshly generated per-user random salt.
    PasswordHash Hash(string password);

    // Recomputes the hash for the candidate password against the stored salt and compares it in
    // constant time to the stored hash. Returns true only on an exact match.
    bool Verify(string password, byte[] hash, byte[] salt);
}
