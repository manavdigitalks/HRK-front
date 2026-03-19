"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllCustomers, createCustomer } from "@/redux/slices/customerSlice";
import { scanBarcode, createBilling, updateBilling, fetchBillingById } from "@/redux/slices/billingSlice";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Save, Scan, Receipt, ChevronDown, ChevronUp, Trash2, ArrowLeft, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";

export function BillingForm({ id }: { id?: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { customers } = useAppSelector((state) => state.customer);
  
  const [items, setItems] = useState<any[]>([]); // Grouped entries
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [barcodeInput, setBarcodeInput] = useState("");
  const [discount, setDiscount] = useState(0);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstPercent, setGstPercent] = useState(18);
  const [loading, setLoading] = useState(false);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", number: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);

  useEffect(() => {
    dispatch(fetchAllCustomers({ page: 1, limit: 1000 }));
    if (id) {
        setLoading(true);
        dispatch(fetchBillingById(id)).unwrap().then((bill: any) => {
            const grouped: any[] = [];
            let tempSubtotal = 0;
            bill.items.forEach((item: any) => {
                const prodId = item.product?._id || item.product;
                const existing = grouped.find(g => g.productId === prodId);
                tempSubtotal += (item.qty * item.price);
                if (existing) {
                    existing.barcodes.push({ barcode: item.barcode, sequenceNumber: item.sequenceNumber, qty: item.qty, originalQty: item.qty });
                } else {
                    grouped.push({
                        productId: prodId,
                        productName: item.productName,
                        price: item.price,
                        isExpanded: false,
                        barcodes: [{ barcode: item.barcode, sequenceNumber: item.sequenceNumber, qty: item.qty, originalQty: item.qty }]
                    });
                }
            });
            setItems(grouped);
            setSelectedCustomer(bill.customer?._id || bill.customer);
            
            if (bill.gstEnabled !== undefined) {
                setGstEnabled(bill.gstEnabled);
                setGstPercent(bill.gstPercent || 0);
                setDiscount(bill.discountPercent || 0);
            } else if (bill.totalAmount && tempSubtotal > 0) {
                const disc = 100 * (1 - ((bill.totalAmount / 1.18) / tempSubtotal));
                setDiscount(Math.round(disc > 0 ? disc : 0));
                setGstEnabled(true);
                setGstPercent(18);
            }
            setLoading(false);
        }).catch((err: any) => {
            console.error("Load Error:", err);
            toast.error("Failed to load billing");
            router.push("/billing");
        });
    }
  }, [dispatch, id, router]);

  const handleAddCustomer = async () => {
    if (!newCustomer.name || !newCustomer.number) {
      toast.error("Name and number required");
      return;
    }
    setSavingCustomer(true);
    try {
      const created = await dispatch(createCustomer(newCustomer)).unwrap();
      setSelectedCustomer(created._id);
      setNewCustomer({ name: "", number: "" });
      setAddCustomerOpen(false);
      toast.success("Customer added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleScan = async () => {
    if (!barcodeInput) return;
    try {
      const result = await dispatch(scanBarcode(barcodeInput)).unwrap();
      
      const existingGroup = items.find(i => i.productId === result.productId);
      const allBarcodes = items.flatMap(g => g.barcodes.map((b: any) => b.barcode));
      
      if (allBarcodes.includes(result.barcode)) {
        toast.warning("Already added");
        setBarcodeInput("");
        return;
      }

      const newBarcodeObj = { 
        barcode: result.barcode, 
        sequenceNumber: result.sequenceNumber,
        qty: result.qty, 
        originalQty: result.qty 
      };

      if (existingGroup) {
        setItems(items.map(group => {
            if (group.productId === result.productId) {
                return {
                    ...group,
                    isExpanded: true,
                    barcodes: [...group.barcodes, newBarcodeObj]
                };
            }
            return group;
        }));
      } else {
        setItems([...items, { 
            productId: result.productId,
            productName: result.productName,
            price: result.price,
            isExpanded: true,
            barcodes: [newBarcodeObj]
        }]);
      }
      
      setBarcodeInput("");
      toast.success(`Added ${result.productName}`);
    } catch (err: any) {
      toast.error(err.message || "Error");
      setBarcodeInput("");
    }
  };

  const toggleExpand = (productId: string) => {
    setItems(items.map(item => item.productId === productId ? { ...item, isExpanded: !item.isExpanded } : item));
  }

  const removeGroup = (productId: string) => {
    setItems(items.filter((item) => item.productId !== productId));
  };

  const removeBarcode = (productId: string, barcode: string) => {
    setItems(items.map(group => {
        if (group.productId === productId) {
            const newBarcodes = group.barcodes.filter((b: any) => b.barcode !== barcode);
            return { ...group, barcodes: newBarcodes };
        }
        return group;
    }).filter(group => group.barcodes.length > 0));
  };

  const updateBarcodeQty = (productId: string, barcode: string, newQty: number) => {
    setItems(items.map(group => {
        if (group.productId === productId) {
            return {
                ...group,
                barcodes: group.barcodes.map((b: any) => {
                    if (b.barcode !== barcode) return b;
                    const clamped = Math.min(Math.max(1, newQty), b.originalQty);
                    return { ...b, qty: clamped };
                })
            };
        }
        return group;
    }));
  };

  const subtotal = items.reduce((sum, group) => {
    const groupTotal = group.barcodes.reduce((gSum: number, b: any) => gSum + (b.qty * group.price), 0);
    return sum + groupTotal;
  }, 0);

  const discountAmount = (subtotal * discount) / 100;
  const afterDiscount = subtotal - discountAmount;
  const gstAmount = gstEnabled ? (afterDiscount * gstPercent / 100) : 0;
  const total = afterDiscount + gstAmount;

  const handleSave = async () => {
    if (!selectedCustomer) {
      toast.error("Choose a customer!");
      return;
    }
    if (items.length === 0) {
      toast.error("Add items first");
      return;
    }

    try {
      const flattenedItems = items.flatMap(group => (
        group.barcodes.map((b: any) => ({
          product: group.productId,
          productName: group.productName,
          barcode: b.barcode,
          sequenceNumber: b.sequenceNumber,
          qty: b.qty,
          price: group.price,
          total: b.qty * group.price
        }))
      ));

      const billingData = {
        customer: selectedCustomer,
        items: flattenedItems,
        subtotal: subtotal,
        discountPercent: discount,
        gstEnabled: gstEnabled,
        gstPercent: gstPercent, // Store the setting even if disabled
        totalAmount: total
      };

      if (id) {
        await dispatch(updateBilling({ id, data: billingData })).unwrap();
        toast.success("Updated!");
      } else {
        await dispatch(createBilling(billingData)).unwrap();
        toast.success("Saved!");
      }
      
      router.push("/billing");
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading Packing Slip...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border shadow-sm gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/billing")} title="Go Back">
                <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Packing Slip" : "Add Packing Slip"}</h1>
                <p className="text-gray-500 text-sm">Save your scan records here</p>
            </div>
        </div>
        <div>
            <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 font-bold px-10 h-11">
                <Save className="w-4 h-4 mr-2" /> {id ? "Update" : "Save"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
            {/* Input Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-lg border shadow-sm">
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Select Customer</Label>
                <div className="flex gap-2">
                  <select
                    className="flex-1 h-11 px-3 border rounded-md text-sm font-medium focus:border-indigo-500 outline-none transition-all bg-white"
                    value={selectedCustomer}
                    onChange={(e) => setSelectedCustomer(e.target.value)}
                  >
                    <option value="">-- Choose a Customer --</option>
                    {customers.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name} ({c.number || c.phone})</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-11 w-11 shrink-0 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    onClick={() => setAddCustomerOpen(true)}
                    title="Add new customer"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-bold text-gray-700">Scan Barcode / Seq ID</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter Seq No..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    className="h-11 border text-sm"
                  />
                  <Button onClick={handleScan} className="bg-gray-800 h-11">
                    <Scan className="w-4 h-4 mr-2" /> Scan
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Scanned Items */}
            <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-gray-50/50">
                    <h2 className="font-bold text-gray-800">Scanned Products</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-5 py-3 text-left font-bold text-gray-600 w-12 text-center">#</th>
                        <th className="px-5 py-3 text-left font-bold text-gray-600">Product Name</th>
                        <th className="px-5 py-3 text-center font-bold text-gray-600">Rate</th>
                        <th className="px-5 py-3 text-center font-bold text-gray-600 w-24">Set Count</th>
                        <th className="px-5 py-3 text-center font-bold text-gray-600">Total Price</th>
                        <th className="px-5 py-3 text-right w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-24 text-center">
                            <div className="flex flex-col items-center text-gray-300">
                                <Receipt className="w-12 h-12 mb-2 opacity-50" />
                                <p className="font-medium">Please scan a product.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        items.map((group, index) => {
                            const totalGroupPrice = group.barcodes.reduce((s: number, b: any) => s + (b.qty * group.price), 0);
                            return (
                                <React.Fragment key={group.productId}>
                                    <tr className={`hover:bg-gray-50 ${group.isExpanded ? 'bg-indigo-50/30' : ''}`}>
                                      <td className="px-5 py-4 text-center text-gray-400 font-medium">
                                          {index + 1}
                                      </td>
                                      <td className="px-5 py-4">
                                        <div className="flex items-center gap-3">
                                            <button onClick={() => toggleExpand(group.productId)} className="p-1 hover:bg-white rounded border border-gray-200 bg-white">
                                                {group.isExpanded ? <ChevronUp className="w-4 h-4 text-indigo-600" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                                            </button>
                                            <div className="font-bold text-gray-800">{group.productName}</div>
                                        </div>
                                      </td>
                                      <td className="px-5 py-4 text-center text-gray-600 font-medium">₹{group.price}</td>
                                      <td className="px-5 py-4 text-center">
                                          <Badge variant="outline" className="font-bold px-2 py-0.5 border-indigo-200 text-indigo-700 bg-white">
                                              {group.barcodes.length} Sets
                                          </Badge>
                                      </td>
                                      <td className="px-5 py-4 text-center font-bold text-indigo-700">₹{totalGroupPrice.toLocaleString()}</td>
                                      <td className="px-5 py-4 text-right">
                                        <Button variant="ghost" size="icon" onClick={() => removeGroup(group.productId)} className="text-red-400 hover:text-red-600 h-8 w-8">
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </td>
                                    </tr>

                                    {group.isExpanded && (
                                        <tr className="bg-gray-50/50">
                                            <td colSpan={6} className="px-10 py-5">
                                                <div className="space-y-3 border-l-2 border-indigo-200 pl-6 mb-2">
                                                    <div className="grid grid-cols-4 gap-4 px-3 text-[11px] font-bold uppercase text-gray-400">
                                                        <div>Sequence ID</div>
                                                        <div className="text-center">QTY (Pieces)</div>
                                                        <div className="text-center">Rate</div>
                                                        <div className="text-right">Total Price</div>
                                                    </div>
                                                    {group.barcodes.map((b: any) => (
                                                        <div key={b.barcode} className="grid grid-cols-4 gap-4 items-center bg-white p-3 rounded-md border border-gray-100 shadow-sm">
                                                            <div className="text-sm font-bold text-indigo-600">ID: {b.sequenceNumber}</div>
                                                            <div className="flex justify-center flex-col items-center">
                                                                <div className="flex items-center gap-2">
                                                                    <Input 
                                                                        type="number" 
                                                                        value={b.qty} 
                                                                        min={1}
                                                                        max={b.originalQty}
                                                                        onChange={(e) => updateBarcodeQty(group.productId, b.barcode, +e.target.value)}
                                                                        className="w-16 h-8 text-center font-bold text-sm"
                                                                    />
                                                                    <span className="text-[10px] text-gray-400 font-bold">/ {b.originalQty}</span>
                                                                </div>
                                                            </div>
                                                            <div className="text-center text-sm font-semibold text-gray-500">₹{group.price}</div>
                                                            <div className="flex items-center justify-between">
                                                                <div className="font-bold text-gray-900 text-sm">₹{(b.qty * group.price).toLocaleString()}</div>
                                                                <button onClick={() => removeBarcode(group.productId, b.barcode)} className="text-red-300 hover:text-red-500 p-2">
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
            </div>
        </div>

        {/* Bill Summary Right Panel */}
        <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-6 border shadow-sm sticky top-6 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 border-b pb-3 mb-4">Summary</h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm font-medium text-gray-500">
                            <span>Subtotal</span>
                            <span className="text-gray-900 font-bold">₹{subtotal.toLocaleString()}</span>
                        </div>
                        <div className="space-y-1">
                            <span className="text-sm font-medium text-gray-500">Discount (%)</span>
                            <div className="flex items-center justify-between gap-2">
                                <Input
                                  type="number"
                                  value={discount}
                                  onChange={(e) => setDiscount(Math.max(0, +e.target.value))}
                                  className="h-9 w-20 text-center font-bold"
                                />
                                <span className="text-red-500 font-bold text-sm">- ₹{discountAmount.toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-500">GST</span>
                                <Switch checked={gstEnabled} onCheckedChange={setGstEnabled} className="scale-75 origin-left" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <Input
                                  type="number"
                                  value={gstPercent}
                                  onChange={(e) => setGstPercent(Math.max(0, +e.target.value))}
                                  disabled={!gstEnabled}
                                  className={`h-9 w-20 text-center font-bold ${!gstEnabled ? 'opacity-50' : ''}`}
                                />
                                <span className={`text-gray-900 font-bold text-sm ${!gstEnabled ? 'opacity-40' : ''}`}>₹{gstAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Grand Total</span>
                                <div className="text-3xl font-bold text-indigo-600 tracking-tight">
                                    <span className="text-sm mr-0.5">₹</span>
                                    {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md border text-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-1">Items Scanned</span>
                    <span className="text-3xl font-bold text-gray-800">{items.reduce((s, g) => s + g.barcodes.length, 0)}</span>
                </div>

                <div className="space-y-3">
                    <Button onClick={handleSave} className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-md rounded-md">
                        {id ? "Update Now" : "Save Now"}
                    </Button>
                    <p className="text-[10px] text-gray-400 text-center uppercase leading-normal font-bold">
                        Please check all entries before<br/>submitting the packing slip.
                    </p>
                </div>
            </div>
        </div>
      </div>

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder="Customer name"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                placeholder="10-digit number"
                value={newCustomer.number}
                onChange={(e) => setNewCustomer({ ...newCustomer, number: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCustomer} disabled={savingCustomer} className="bg-indigo-600 text-white">
              {savingCustomer ? "Saving..." : "Add Customer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
