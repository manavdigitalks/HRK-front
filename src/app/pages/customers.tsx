"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllCustomers, createCustomer, updateCustomer, deleteCustomer } from "@/redux/slices/customerSlice";
import { fetchTransportDropdown } from "@/redux/slices/transportMasterSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function Customers() {
  const dispatch = useAppDispatch();
  const { customers, loading, pagination } = useAppSelector((state) => state.customer);
  const [transports, setTransports] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    name: "", 
    number: "", 
    gstNumber: "",
    station: "",
    state: "",
    transport: ""
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllCustomers({ page: 1, limit: 10, search }));
    dispatch(fetchTransportDropdown()).unwrap().then(setTransports);
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllCustomers({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: "", number: "", gstNumber: "", station: "", state: "", transport: "" });
    setIsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData({ 
      name: customer.name, 
      number: customer.number || customer.phone, 
      gstNumber: customer.gstNumber || "",
      station: customer.station || "",
      state: customer.state || "",
      transport: customer.transport?._id || customer.transport || ""
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingCustomer) {
        await dispatch(updateCustomer({ id: editingCustomer._id, data: formData })).unwrap();
        toast.success("Customer updated!");
      } else {
        await dispatch(createCustomer(formData)).unwrap();
        toast.success("Customer added!");
      }
      setIsOpen(false);
      dispatch(fetchAllCustomers({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save customer");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      try {
        await dispatch(deleteCustomer(id)).unwrap();
        toast.success("Customer deleted!");
        dispatch(fetchAllCustomers({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete customer");
      }
    }
  };

  const columns = [
    { header: "Customer", accessorKey: "name", cell: (item: any) => (
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
    { header: "Transport", accessorKey: "transport", cell: (item: any) => (
        <span className="text-sm font-semibold text-gray-600">{item.transport?.name || "N/A"}</span>
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <CommonDataTable
        columns={columns}
        data={customers}
        pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
        onPageChange={handlePageChange}
        onSearchChange={setSearch}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loading={loading}
      />

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit System Profile" : "Initialize Customer Profile"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Business Name</Label>
              <Input placeholder="Enter primary name..." value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Contact Number</Label>
              <Input placeholder="10-digit number" value={formData.number} onChange={(e) => setFormData({...formData, number: e.target.value})} className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">GST Number</Label>
              <Input placeholder="GSTIN" value={formData.gstNumber} onChange={(e) => setFormData({...formData, gstNumber: e.target.value})} className="font-bold uppercase" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Station/City</Label>
              <Input placeholder="e.g. Mumbai" value={formData.station} onChange={(e) => setFormData({...formData, station: e.target.value})} className="font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">State</Label>
              <Input placeholder="e.g. Maharashtra" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} className="font-bold" />
            </div>
            <div className="col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest">Preferred Transport</Label>
              <select 
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-50"
                value={formData.transport} 
                onChange={(e) => setFormData({...formData, transport: e.target.value})}
              >
                <option value="">Select Transport</option>
                {transports.map((t: any) => (
                    <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-span-2 pt-4">
                <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-black uppercase tracking-widest text-[11px]">
                {editingCustomer ? "Commit Changes" : "Create Profile"}
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
