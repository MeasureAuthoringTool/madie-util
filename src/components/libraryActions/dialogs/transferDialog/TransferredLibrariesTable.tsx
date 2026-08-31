import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  ColumnDef,
  flexRender,
} from "@tanstack/react-table";
import {
  Pagination,
  TruncateText,
} from "@madie/madie-design-system/dist/react";
import tw from "twin.macro";
import "styled-components/macro";
import { CqlLibrary } from "@madie/madie-models";
import { formatOwner } from "../../../../util/ownerFormatter";

interface RowData {
  libraryName: string;
  model: string;
  owner?: string;
}

const TH = tw.th`p-3 text-left text-sm`;
const TD = tw.td`p-3 text-left text-sm break-keep`;

interface TransferredLibrariesTableProps {
  libraries: CqlLibrary[];
  showOwnerColumn?: boolean;
}

const TransferredLibrariesTable = ({
  libraries,
  showOwnerColumn = false,
}: TransferredLibrariesTableProps) => {
  const [visibleLibraries, setVisibleLibraries] = useState<CqlLibrary[]>([]);
  // pagination utilities
  const [totalPages, setTotalPages] = useState<number>(0);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [visibleItems, setVisibleItems] = useState<number>(0);
  const [offset, setOffset] = useState<number>(0);
  const [currentLimit, setCurrentLimit] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);

  const managePagination = useCallback(() => {
    if (libraries.length < currentLimit) {
      setOffset(0);
      setVisibleLibraries([...libraries]);
      setVisibleItems(libraries.length);
      setTotalItems(libraries.length);
      setTotalPages(1);
    } else {
      const start = (currentPage - 1) * currentLimit;
      const end = start + currentLimit;
      const newVisibleLibraries = libraries.slice(start, end);
      setVisibleLibraries(newVisibleLibraries);
      setOffset(start);
      setVisibleItems(newVisibleLibraries.length);
      setTotalItems(libraries.length);
      setTotalPages(Math.ceil(libraries.length / currentLimit));
    }
  }, [
    currentLimit,
    currentPage,
    libraries,
    setOffset,
    setVisibleLibraries,
    setVisibleItems,
    setTotalItems,
    setTotalPages,
  ]);

  const canGoNext = currentPage < totalPages;
  const canGoPrev = currentPage > 1;

  const handlePageChange = (e, v) => {
    setCurrentPage(v);
  };
  const handleLimitChange = (e) => {
    setCurrentLimit(e.target.value);
    setCurrentPage(1);
  };

  useEffect(() => {
    managePagination();
  }, [libraries, currentPage, currentLimit, managePagination]);

  const data: RowData[] = useMemo(
    () =>
      visibleLibraries.map((library) => ({
        libraryName: library.cqlLibraryName,
        model: library.model,
        owner: formatOwner(library.ownerDisplayName, library.librarySet?.owner),
      })),
    [visibleLibraries]
  );

  const columns: ColumnDef<RowData>[] = useMemo(
    () => [
      {
        accessorKey: "libraryName",
        header: "Library",
        cell: (info) => (
          <TruncateText
            text={info.row.original.libraryName}
            maxLength={120}
            dataTestId={`library-name-${info.row.original.libraryName}`}
          />
        ),
      },
      {
        accessorKey: "model",
        header: "Model",
        cell: (info) => info.getValue(),
      },
      ...(showOwnerColumn
        ? [
            {
              accessorKey: "owner" as const,
              header: "Current Library Owner",
              cell: (info) => info.getValue(),
            },
          ]
        : []),
    ],
    [showOwnerColumn]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <table tw="min-w-full" data-testid="transfer-library-tbl">
        <thead tw="bg-slate">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TH key={header.id} scope="col">
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </TH>
              ))}
            </tr>
          ))}
        </thead>
        <tbody data-testid="transfer-library-tbl-body">
          {table.getRowModel().rows.map((row, index) => (
            <tr
              key={row.id}
              className="transfer-library-row"
              data-testid={`row-${index}`}
              style={{
                borderTop: "solid 1px #8c8c8c",
                paddingTop: "32px",
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <TD key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TD>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {libraries?.length > 0 && (
        <div className="pagination-container">
          <Pagination
            data-testid="trasfer-library-pagination"
            totalItems={totalItems}
            limitOptions={[5, 10, 25, 50]}
            visibleItems={visibleItems}
            offset={offset}
            handlePageChange={handlePageChange}
            handleLimitChange={handleLimitChange}
            page={currentPage}
            limit={currentLimit}
            count={totalPages}
            hideNextButton={!canGoNext}
            hidePrevButton={!canGoPrev}
            shape="rounded"
          />
        </div>
      )}
    </>
  );
};

export default TransferredLibrariesTable;
