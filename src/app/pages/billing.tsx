"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Trash2, Save, Printer, Eye, Scan, Receipt, Calendar, Tag, IndianRupee, User } from "lucide-react";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllCustomers } from "@/redux/slices/customerSlice";
import { fetchAllBillings, createBilling, deleteBilling, scanBarcode } from "@/redux/slices/billingSlice";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";

export function Billing() {
  const dispatch = useAppDispatch();
  const { customers } = useAppSelector((state) => state.customer);
  const { billings, loading, pagination } = useAppSelector((state) => state.billing);

  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllCustomers({ page: 1, limit: 1000 }));
    dispatch(fetchAllBillings({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllBillings({ page, limit: 10, search }));
  };

  const handleScan = async () => {
    if (!barcodeInput) return;
    try {
      const result = await dispatch(scanBarcode(barcodeInput)).unwrap();
      if (items.find(i => i.barcode === result.barcode)) {
        toast.warning("This barcode is already added");
        setBarcodeInput("");
        return;
      }
      setItems([...items, { ...result, id: Date.now() }]);
      setBarcodeInput("");
      toast.success(`Product ${result.productName} Added`);
    } catch (err: any) {
      toast.error(err.message || "Invalid Barcode");
      setBarcodeInput("");
    }
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gst = afterDiscount * 0.18;
  const total = afterDiscount + gst;

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer!");
      return;
    }
    if (items.length === 0) {
      toast.error("Add at least one item");
      return;
    }

    try {
      const billingData = {
        customer: selectedCustomer,
        items: items.map(i => ({
          product: i.productId,
          productName: i.productName,
          barcode: i.barcode,
          qty: i.qty,
          price: i.price,
          total: i.total
        })),
        totalAmount: total
      };

      await dispatch(createBilling(billingData)).unwrap();
      toast.success("Bill saved!");
      setIsOpen(false);
      setItems([]);
      setSelectedCustomer("");
      setDiscount(0);
      dispatch(fetchAllBillings({ page: 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save bill");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will revert items to stock.")) {
      try {
        await dispatch(deleteBilling(id)).unwrap();
        toast.success("Bill removed");
        dispatch(fetchAllBillings({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    }
  };

  const columns = [
    { header: "Bill No", accessorKey: "billNumber", cell: (item: any) => <span className="font-bold text-indigo-600">#{item.billNumber}</span> },
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
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing</h1>
          <p className="text-gray-600 mt-1">Manage invoice history</p>
        </div>
        <Button onClick={() => { setIsOpen(true); setItems([]); setDiscount(0); }} className="bg-indigo-600 hover:bg-indigo-700">
          <Receipt className="w-4 h-4 mr-2" />
          Generate New Bill
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <CommonDataTable
          columns={columns}
          data={billings}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
          onDelete={handleDelete}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Bill</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Select Customer</Label>
                <select
                  className="w-full h-10 px-3 border rounded-md text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Choose Customer...</option>
                  {customers.map((c: any) => (
                    <option key={c._id} value={c._id}>{c.name} - {c.number || c.phone}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scan Barcode</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter/Scan Barcode"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                  />
                  <Button onClick={handleScan} className="bg-indigo-600">
                    <Scan className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-gray-500 text-[10px] uppercase">Product</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-500 text-[10px] uppercase">Qty</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-500 text-[10px] uppercase">Price</th>
                    <th className="px-4 py-2 text-center font-bold text-gray-500 text-[10px] uppercase">Total</th>
                    <th className="px-4 py-2 text-right font-bold text-gray-500 text-[10px] uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">No items scanned yet</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-bold">{item.productName}</div>
                          <div className="text-[10px] text-gray-400">{item.barcode}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium">{item.qty} PCS</td>
                        <td className="px-4 py-3 text-center font-medium">₹{item.price}</td>
                        <td className="px-4 py-3 text-center font-bold text-indigo-600">₹{item.total}</td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-red-500 h-8 w-8">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Summary & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pt-4 border-t">
              <div className="w-full md:w-64 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="font-bold">₹{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-medium">Discount</span>
                    <Input
                      type="number"
                      value={discount}
                      onChange={(e) => setDiscount(Math.max(0, +e.target.value))}
                      className="w-14 h-8 p-1 text-center font-bold"
                    />
                    <span className="text-gray-500 font-medium">%</span>
                  </div>
                  <span className="font-bold text-red-500">- ₹{discountAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 font-medium">GST (18%)</span>
                  <span className="font-bold">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-lg font-black uppercase tracking-tight">Total to Pay</span>
                  <span className="text-lg font-black text-indigo-600">₹{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleSave} className="flex-1 md:flex-none bg-indigo-600 font-bold px-8 h-10">
                  <Save className="w-4 h-4 mr-2" /> Save Bill
                </Button>
                <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1 md:flex-none h-10 font-bold text-gray-500">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
