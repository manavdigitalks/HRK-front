"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllPurchaseOrders, createPurchaseOrder, updatePurchaseOrder, deletePurchaseOrder } from "@/redux/slices/purchaseOrderSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function PurchaseOrders() {
  const dispatch = useAppDispatch();
  const { purchaseOrders, loading, pagination } = useAppSelector((state) => state.purchaseOrder);
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({ supplier: "", items: [], totalAmount: 0, status: "Pending" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllPurchaseOrders({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllPurchaseOrders({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({ supplier: "", items: [], totalAmount: 0, status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData({ supplier: order.supplier, items: order.items, totalAmount: order.totalAmount, status: order.status });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingOrder) {
        await dispatch(updatePurchaseOrder({ id: editingOrder._id, data: formData })).unwrap();
        toast.success("Order updated!");
      } else {
        await dispatch(createPurchaseOrder(formData)).unwrap();
        toast.success("Order created!");
      }
      setIsOpen(false);
      dispatch(fetchAllPurchaseOrders({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save order");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this order?")) {
      try {
        await dispatch(deletePurchaseOrder(id)).unwrap();
        toast.success("Order deleted!");
        dispatch(fetchAllPurchaseOrders({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete order");
      }
    }
  };

  const columns = [
    { header: "Date", accessorKey: "createdAt", cell: (item: any) => new Date(item.createdAt).toLocaleDateString('en-GB') },
    { header: "Supplier", accessorKey: "supplier" },
    { header: "Amount", accessorKey: "totalAmount", cell: (item: any) => <span className="font-medium">₹{item.totalAmount}</span> },
    { header: "Status", accessorKey: "status", cell: (item: any) => (
      <Badge variant={item.status === "Completed" ? "default" : "secondary"}>
        {item.status}
      </Badge>
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-600 mt-1">Manage supplier purchase orders</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={purchaseOrders}
        pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingOrder ? "Edit Purchase Order" : "New Purchase Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingOrder ? "Update" : "Create"} Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
