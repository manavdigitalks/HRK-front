"use client";
import React, { useEffect, useState, useMemo } from "react";
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
import { Combobox } from "../components/ui/combobox";
import { PhoneInput } from "../components/ui/phone-input";
import api from "@/lib/axios";

export function Customers() {
  const dispatch = useAppDispatch();
  const { customers, loading, pagination } = useAppSelector((state) => state.customer);
  const [transports, setTransports] = useState<any[]>([]);
  
  const [allStates, setAllStates] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);

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

  const sanitizePhone = (phone: string) => {
    if (!phone) return "";
    // Remove all non-digits
    let p = phone.replace(/\D/g, "");
    // If it starts with 91 and has 12 digits, take last 10
    if (p.length === 12 && p.startsWith("91")) return p.slice(2);
    // If it has more than 10 digits, take last 10
    if (p.length > 10) return p.slice(-10);
    return p;
  };

  const states = useMemo(() => allStates.map(s => ({ label: s, value: s })), [allStates]);
  
  const cities = useMemo(() => {
    const options = allCities.map(c => ({ label: c, value: c }));
    if (formData.station && !allCities.includes(formData.station)) {
      options.push({ label: formData.station, value: formData.station });
    }
    return options.sort((a, b) => a.label.localeCompare(b.label));
  }, [allCities, formData.station]);

  useEffect(() => {
    dispatch(fetchAllCustomers({ page: 1, limit: 10, search }));
    dispatch(fetchTransportDropdown()).unwrap().then(setTransports);
    
    // Fetch initial states
    api.get("/location/states").then(res => {
      if (res.data.status) setAllStates(res.data.data);
    });
  }, [dispatch, search]);

  useEffect(() => {
    if (formData.state) {
        api.get(`/location/cities?state=${formData.state}`).then(res => {
            if (res.data.status) setAllCities(res.data.data);
        });
    } else {
        setAllCities([]);
    }
  }, [formData.state]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllCustomers({ page, limit: 10, search }));
  };

  const findStateKey = (stateName: string) => {
    if (!stateName) return "";
    return allStates.find(s => s.toLowerCase() === stateName.toLowerCase()) || stateName;
  };

  const handleStateChange = (state: string) => {
    setFormData({ ...formData, state, station: "" });
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: "", number: "", gstNumber: "", station: "", state: "", transport: "" });
    setIsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    const stateKey = findStateKey(customer.state || "");
    setFormData({ 
      name: customer.name, 
      number: sanitizePhone(customer.number || customer.phone || ""), 
      gstNumber: customer.gstNumber || "",
      station: customer.station || "",
      state: stateKey,
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
      
      // Permanently save the location to master DB if it's new
      if (formData.state && formData.station) {
        api.post("/location/add", { state: formData.state, city: formData.station });
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
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
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
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="col-span-2 space-y-2">
              <Label>Customer Name</Label>
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
              <Label>State</Label>
              <Combobox 
                options={states}
                value={formData.state}
                onChange={handleStateChange}
                placeholder="Search state..."
                emptyMessage="State not found."
                allowCustomValue={true}
              />
            </div>
            <div className="space-y-2">
              <Label>City / Station</Label>
              <Combobox 
                options={cities}
                value={formData.station}
                onChange={(val) => setFormData({...formData, station: val})}
                placeholder={formData.state ? "Search city..." : "Select state first"}
                emptyMessage="City not found."
                disabled={!formData.state}
                allowCustomValue={true}
              />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Transport</Label>
              <Combobox
                options={transports.map((t: any) => ({ label: t.name, value: t._id }))}
                value={formData.transport}
                onChange={(val) => setFormData({...formData, transport: val})}
                placeholder="Select Transport"
                className="w-full"
              />
            </div>
            <div className="col-span-2 pt-4">
                <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 font-bold uppercase tracking-widest text-[11px]">
                  Save
                </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
