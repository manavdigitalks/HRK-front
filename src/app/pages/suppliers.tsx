"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, User, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/redux/slices/supplierSlice";
import { CommonDataTable } from "../components/ui/common-data-table";
import { PhoneInput } from "../components/ui/phone-input";

export function Suppliers() {
  const dispatch = useAppDispatch();
  const { suppliers, loading, pagination } = useAppSelector((state) => state.supplier);
  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    number: "", 
    gstNumber: "",
    station: "",
    state: "",
  });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sanitizePhone = (phone: string) => {
    if (!phone) return "";
    let p = phone.replace(/\D/g, "");
    if (p.length === 12 && p.startsWith("91")) return p.slice(2);
    if (p.length > 10) return p.slice(-10);
    return p;
  };

  useEffect(() => {
    dispatch(fetchAllSuppliers({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllSuppliers({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingSupplier(null);
    setFormData({ name: "", number: "", gstNumber: "", station: "", state: "" });
    setIsOpen(true);
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({ 
      name: supplier.name, 
      number: sanitizePhone(supplier.number || ""), 
      gstNumber: supplier.gstNumber || "",
      station: supplier.station || "",
      state: supplier.state || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    if (!formData.number || formData.number.length !== 10) {
      toast.error("Please enter a valid 10-digit contact number");
      return;
    }

    setIsSaving(true);
    try {
      if (editingSupplier) {
        await dispatch(updateSupplier({ id: editingSupplier._id, data: formData })).unwrap();
        toast.success("Supplier updated!");
      } else {
        await dispatch(createSupplier(formData)).unwrap();
        toast.success("Supplier added!");
      }
      setIsOpen(false);
      dispatch(fetchAllSuppliers({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this supplier?")) {
      try {
        await dispatch(deleteSupplier(id)).unwrap();
        toast.success("Supplier deleted!");
        dispatch(fetchAllSuppliers({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete supplier");
      }
    }
  };

  const columns = [
    { header: "Supplier", accessorKey: "name", cell: (item: any) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex flex-col">
            <span className="font-bold text-sm tracking-tight">{item.name}</span>
            <span className="text-[10px] text-gray-400 font-medium">{item.gstNumber || "NO_GST"}</span>
        </div>
      </div>
    )},
    { header: "Number", accessorKey: "number" },
    { header: "Location", accessorKey: "station", cell: (item: any) => (
        <div className="flex flex-col">
            <span className="text-sm font-medium">{item.station}</span>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{item.state}</span>
        </div>
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={suppliers}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="col-span-2 space-y-2">
              <Label>Supplier Name</Label>
              <Input placeholder="Enter name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <PhoneInput value={formData.number} onPhoneChange={(val) => setFormData({...formData, number: val})} />
            </div>
            <div className="space-y-2">
              <Label>GST Number</Label>
              <Input placeholder="GSTIN" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} className="uppercase" />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input placeholder="e.g. Mumbai" value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input placeholder="e.g. Maharashtra" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} />
            </div>
            <div className="col-span-2 pt-4">
                 <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold uppercase tracking-widest text-[11px]" disabled={isSaving}>
                   {isSaving ? (
                     <>
                       <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                       Saving...
                     </>
                   ) : (
                     "Save"
                   )}
                 </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
