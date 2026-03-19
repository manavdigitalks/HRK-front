"use client";
import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllBillings, deleteBilling } from "@/redux/slices/billingSlice";
import { CommonDataTable } from "../components/ui/common-data-table";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Receipt, Download } from "lucide-react";
import api from "@/lib/axios";

export function Billing() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { billings, loading, pagination } = useAppSelector((state) => state.billing);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllBillings({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllBillings({ page, limit: 10, search }));
  };

  const handleDownloadSlip = async (id: string, billNumber: string) => {
    try {
      const response = await api.get(`/billing/${id}/packing-slip`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `packing-slip-${billNumber}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download packing slip");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will revert items to stock.")) {
      try {
        await dispatch(deleteBilling(id)).unwrap();
        toast.success("Slip removed");
        dispatch(fetchAllBillings({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    }
  };

  const columns = [
    { header: "Slip No", accessorKey: "billNumber", cell: (item: any) => <span className="font-bold text-indigo-600">#{item.billNumber}</span> },
    {
      header: "Customer", accessorKey: "customer", cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold">{item.customer?.name}</span>
          <span className="text-xs text-gray-500">{item.customer?.number || item.customer?.phone}</span>
        </div>
      )
    },
    { header: "Date", accessorKey: "createdAt", cell: (item: any) => new Date(item.createdAt).toLocaleDateString('en-GB') },
    { header: "Amount", accessorKey: "totalAmount", cell: (item: any) => <span className="font-bold">₹{item.totalAmount}</span> },
    { 
        header: "Actions", 
        accessorKey: "actions", 
        cell: (item: any) => (
            <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleDownloadSlip(item._id, item.billNumber)} className="h-8 w-8 text-green-600" title="Download Packing Slip">
                    <Download className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => router.push(`/billing/edit/${item._id}`)} className="h-8 w-8 text-amber-600">
                    <Edit className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleDelete(item._id)} className="h-8 w-8 text-red-600">
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        )
    },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 uppercase tracking-tighter">Packing Slip</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Inventory Logistics & History</p>
        </div>
        <Button onClick={() => router.push("/billing/new")} className="bg-indigo-600 hover:bg-indigo-700 font-black px-8">
          <Receipt className="w-4 h-4 mr-2" />
          New Packing Slip
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={billings}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
        />
      </div>
    </div>
  );
}
