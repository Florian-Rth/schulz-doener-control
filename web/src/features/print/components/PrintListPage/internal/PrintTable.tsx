import type { SxProps, Theme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { type FC, Fragment } from "react";
import { printCopy } from "../../../copy";
import { formatEur } from "../../../money";
import { usePrintListContext } from "../../../print-context";

// Shared cell sx: tight padding, navy text, thin underline between rows so the
// sheet reads as a clean checklist both on screen and on paper.
const cellSx: SxProps<Theme> = {
  px: 1,
  py: 1.25,
  fontSize: "0.875rem",
  color: "navy.main",
  borderBottom: "1px solid rgba(0,34,48,.15)",
  verticalAlign: "top",
};

const headCellSx: SxProps<Theme> = {
  px: 1,
  py: 1,
  fontSize: "0.6875rem",
  fontWeight: 700,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: "muted.main",
  borderBottom: "2px solid",
  borderColor: "navy.main",
};

// Nr. | ✓ | Produkt | Details | Person | Preis, grouped under an article-type header row (Döner,
// Dürüm, Pizza …) so the shop can be worked group by group. Each line is numbered 1..N across the
// whole sheet — the same number goes on the person's bag at handoff. A bold grand-total row closes
// it. The same markup serves screen + print.
export const PrintTable: FC = () => {
  const { lines, totalLabel } = usePrintListContext();

  let lastSection: string | null = null;

  return (
    <Table data-print-table size="small" sx={{ tableLayout: "fixed" }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...headCellSx, width: "2.25rem", textAlign: "center" }}>
            {printCopy.colNumber}
          </TableCell>
          <TableCell sx={{ ...headCellSx, width: "2.25rem", textAlign: "center" }}>
            {printCopy.colCheck}
          </TableCell>
          <TableCell sx={headCellSx}>{printCopy.colProduct}</TableCell>
          <TableCell sx={headCellSx}>{printCopy.colDetails}</TableCell>
          <TableCell sx={headCellSx}>{printCopy.colPerson}</TableCell>
          <TableCell sx={{ ...headCellSx, textAlign: "right" }}>{printCopy.colPrice}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {lines.map((line) => {
          const startsSection = line.section !== lastSection;
          lastSection = line.section;
          const productLabel =
            line.quantity > 1 ? `${line.quantity}× ${line.productLabel}` : line.productLabel;
          return (
            <Fragment key={line.number}>
              {startsSection ? (
                <TableRow data-print-row>
                  <TableCell
                    colSpan={6}
                    sx={{
                      px: 1,
                      pt: 1.5,
                      pb: 0.5,
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      color: "muted.main",
                      borderBottom: "1px solid rgba(0,34,48,.25)",
                    }}
                  >
                    {line.section}
                  </TableCell>
                </TableRow>
              ) : null}
              <TableRow data-print-row>
                <TableCell
                  sx={{ ...cellSx, textAlign: "center", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {line.number}
                </TableCell>
                <TableCell sx={{ ...cellSx, textAlign: "center" }}>
                  <span
                    aria-hidden
                    style={{
                      display: "inline-block",
                      width: "0.95rem",
                      height: "0.95rem",
                      border: "1.5px solid #002230",
                      borderRadius: 3,
                    }}
                  />
                </TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 600, wordBreak: "break-word" }}>
                  {productLabel}
                </TableCell>
                <TableCell sx={{ ...cellSx, color: "label.main", wordBreak: "break-word" }}>
                  {line.description}
                </TableCell>
                <TableCell sx={{ ...cellSx, fontWeight: 600, wordBreak: "break-word" }}>
                  {line.personName}
                </TableCell>
                <TableCell
                  sx={{ ...cellSx, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}
                >
                  {formatEur(line.lineTotalCents)}
                </TableCell>
              </TableRow>
            </Fragment>
          );
        })}
        <TableRow data-print-row>
          <TableCell
            colSpan={5}
            sx={{
              ...cellSx,
              borderBottom: "none",
              fontSize: "1rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            {printCopy.totalLabel}
          </TableCell>
          <TableCell
            sx={{
              ...cellSx,
              borderBottom: "none",
              textAlign: "right",
              fontSize: "1.0625rem",
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {totalLabel}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
};
