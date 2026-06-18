namespace Schulz.DoenerControl.Application.Security;

// The one-way result of hashing a password: the Argon2id digest plus the per-user random salt
// that produced it. Both are persisted on the User; the plaintext is never recoverable from them.
public sealed record PasswordHash(byte[] Hash, byte[] Salt);
