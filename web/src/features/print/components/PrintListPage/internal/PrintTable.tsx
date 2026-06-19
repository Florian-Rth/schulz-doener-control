import type { SxProps, Theme } from "@mui/material/styles";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import type { FC } from "react";
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

// Person | Produkt | Details | Preis, plus a leading ✓ column the shop can tick
// off, and a bold grand-total footer row. The same markup serves screen + print.
export const PrintTable: FC = () => {
  const { orders, totalLabel } = usePrintListContext();

  return (
    <Table data-print-table size="small" sx={{ tableLayout: "fixed" }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ ...headCellSx, width: "2.5rem", textAlign: "center" }}>
            {printCopy.colCheck}
          </TableCell>
          <TableCell sx={headCellSx}>{printCopy.colPerson}</TableCell>
          <TableCell sx={headCellSx}>{printCopy.colProduct}</TableCell>
          <TableCell sx={headCellSx}>{printCopy.colDetails}</TableCell>
          <TableCell sx={{ ...headCellSx, textAlign: "right" }}>{printCopy.colPrice}</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.orderId} data-print-row>
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
              {order.personName}
            </TableCell>
            <TableCell sx={{ ...cellSx, fontWeight: 600, wordBreak: "break-word" }}>
              {order.productLabel}
            </TableCell>
            <TableCell sx={{ ...cellSx, color: "label.main", wordBreak: "break-word" }}>
              {order.description}
            </TableCell>
            <TableCell
              sx={{ ...cellSx, textAlign: "right", fontWeight: 700, whiteSpace: "nowrap" }}
            >
              {formatEur(order.priceCents)}
            </TableCell>
          </TableRow>
        ))}
        <TableRow data-print-row>
          <TableCell sx={{ ...cellSx, borderBottom: "none" }} />
          <TableCell
            colSpan={3}
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
