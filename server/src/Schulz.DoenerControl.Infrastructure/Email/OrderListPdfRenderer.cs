using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Schulz.DoenerControl.Application.Calculators;
using Schulz.DoenerControl.Application.OrderDays;

namespace Schulz.DoenerControl.Infrastructure.Email;

// Renders the day's order list to a PDF — what the Abholer would otherwise print. Uses a widely
// available font family ("DejaVu Sans" ships in the runtime container via fonts-dejavu-core); on a
// host without it QuestPDF falls back to an available font, so rendering still succeeds.
public sealed class OrderListPdfRenderer
{
    private const string FontFamily = "DejaVu Sans";

    public byte[] Render(OrderDayDetails day)
    {
        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(style => style.FontFamily(FontFamily).FontSize(11));

                page.Header()
                    .Column(column =>
                    {
                        column.Item().Text($"Döner-Tag {day.Date:dd.MM.yyyy}").Bold().FontSize(18);
                        var pickup =
                            day.PickupNames.Count > 0 ? string.Join(", ", day.PickupNames) : "—";
                        column
                            .Item()
                            .Text($"{day.ParticipantCount} Bestellungen · Abholer: {pickup}")
                            .FontColor(Colors.Grey.Darken1);
                    });

                page.Content()
                    .PaddingVertical(12)
                    .Column(content =>
                    {
                        if (day.PrintList.Summary.Count > 0)
                        {
                            content.Item().Text("Für die Theke").Bold().FontSize(13);
                            foreach (var group in day.PrintList.Summary)
                            {
                                content.Item().Text($"{group.Quantity}× {group.Label}");
                            }
                            content.Item().PaddingTop(12);
                        }

                        content.Item().Table(table => BuildLineTable(table, day));
                    });
            });
        });

        return document.GeneratePdf();
    }

    // One numbered row per package, article-type ordered (matching the on-screen sheet): the number
    // the shop writes on each bag, who it's for (pickup person flagged "*"), the item, its details,
    // the quantity and the line price — closed by the grand-total footer.
    private static void BuildLineTable(TableDescriptor table, OrderDayDetails day)
    {
        table.ColumnsDefinition(columns =>
        {
            columns.ConstantColumn(24);
            columns.RelativeColumn(2);
            columns.RelativeColumn(2);
            columns.RelativeColumn(3);
            columns.ConstantColumn(40);
            columns.ConstantColumn(60);
        });

        table.Header(header =>
        {
            header.Cell().Text("Nr.").Bold();
            header.Cell().Text("Person").Bold();
            header.Cell().Text("Produkt").Bold();
            header.Cell().Text("Details").Bold();
            header.Cell().AlignRight().Text("Menge").Bold();
            header.Cell().AlignRight().Text("Preis").Bold();
        });

        foreach (var line in day.PrintList.Lines)
        {
            table.Cell().Text(line.Number.ToString());
            table.Cell().Text(line.IsPickup ? $"{line.PersonName} *" : line.PersonName);
            table.Cell().Text(line.ProductLabel);
            table.Cell().Text(line.Description);
            table.Cell().AlignRight().Text($"{line.Quantity}×");
            table.Cell().AlignRight().Text(line.LineTotalLabel);
        }

        var total = day.PrintList.Lines.Sum(line => line.LineTotalCents);
        table.Cell().ColumnSpan(5).AlignRight().Text("Gesamt").Bold();
        table.Cell().AlignRight().Text(MoneyFormatter.ToGermanString(total)).Bold();
    }
}
