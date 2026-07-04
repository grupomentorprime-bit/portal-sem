"use client";

import { BulkActions } from "@/components/admin/kit/tables/BulkActions";
import { Pagination } from "@/components/admin/kit/tables/Pagination";
import { SortHeader } from "@/components/admin/kit/tables/SortHeader";
import { EmptyState } from "@/components/admin/kit/states/EmptyState";
import { LoadingState } from "@/components/admin/kit/states/LoadingState";
import { aek } from "@/components/admin/kit/utils/tokens";
import type { SortState } from "@/components/admin/kit/utils/types";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface AdminDataTableColumn<T> {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  headerClassName?: string;
  cellClassName?: string;
}

export interface AdminDataTableProps<T> {
  columns: AdminDataTableColumn<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  sort?: SortState;
  onSort?: (columnId: string) => void;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  bulkActions?: ReactNode;
  selectedCount?: number;
  rowActions?: (row: T) => ReactNode;
  className?: string;
}

/**
 * Tabla administrativa estándar con sort, paginación, vacío y carga.
 * Presentacional — sin fetch ni lógica de negocio.
 */
export function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyTitle = "Sin registros",
  emptyDescription,
  sort,
  onSort,
  pagination,
  bulkActions,
  selectedCount = 0,
  rowActions,
  className,
}: AdminDataTableProps<T>) {
  if (loading) {
    return <LoadingState variant="table" className={className} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {bulkActions ? <BulkActions selectedCount={selectedCount}>{bulkActions}</BulkActions> : null}
      <div className={cn(aek.surface, "overflow-x-auto")}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-background-soft">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  className={cn("px-4 py-3 text-left", col.headerClassName)}
                >
                  {col.sortable && onSort ? (
                    <SortHeader
                      label={String(col.header)}
                      columnId={col.id}
                      activeColumnId={sort?.columnId}
                      direction={sort?.direction}
                      onSort={onSort}
                    />
                  ) : (
                    col.header
                  )}
                </th>
              ))}
              {rowActions ? (
                <th scope="col" className="w-0 px-4 py-3 text-right">
                  <span className="sr-only">Acciones</span>
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-border last:border-0 transition-colors hover:bg-[var(--admin-table-row-hover)]"
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={cn("px-4 py-3.5 align-middle", col.cellClassName)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
                {rowActions ? (
                  <td className="px-4 py-3 text-right align-middle">{rowActions(row)}</td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pagination && pagination.totalPages > 1 ? (
        <div className="flex justify-end">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={pagination.onPageChange}
          />
        </div>
      ) : null}
    </div>
  );
}
