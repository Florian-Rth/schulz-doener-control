using Microsoft.Extensions.Options;
using Schulz.DoenerControl.Application.Security;
using Schulz.DoenerControl.Infrastructure.Security;
using Xunit;

namespace Schulz.DoenerControl.Api.Tests;

// Pure-logic unit tests for the Argon2id password hasher: no DB, no host. They exercise the
// real hashing path (real Argon2id, real pepper-as-KnownSecret) with deliberately weak params
// so the red-green loop stays fast.
public sealed class Argon2idPasswordHasherTests
{
    private const string PrimaryPepper = "dGVzdC1wZXBwZXItMzItYnl0ZXMtYmFzZTY0LXNlY3JldA==";
    private const string AlternatePepper = "ZGlmZmVyZW50LXBlcHBlci0zMi1ieXRlcy1iYXNlNjQtIQ==";

    private static Argon2idPasswordHasher CreateHasher(string pepper) =>
        new(
            Options.Create(
                new PasswordHashingOptions
                {
                    Pepper = pepper,
                    MemorySize = 8192,
                    Iterations = 1,
                }
            )
        );

    [Fact]
    public void Should_Verify_True_When_Password_Is_Correct()
    {
        var hasher = CreateHasher(PrimaryPepper);
        var result = hasher.Hash("KorrektesGeheimnis1");

        Assert.True(hasher.Verify("KorrektesGeheimnis1", result.Hash, result.Salt));
    }

    [Fact]
    public void Should_Verify_False_When_Password_Is_Wrong()
    {
        var hasher = CreateHasher(PrimaryPepper);
        var result = hasher.Hash("KorrektesGeheimnis1");

        Assert.False(hasher.Verify("FalschesGeheimnis9", result.Hash, result.Salt));
    }

    [Fact]
    public void Should_Produce_Different_Hashes_When_Same_Password_Has_Different_Salts()
    {
        var hasher = CreateHasher(PrimaryPepper);

        var first = hasher.Hash("GleichesPasswort1");
        var second = hasher.Hash("GleichesPasswort1");

        Assert.False(first.Salt.SequenceEqual(second.Salt));
        Assert.False(first.Hash.SequenceEqual(second.Hash));
    }

    [Fact]
    public void Should_Verify_False_When_Pepper_Differs()
    {
        var primaryHasher = CreateHasher(PrimaryPepper);
        var result = primaryHasher.Hash("KorrektesGeheimnis1");

        var alternateHasher = CreateHasher(AlternatePepper);

        Assert.False(alternateHasher.Verify("KorrektesGeheimnis1", result.Hash, result.Salt));
    }

    [Fact]
    public void Should_Generate_Sized_Salt_And_Hash_When_Hashing()
    {
        var hasher = CreateHasher(PrimaryPepper);

        var result = hasher.Hash("EinPasswort1");

        Assert.Equal(16, result.Salt.Length);
        Assert.Equal(32, result.Hash.Length);
    }
}
