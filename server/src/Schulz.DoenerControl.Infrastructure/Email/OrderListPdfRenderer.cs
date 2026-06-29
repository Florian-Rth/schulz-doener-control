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
                    .Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(18);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(2);
                            columns.RelativeColumn(3);
                            columns.ConstantColumn(60);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Text(string.Empty);
                            header.Cell().Text("Person").Bold();
                            header.Cell().Text("Produkt").Bold();
                            header.Cell().Text("Details").Bold();
                            header.Cell().AlignRight().Text("Preis").Bold();
                        });

                        foreach (var order in day.Orders)
                        {
                            table.Cell().Text(order.IsPickup ? "*" : string.Empty);
                            table.Cell().Text(order.PersonName);
                            table.Cell().Text(order.ProductLabel);
                            table.Cell().Text(order.Description);
                            table.Cell().AlignRight().Text(order.PriceLabel);
                        }

                        var total = day.Orders.Sum(order => order.PriceCents);
                        table.Cell().ColumnSpan(4).AlignRight().Text("Gesamt").Bold();
                        table.Cell().AlignRight().Text(MoneyFormatter.ToGermanString(total)).Bold();
                    });
            });
        });

        return document.GeneratePdf();
    }
}
