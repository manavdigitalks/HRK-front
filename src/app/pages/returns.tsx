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
import { fetchAllReturns, createReturn, updateReturn, deleteReturn } from "@/redux/slices/returnSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function Returns() {
  const dispatch = useAppDispatch();
  const { returns, loading, pagination } = useAppSelector((state) => state.return);
  const [isOpen, setIsOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [formData, setFormData] = useState({ invoice: "", product: "", customer: "", amount: 0, reason: "", status: "Pending" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllReturns({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllReturns({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingReturn(null);
    setFormData({ invoice: "", product: "", customer: "", amount: 0, reason: "", status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (ret: any) => {
    setEditingReturn(ret);
    setFormData({ 
      invoice: ret.invoice, 
      product: typeof ret.product === 'object' ? ret.product?._id : ret.product, 
      customer: typeof ret.customer === 'object' ? ret.customer?._id : ret.customer, 
      amount: ret.amount, 
      reason: ret.reason || "", 
      status: ret.status 
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingReturn) {
        await dispatch(updateReturn({ id: editingReturn._id, data: formData })).unwrap();
        toast.success("Return updated!");
      } else {
        await dispatch(createReturn(formData)).unwrap();
        toast.success("Return created!");
      }
      setIsOpen(false);
      dispatch(fetchAllReturns({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save return");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this return?")) {
      try {
        await dispatch(deleteReturn(id)).unwrap();
        toast.success("Return deleted!");
        dispatch(fetchAllReturns({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete return");
      }
    }
  };

  const columns = [
    { header: "Date", accessorKey: "createdAt", cell: (item: any) => new Date(item.createdAt).toLocaleDateString('en-GB') },
    { header: "Invoice", accessorKey: "invoice" },
    { header: "Product", accessorKey: "product", cell: (item: any) => (typeof item.product === 'object' ? item.product?.name : item.product) },
    { header: "Customer", accessorKey: "customer", cell: (item: any) => (typeof item.customer === 'object' ? item.customer?.name : item.customer) },
    { header: "Amount", accessorKey: "amount", cell: (item: any) => <span className="font-medium">₹{item.amount}</span> },
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
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Manage product returns</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Return
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={returns}
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
            <DialogTitle>{editingReturn ? "Edit Return" : "New Return"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Input value={formData.invoice} onChange={(e) => setFormData({...formData, invoice: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Product ID</Label>
              <Input value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Customer ID</Label>
              <Input value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingReturn ? "Update" : "Create"} Return
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
