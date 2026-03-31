"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCustomerDropdown, createCustomer } from "@/redux/slices/customerSlice";
import { scanBarcode, createBilling, updateBilling, fetchBillingById, fetchReservedItems } from "@/redux/slices/billingSlice";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { Save, Scan, Receipt, ChevronDown, ChevronUp, Trash2, ArrowLeft, UserPlus, PackageSearch } from "lucide-react";
import { useRouter } from "next/navigation";
import { Switch } from "./ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Combobox } from "./ui/combobox";

export function BillingForm({ id }: { id?: string }) {
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { dropdownItems: customers } = useAppSelector((state) => state.customer);

    const customerOptions = [
        { label: "Walk-in Customer", value: "walk-in" },
        ...customers.map((c: any) => ({
            label: `${c.name} ${c.number ? `(${c.number})` : ""}`,
            value: c._id
        }))
    ];

    const [items, setItems] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState("");
    const [barcodeInput, setBarcodeInput] = useState("");
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [discount, setDiscount] = useState(0);
    const [gstEnabled, setGstEnabled] = useState(false);
    const [gstPercent, setGstPercent] = useState(18);
    const [loading, setLoading] = useState(false);
    const [addCustomerOpen, setAddCustomerOpen] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: "", number: "" });
    const [savingCustomer, setSavingCustomer] = useState(false);
    const [reservedItems, setReservedItems] = useState<any[]>([]);
    const [selectedReservations, setSelectedReservations] = useState<string[]>([]);
    const [autoScanEnabled, setAutoScanEnabled] = useState(true);

    useEffect(() => {
        if (!addCustomerOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [addCustomerOpen]);

    useEffect(() => {
        dispatch(fetchCustomerDropdown(""));
        if (id) {
            setLoading(true);
            dispatch(fetchBillingById(id)).unwrap().then((bill: any) => {
                const grouped: any[] = [];
                bill.items.forEach((item: any) => {
                    const prodId = item.product?._id || item.product;
                    const existing = grouped.find(g => g.productId === prodId);
                    const barcodeObj = {
                        barcode: item.barcode,
                        sequenceNumber: item.sequenceNumber,
                        qty: item.qty,
                        availableSizes: item.product?.availableSizes || [],
                        soldSizes: item.soldSizes?.map((s: any) => s._id || s) || [],
                        originalQty: item.originalQty || item.qty
                    };
                    if (existing) {
                        existing.barcodes.push(barcodeObj);
                    } else {
                        grouped.push({
                            productId: prodId,
                            productName: item.productName,
                            price: item.price,
                            isExpanded: false,
                            sizes: item.product?.sizes || [],
                            barcodes: [barcodeObj]
                        });
                    }
                });
                setItems(grouped);
                setSelectedCustomer(bill.customer?._id || bill.customer);
                setGstEnabled(bill.gstEnabled || false);
                setGstPercent(bill.gstPercent || 0);
                setDiscount(bill.discountPercent || 0);

                // Load existing reservations from the bill
                if (bill.fulfilledReservations?.length) {
                    const existingRes = bill.fulfilledReservations;
                    setReservedItems(existingRes);
                    setSelectedReservations(existingRes.map((r: any) => r._id));
                }

                setLoading(false);
            }).catch(() => {
                toast.error("Failed to load billing");
                router.push("/billing");
            });
        }
    }, [dispatch, id, router]);

    useEffect(() => {
        if (selectedCustomer && selectedCustomer !== "walk-in") {
            dispatch(fetchReservedItems(selectedCustomer)).unwrap().then((fetched) => {
                setReservedItems(prev => {
                    const filteredPrev = prev.filter(i => (i.customer?._id || i.customer) === selectedCustomer);
                    const map = new Map();
                    filteredPrev.forEach(i => map.set(i._id, i));
                    fetched.forEach((i: any) => map.set(i._id, i));
                    return Array.from(map.values());
                });
                
                // If this is a new bill (no 'id'), select all by default
                if (!id) {
                    setSelectedReservations(fetched.map((i: any) => i._id));
                }
            });
        } else {
            setReservedItems([]);
            if (!id) setSelectedReservations([]);
        }
    }, [selectedCustomer, dispatch, id]);

    const handleAddCustomer = async () => {
        if (!newCustomer.name || !newCustomer.number) return;
        setSavingCustomer(true);
        try {
            const created = await dispatch(createCustomer(newCustomer)).unwrap();
            setSelectedCustomer(created._id);
            setAddCustomerOpen(false);
            toast.success("Customer added!");
        } catch { toast.error("Failed"); } finally { setSavingCustomer(false); }
    };

    const handleScan = React.useCallback(async () => {
        if (!barcodeInput) return;
        if (!selectedCustomer) {
            toast.error("Please select a customer first");
            inputRef.current?.focus();
            return;
        }
        try {
            // Check if already in current list to avoid unnecessary API calls
            const alreadyAdded = items.flatMap(g => g.barcodes.map((b: any) => b.barcode)).includes(barcodeInput);
            if (alreadyAdded) {
                toast.warning("Already added");
                setBarcodeInput("");
                return;
            }

            const result = await dispatch(scanBarcode({
                barcode: barcodeInput,
                customerId: selectedCustomer,
                selectedReservations: selectedReservations,
            })).unwrap();

            // Auto-select reservation if product matches an unselected one
            const matchingReservation = reservedItems.find(r => r.product?._id === result.productId);
            if (matchingReservation && !selectedReservations.includes(matchingReservation._id)) {
                setSelectedReservations(prev => [...prev, matchingReservation._id]);
            }

            const existingGroup = items.find(i => i.productId === result.productId);
            if ((existingGroup?.barcodes.length || 0) >= result.availableQuota) {
                toast.error(`Availability Limit for ${result.productName}.`);
                setBarcodeInput(""); return;
            }

            const newBarcodeObj = {
                barcode: result.barcode,
                sequenceNumber: result.sequenceNumber,
                qty: result.availableSizes?.length || 1,
                availableSizes: result.availableSizes || [],
                soldSizes: result.availableSizes?.map((s: any) => s._id) || [],
                originalQty: result.availableSizes?.length || 1
            };

            if (existingGroup) {
                setItems([
                    { ...existingGroup, isExpanded: true, barcodes: [...existingGroup.barcodes, newBarcodeObj] },
                    ...items.filter(group => group.productId !== result.productId)
                ]);
            } else {
                setItems([{
                    productId: result.productId, productName: result.productName, price: result.price,
                    isExpanded: true, sizes: result.sizes || [], barcodes: [newBarcodeObj]
                }, ...items]);
            }
            setBarcodeInput("");
            inputRef.current?.focus();
            toast.success(`Added ${result.productName}`);
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : (err.message || "Error"));
            setBarcodeInput("");
        }
    }, [barcodeInput, selectedCustomer, selectedReservations, items, reservedItems, dispatch, inputRef]);

    // Auto-scan effect
    useEffect(() => {
        if (autoScanEnabled && barcodeInput && barcodeInput.length >= 2) {
            const timer = setTimeout(() => {
                handleScan();
            }, 600); // 600ms debounce for manual typing comfort
            return () => clearTimeout(timer);
        }
    }, [barcodeInput, handleScan, autoScanEnabled]);

    const toggleExpand = (productId: string) => {
        setItems(prev => prev.map(item => 
            item.productId === productId ? { ...item, isExpanded: !item.isExpanded } : item
        ));
    };

    const removeGroup = (productId: string) => setItems(prev => prev.filter((item) => item.productId !== productId));
    
    const removeBarcode = (productId: string, barcode: string) => setItems(prev => prev.map(group => {
        if (group.productId === productId) return { ...group, barcodes: group.barcodes.filter((b: any) => b.barcode !== barcode) };
        return group;
    }).filter(group => group.barcodes.length > 0));

    const toggleSoldSize = (productId: string, barcode: string, sizeId: string) => {
        setItems(prevItems => {
            const newItems = prevItems.map(group => {
                if (group.productId === productId) {
                    return {
                        ...group,
                        barcodes: group.barcodes.map((b: any) => {
                            if (b.barcode !== barcode) return b;
                            const currentSold = b.soldSizes || [];
                            const newSold = currentSold.includes(sizeId) 
                                ? currentSold.filter((id: string) => id !== sizeId) 
                                : [...currentSold, sizeId];
                            return { ...b, soldSizes: newSold, qty: newSold.length };
                        })
                    };
                }
                return group;
            });
            return newItems;
        });
    };

    const subtotal = items.reduce((sum, g) => sum + g.barcodes.reduce((gs: number, b: any) => gs + (b.qty * g.price), 0), 0);
    const discountAmount = (subtotal * discount) / 100;
    const afterDiscount = subtotal - discountAmount;
    const gstAmount = gstEnabled ? (afterDiscount * gstPercent / 100) : 0;
    const total = afterDiscount + gstAmount;

    const handleSave = async () => {
        if (!selectedCustomer) { toast.error("Choose customer"); return; }
        if (items.length === 0) { toast.error("Add items"); return; }

        const flattened = items.flatMap(g => g.barcodes.map((b: any) => ({
            product: g.productId, productName: g.productName, barcode: b.barcode, sequenceNumber: b.sequenceNumber,
            qty: b.qty, soldSizes: b.soldSizes, originalQty: b.originalQty, price: g.price, total: b.qty * g.price
        })));

        for (const item of flattened) {
            if (!item.soldSizes?.length) { toast.error(`Select sizes for ID: ${item.sequenceNumber}`); return; }
        }

        try {
            const billingData = {
                customer: selectedCustomer === "walk-in" ? null : selectedCustomer,
                items: flattened, subtotal, discountPercent: discount,
                gstEnabled, gstPercent, totalAmount: total, fulfilledReservationIds: selectedReservations
            };

            if (id) {
                await dispatch(updateBilling({ id, data: billingData })).unwrap();
                toast.success("Packing Slip Updated!");
                router.push("/billing");
            } else {
                const result = await dispatch(createBilling(billingData)).unwrap();
                toast.success("Packing Slip Saved!");
                // Redirect to list with print trigger
                router.push(`/billing?print=true&id=${result._id}`);
            }
        } catch (err: any) {
            toast.error(typeof err === 'string' ? err : (err.message || "Failed to save record"));
        }
    };

    if (loading) return <div className="p-20 text-center font-bold text-gray-400 animate-pulse uppercase">Loading...</div>;

    return (
        <div className="p-4 lg:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white p-5 rounded-lg border shadow-sm gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push("/billing")}><ArrowLeft className="w-5 h-5 text-gray-500" /></Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Packing Slip" : "Add Packing Slip"}</h1>
                        <p className="text-gray-500 text-sm">Scan and manage dispatch</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg border shadow-sm">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold">Select Customer</Label>
                            <div className="flex gap-2">
                                <Combobox options={customerOptions} value={selectedCustomer} onChange={setSelectedCustomer} onSearchChange={(v) => dispatch(fetchCustomerDropdown(v))} className="flex-1" />
                                <Button variant="outline" size="icon" className="h-11 w-11" onClick={() => setAddCustomerOpen(true)}><UserPlus className="w-4 h-4" /></Button>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-bold">Job Scan / Barcode</Label>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold uppercase ${autoScanEnabled ? "text-indigo-600" : "text-gray-400"}`}>Auto-Scan</span>
                                    <Switch checked={autoScanEnabled} onCheckedChange={setAutoScanEnabled} className="scale-75" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Input 
                                    ref={inputRef}
                                    placeholder="Scan Job Card or Barcode..."
                                    className="h-11 text-lg font-bold border-indigo-200 focus:ring-indigo-500"
                                    value={barcodeInput} 
                                    onChange={(e) => setBarcodeInput(e.target.value)} 
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan()} 
                                    autoFocus
                                />
                                <Button onClick={handleScan} className="bg-indigo-600 h-11 text-white hover:bg-indigo-700 px-6"><Scan className="w-4 h-4 mr-2" /> Scan</Button>
                            </div>
                        </div>
                    </div>

                    {reservedItems.length > 0 && (
                        <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest flex items-center gap-2">
                                    <PackageSearch className="w-4 h-4 text-amber-500" />
                                    Active Order Booking Reservations
                                </p>
                                <Badge className="bg-amber-200 text-amber-900 border-amber-300 hover:bg-amber-200">{reservedItems.length} Reserved</Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {reservedItems.map((b, idx) => {
                                    const selected = selectedReservations.includes(b._id);
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => setSelectedReservations(prev => selected ? prev.filter(i => i !== b._id) : [...prev, b._id])}
                                            className={`relative p-3 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${selected
                                                    ? "bg-amber-100 border-amber-400 shadow-sm ring-1 ring-amber-400"
                                                    : "bg-white border-gray-200 opacity-60 hover:opacity-100 hover:border-amber-200"
                                                }`}
                                        >
                                            {selected && (
                                                <div className="absolute top-1 right-1 bg-amber-600 rounded-full p-0.5">
                                                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">order form</div>
                                            <div className="flex justify-between items-center gap-2">
                                                <span className={`font-bold truncate ${selected ? "text-amber-900" : "text-gray-900"}`}>{b.product?.productCode}</span>
                                                <Badge className={`${selected ? "bg-amber-600" : "bg-gray-200"} text-white text-[10px] h-5 px-1.5`}>{b.totalSets}S</Badge>
                                            </div>
                                            <div className="mt-1.5 flex flex-wrap gap-1">
                                                {b.product?.sizes?.map((s: any, sIdx: number) => (
                                                    <span
                                                        key={sIdx}
                                                        className={`px-1 rounded-[4px] text-[8px] font-bold border ${selected
                                                                ? "bg-amber-200 border-amber-300 text-amber-900"
                                                                : "bg-gray-100 border-gray-200 text-gray-400"
                                                            }`}
                                                    >
                                                        {s.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b font-bold text-gray-600">
                                <tr><th className="p-3 w-10">#</th><th className="p-3 text-left">Product</th><th className="p-3 text-center">Rate</th><th className="p-3 text-center">Sets</th><th className="p-3 text-center">Total</th><th className="p-3 text-right"></th></tr>
                            </thead>
                            <tbody className="divide-y">
                                {items.length === 0 ? <tr><td colSpan={6} className="p-20 text-center text-gray-300 font-bold"><Receipt className="w-10 h-10 mx-auto mb-2 opacity-30" /> No products scanned</td></tr> : items.map((g, i) => (
                                    <React.Fragment key={g.productId}>
                                        <tr>
                                            <td className="p-3 text-center font-medium text-gray-400">{i + 1}</td>
                                            <td className="p-3 font-bold flex items-center gap-2">
                                                <button onClick={() => toggleExpand(g.productId)}>{g.isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
                                                {g.productName}
                                            </td>
                                            <td className="p-3 text-center">₹{g.price}</td>
                                            <td className="p-3 text-center"><Badge variant="outline">{g.barcodes.length} Sets</Badge></td>
                                            <td className="p-3 text-center font-bold text-indigo-700">₹{g.barcodes.reduce((s: number, b: any) => s + (b.qty * g.price), 0).toLocaleString()}</td>
                                            <td className="p-3 text-right"><Button variant="ghost" size="icon" className="text-red-300" onClick={() => removeGroup(g.productId)}><Trash2 size={16} /></Button></td>
                                        </tr>
                                        {g.isExpanded && (
                                            <tr className="bg-gray-50/50"><td colSpan={6} className="p-5">
                                                <div className="space-y-3 border-l-2 border-indigo-100 pl-4">
                                                    {g.barcodes.map((b: any) => (
                                                        <div key={b.barcode} className="space-y-2">
                                                            <div className="grid grid-cols-4 items-center bg-white p-3 rounded border border-gray-100 shadow-sm transition-all hover:border-indigo-200">
                                                                <span className="font-bold text-indigo-600">ID: {b.sequenceNumber}</span>
                                                                <div className="text-center"><Badge className="bg-indigo-50 text-indigo-600 border-indigo-100">{b.qty} PCS</Badge></div>
                                                                <div className="text-center text-gray-400">₹{g.price}</div>
                                                                <div className="flex items-center justify-between font-bold">₹{(b.qty * g.price).toLocaleString()}<Button variant="ghost" size="icon" className="h-6 w-6 text-red-200" onClick={() => removeBarcode(g.productId, b.barcode)}><Trash2 size={14} /></Button></div>
                                                            </div>
                                                            <div className="bg-indigo-50/20 p-3 rounded border border-indigo-50 ml-6">
                                                                <span className="text-[10px] font-bold text-indigo-400 uppercase block mb-2">Select Sizes to Dispatch:</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {(b.availableSizes?.length ? b.availableSizes : g.sizes).map((s: any) => {
                                                                        const isSold = b.soldSizes?.includes(s._id);
                                                                        return <button key={s._id} onClick={() => toggleSoldSize(g.productId, b.barcode, s._id)} className={`px-4 py-1.5 rounded text-[11px] font-bold border transition-all ${isSold ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-gray-200 text-gray-400 hover:border-indigo-100"}`}>{s.name}</button>
                                                                    })}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td></tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg border shadow-sm sticky top-6 space-y-4">
                        <h3 className="font-bold text-gray-900 border-b pb-2">Order Summary</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">₹{subtotal.toLocaleString()}</span></div>
                            <div className="flex items-center justify-between gap-4">
                                <span>Discount %</span>
                                <Input type="number" className="h-8 w-16 text-center" value={discount} onChange={(e) => setDiscount(+e.target.value)} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2"><span>GST</span><Switch checked={gstEnabled} onCheckedChange={setGstEnabled} /></div>
                                <Input type="number" className="h-8 w-16 text-center" value={gstPercent} onChange={(e) => setGstPercent(+e.target.value)} disabled={!gstEnabled} />
                            </div>
                        </div>
                        <div className="pt-4 border-t flex justify-between items-baseline"><span className="text-xs font-bold text-gray-400 uppercase">Grand Total</span><span className="text-3xl font-bold text-indigo-600">₹{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                        <div className="bg-gray-50 p-4 rounded text-center"><span className="text-[10px] font-bold text-gray-400 uppercase block">Total Barcodes</span><span className="text-2xl font-bold">{items.reduce((s, g) => s + g.barcodes.length, 0)}</span></div>
                        <Button onClick={handleSave} className="w-full h-12 bg-indigo-600 font-bold text-white rounded">Save Record</Button>
                    </div>
                </div>
            </div>

            <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-1"><Label>Name</Label><Input value={newCustomer.name} onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Number</Label><Input value={newCustomer.number} onChange={(e) => setNewCustomer({ ...newCustomer, number: e.target.value })} /></div>
                    </div>
                    <DialogFooter><Button onClick={handleAddCustomer} className="bg-indigo-600 text-white" disabled={savingCustomer}>{savingCustomer ? "Wait..." : "Save Customer"}</Button></DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
