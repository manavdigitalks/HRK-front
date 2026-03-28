import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { Button } from "./button";
import { Edit, Trash2, ChevronLeft, ChevronRight, Search, Loader2 } from "lucide-react";
import { Input } from "./input";

interface Column {
  header: string;
  accessorKey: string;
  cell?: (item: any) => React.ReactNode;
}

interface CommonDataTableProps {
  columns: Column[];
  data: any[];
  pagination: {
    totalRecords: number;
    currentPage: number;
    totalPages: number;
    limit: number;
  };
  onPageChange: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  loading?: boolean;
}

export function CommonDataTable({
  columns,
  data,
  pagination,
  onPageChange,
  onSearchChange,
  onEdit,
  onDelete,
  loading,
}: CommonDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const onSearchChangeRef = useRef(onSearchChange);

  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  useEffect(() => {
    if (!onSearchChangeRef.current) return;
    const timer = setTimeout(() => {
      onSearchChangeRef.current?.(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  return (
    <div className="space-y-4 p-1">
      {onSearchChange && (
        <div className="flex items-center justify-between gap-4">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Quick search records..."
              className="pl-10 h-10 border-gray-200 focus-visible:ring-indigo-500 rounded-lg shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px] font-bold text-gray-600">SR.</TableHead>
                {columns.map((column, index) => (
                  <TableHead key={index} className="font-bold text-gray-600">
                    {column.header}
                  </TableHead>
                ))}
                {(onEdit || onDelete) && <TableHead className="text-right font-bold text-gray-600">ACTIONS</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                      <span className="text-sm font-medium">Fetching data...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} className="h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                       <Search className="h-10 w-10 text-gray-200" />
                       <p className="font-medium text-lg">No records found</p>
                       <p className="text-sm text-gray-400">Try adjusting your search filters</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item._id} className="hover:bg-indigo-50/30 transition-colors">
                    <TableCell className="font-medium text-gray-500">
                      {(pagination.currentPage - 1) * pagination.limit + index + 1}
                    </TableCell>
                    {columns.map((column, colIndex) => (
                      <TableCell key={colIndex} className="py-4">
                        {column.cell ? column.cell(item) : item[column.accessorKey]}
                      </TableCell>
                    ))}
                    {(onEdit || onDelete) && (
                      <TableCell className="text-right py-4 px-6">
                        <div className="flex justify-end gap-1">
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onEdit(item)}
                              className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          )}
                          {onDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(item._id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between py-2 px-1">
        <div className="text-sm font-medium text-gray-400">
          Showing <span className="text-gray-900">{data.length}</span> of <span className="text-gray-900">{pagination.totalRecords}</span> entries
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1 || loading}
            className="h-9 rounded-lg border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-indigo-600 bg-indigo-50 w-8 h-8 flex items-center justify-center rounded-lg">
                {pagination.currentPage}
            </span>
            <span className="text-sm text-gray-400 px-1">of</span>
            <span className="text-sm font-medium text-gray-600">
                {pagination.totalPages || 1}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages || loading}
            className="h-9 rounded-lg border-gray-200 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
