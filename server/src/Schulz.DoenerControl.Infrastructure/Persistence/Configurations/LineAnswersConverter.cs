using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Schulz.DoenerControl.Core.Entities;

namespace Schulz.DoenerControl.Infrastructure.Persistence.Configurations;

// Maps LineAnswers to its canonical JSON TEXT column (SQLite has no native jsonb) and back. The
// value comparer makes EF treat the payload by value, so a changed answer is detected on save even
// though LineAnswers is a reference type. LineAnswers is immutable, so the snapshot is identity.
public static class LineAnswersConverter
{
    public static readonly ValueConverter<LineAnswers, string> Instance = new(
        answers => LineAnswersJson.Serialize(answers),
        json => LineAnswersJson.Deserialize(json)
    );

    public static readonly ValueComparer<LineAnswers> Comparer = new(
        (left, right) => left != null && right != null && left.Equals(right),
        answers => answers.GetHashCode(),
        answers => answers
    );
}
