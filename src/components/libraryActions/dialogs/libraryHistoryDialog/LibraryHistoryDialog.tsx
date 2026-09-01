import React, { useEffect, useMemo, useRef, useState } from "react";
import { MadieDialog, Pagination } from "@madie/madie-design-system/dist/react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import tw from "twin.macro";
import "styled-components/macro";
import "./LibraryHistoryDialog.scss";
import Chip from "@mui/material/Chip";
import { CqlLibrary } from "@madie/madie-models";
import useCqlLibraryServiceApi, {
  AuditRow,
} from "../../../../api/useCqlLibraryServiceApi";

interface LibraryHistoryDialogProps {
  libraries: CqlLibrary[];
  open: boolean;
  onClose: () => void;
}

/*
  Reproduces moment's "MM/DD/YYYY hh:mm:ss A" output so the rendered date is
  unchanged from before this dialog moved into madie-util, without pulling
  moment into the util bundle. Like moment's .local(), this renders local time.
*/
export const HISTORY_FETCH_ERROR =
  "Could not fetch history for this library. Contact Help Desk for additional information.";

export const formatHistoryDate = (value: string): string =>
  new Date(value)
    .toLocaleString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(",", "");

const LibraryHistoryDialog = ({
  libraries,
  open,
  onClose,
}: LibraryHistoryDialogProps) => {
  const cqlLibraryServiceApi = useRef(useCqlLibraryServiceApi()).current;
  const selectedCqlLibrary = libraries?.[0];

  const [libraryHistoryLogs, setLibraryHistoryLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (open && libraries?.length === 1) {
      setLoading(true);
      setError(false);
      setCurrentPage(1);
      cqlLibraryServiceApi
        .getLibraryHistory(libraries[0])
        .then((data) => setLibraryHistoryLogs(data ?? []))
        .catch(() => {
          setLibraryHistoryLogs([]);
          setError(true);
        })
        .finally(() => setLoading(false));
    } else if (!open) {
      setLibraryHistoryLogs([]);
      setError(false);
      setCurrentPage(1);
    }
  }, [open, libraries, cqlLibraryServiceApi]);

  const totalItems = libraryHistoryLogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / limit));
  const offset = (currentPage - 1) * limit;
  const visibleItems = useMemo(
    () => libraryHistoryLogs.slice(offset, offset + limit),
    [libraryHistoryLogs, offset, limit]
  );
  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  const handlePageChange = (e: any, selectedPage: number) =>
    setCurrentPage(selectedPage);

  const handleLimitChange = (e: any) => {
    setLimit(Number(e.target.value));
    setCurrentPage(1);
  };

  const columns = useMemo<ColumnDef<AuditRow>[]>(
    () => [
      {
        header: "Date",
        accessorKey: "performedAt",
        cell: (info) => {
          const value = info.getValue() as string;
          return value ? formatHistoryDate(value) : "";
        },
      },
      {
        header: "User Action",
        accessorKey: "actionType",
      },
      {
        header: "User",
        accessorKey: "performedBy",
      },
      {
        header: "Additional Info",
        accessorKey: "additionalActionMessage",
        cell: (info) => {
          const value = info.getValue();
          return value && value != "[]" ? value : "-";
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: visibleItems,
    columns,
    defaultColumn: {
      size: 200,
      minSize: 50,
      maxSize: 500,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // Pagination is handled above by slicing `visibleItems`, so the table only
    // ever sees one page. Its own auto page reset would fire redundant updates.
    autoResetPageIndex: false,
  });

  return (
    <MadieDialog
      form
      title="Library History"
      dialogProps={{
        onClose,
        open,
        maxWidth: "lg",
        "data-testid": "library-history-dialog",
      }}
      cancelButtonProps={{
        variant: "outline",
        cancelText: "Close",
        "data-testid": "library-history-close-button",
      }}
      continueButtonProps={null}
      maxWidth={"lg"}
    >
      <div id="cql-library-history-dialog">
        <div className="header-info">
          <span>{selectedCqlLibrary?.cqlLibraryName} </span>
          <span>{`(Version ${selectedCqlLibrary?.version})`}</span>
          {selectedCqlLibrary?.draft && (
            <Chip
              data-testid="library-history-draft-chip"
              label="Draft"
              sx={{
                backgroundColor: "#e1f3f8",
                height: "24px",
                ml: 1,
              }}
            />
          )}
        </div>

        <table
          tw="min-w-full"
          id="library-history-table"
          data-testid="library-history-table"
          className="madie-table"
        >
          <thead className="madie-th">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      onClick={header.column.getToggleSortingHandler()}
                      className="header-cell"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          className={
                            header.column.getCanSort()
                              ? "cursor-pointer select-none header-button"
                              : "header-button"
                          }
                          title={
                            header.column.getCanSort()
                              ? header.column.getNextSortingOrder() === "asc"
                                ? "Sort ascending"
                                : header.column.getNextSortingOrder() === "desc"
                                ? "Sort descending"
                                : "Clear sort"
                              : undefined
                          }
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </button>
                      ) : (
                        flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className="tbody"
            data-testid="library-history-table-body"
            style={{ padding: 20 }}
          >
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  Loading...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", padding: "0.5rem" }}
                >
                  {HISTORY_FETCH_ERROR}
                </td>
              </tr>
            ) : visibleItems.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{ textAlign: "center", padding: "0.5rem" }}
                >
                  No history found.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="madie-tr"
                  data-testid={`library-history-row-${row.id}`}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      data-testid={`library-history-${cell.id}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination-container">
        <Pagination
          data-testid="library-history-pagination"
          totalItems={totalItems}
          limitOptions={[5, 10, 25, 50]}
          visibleItems={visibleItems.length}
          offset={offset}
          page={currentPage}
          limit={limit}
          count={totalPages}
          handleLimitChange={handleLimitChange}
          handlePageChange={handlePageChange}
          hideNextButton={!canGoNext}
          hidePrevButton={!canGoPrev}
          shape="rounded"
        />
      </div>
    </MadieDialog>
  );
};

export default LibraryHistoryDialog;
