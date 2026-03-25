"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllOrderBookings, deleteOrderBooking } from "@/redux/slices/orderBookingSlice";
import { CommonDataTable } from "@/app/components/ui/common-data-table";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";
import { Edit, Trash2, Receipt } from "lucide-react";
import { toast } from "sonner";

export default function OrderFormPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { orderBookings, loading, pagination } = useAppSelector((state) => state.orderBooking);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllOrderBookings({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllOrderBookings({ page, limit: 10, search }));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will release reserved items back to stock.")) {
      try {
        await dispatch(deleteOrderBooking(id)).unwrap();
        toast.success("Reservation cancelled and items restored to stock");
      } catch (err: any) {
        toast.error(err.message || "Failed to cancel reservation");
      }
    }
  };

  const columns = [
    { header: "Date", accessorKey: "createdAt", cell: (item: any) => new Date(item.createdAt).toLocaleDateString('en-GB') },
    {
      header: "Customer", accessorKey: "customer", cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold">{item.customer?.name}</span>
          <span className="text-xs text-gray-500">{item.customer?.number || item.customer?.phone}</span>
        </div>
      )
    },
    {
      header: "Product Detail", accessorKey: "product", cell: (item: any) => (
        <div className="flex flex-col">
          <span className="font-semibold">{item.product?.productCode}</span>
          <span className="text-xs text-indigo-500 font-medium">Design: {item.product?.designNo}</span>
        </div>
      )
    },
    { header: "Reserved Sets", accessorKey: "totalSets", cell: (item: any) => <span className="font-bold">{item.totalSets} Sets</span> },
    { 
      header: "Status", 
      accessorKey: "status", 
      cell: (item: any) => (
        <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-extrabold shadow-sm ${
          item.status === 'Hold' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 
          item.status === 'Closed' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 
          'bg-gray-50 text-gray-600 border border-gray-200'
        }`}>
          {item.status || 'Hold'}
        </span>
      )
    },
    { 
        header: "Actions", 
        accessorKey: "actions", 
        cell: (item: any) => (
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => router.push(`/order-form/edit/${item._id}`)} 
                    className="h-8 w-8 text-amber-600 disabled:opacity-30"
                    disabled={item.status === 'Closed'}
                >
                    <Edit className="w-4 h-4" />
                </Button>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => handleDelete(item._id)} 
                    className="h-8 w-8 text-red-600 disabled:opacity-30"
                    disabled={item.status === 'Closed'}
                >
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Order Form (Reservations)</h1>
          <p className="text-gray-500 mt-1">Manage customer reservations and product holds.</p>
        </div>
        <Button onClick={() => router.push("/order-form/new")} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-8">
          <Receipt className="w-4 h-4 mr-2" />
          Add Reservation
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={orderBookings}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
        />
      </div>
    </div>
  );
}
