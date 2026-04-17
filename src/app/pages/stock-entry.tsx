"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchProductDropdown } from "@/redux/slices/productSlice";
import { createStockEntry, fetchAllStockEntries, deleteStockEntry, fetchStockEntryInventory } from "@/redux/slices/stockEntrySlice";
import { fetchSupplierDropdown } from "@/redux/slices/supplierSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Plus, Trash2, Eye, Download, Printer, CheckCircle, Loader2, ClipboardList, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Barcode } from "../components/ui/barcode";
import { printLabels, downloadLabelsPDF } from "@/lib/barcode-print-utils";
import api from "@/lib/axios";

const emptyForm = () => ({
  entryDate: new Date().toISOString().split('T')[0],
  supplier: "",
  invoiceNumber: "",
  product: "",
  expectedSets: 0,
  totalSets: 0,
  partialSets: [] as { sizes: string[] }[],
  linkedPendingEntryId: ""
});

import { Combobox } from "../components/ui/combobox";
import { X } from "lucide-react";

export function StockEntry() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { entries, loading, pagination } = useAppSelector((state) => state.stockEntry);
  const { dropdownItems: products } = useAppSelector((state) => state.product);
  const { dropdownOptions: suppliers } = useAppSelector((state) => state.supplier);

  // Format options for Combobox
  const supplierOptions = suppliers.map((s: any) => ({ label: s.name, value: s._id }));
  const productOptions = products.map((p: any) => ({
    label: `${p.productCode} (${p.sizes?.map((s: any) => s.name).join(", ")})`,
    value: p._id
  }));

  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<any[]>([]);
  const [viewData, setViewData] = useState<{ entry: any; items: any[] } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [formData, setFormData] = useState<any>(emptyForm());
  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);
  const [pendingEntries, setPendingEntries] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllStockEntries({ page: 1, limit: 10, search }));
    dispatch(fetchProductDropdown(""));
    dispatch(fetchSupplierDropdown(""));
  }, [dispatch]);

  const handlePageChange = useCallback((page: number) => {
    dispatch(fetchAllStockEntries({ page, limit: 10, search }));
  }, [dispatch, search]);

  const handleSearch = useCallback((val: string) => {
    if (val === search) return;
    setSearch(val);
    dispatch(fetchAllStockEntries({ page: 1, limit: 10, search: val }));
  }, [dispatch, search]);

  const handleSupplierSearch = useCallback((val: string) => {
      dispatch(fetchSupplierDropdown(val));
  }, [dispatch]);

  const handleProductSearch = useCallback((val: string) => {
      dispatch(fetchProductDropdown(val));
  }, [dispatch]);

  const handleOpen = () => {
    setFormData(emptyForm());
    setSelectedProductDetails(null);
    setIsOpen(true);
  };

  const handleProductChange = async (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProductDetails(product);
    setFormData({ ...formData, product: productId, partialSets: [], expectedSets: 0, totalSets: 0 });
    setPendingEntries([]);
    if (!productId) return;
    setLoadingPending(true);
    try {
      const res = await api.get(`/report/pending-stock-by-product/${productId}`);
      setPendingEntries(res.data.data || []);
    } catch {
      setPendingEntries([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const fillFromPendingEntry = (entry: any) => {
    setFormData((prev: any) => ({
      ...prev,
      supplier: entry.supplier?._id || prev.supplier,
      invoiceNumber: entry.invoiceNumber || prev.invoiceNumber,
      expectedSets: entry.pendingQuantity,
      totalSets: 0,
      partialSets: [],
      linkedPendingEntryId: entry._id
    }));
    toast.info(`${entry.pendingQuantity} sets pending load kiye — ab received sets daalo`);
  };

  const addPartialSetRow = () => {
    setFormData({ ...formData, partialSets: [...formData.partialSets, { sizes: [] }] });
  };

  const removePartialSetRow = (index: number) => {
    setFormData({ ...formData, partialSets: formData.partialSets.filter((_: any, i: number) => i !== index) });
  };

  const toggleSizeInPartialSet = (index: number, sizeId: string) => {
    const newPartialSets = [...formData.partialSets];
    const currentSizes = newPartialSets[index].sizes;
    if (currentSizes.includes(sizeId)) {
        newPartialSets[index].sizes = currentSizes.filter((id: string) => id !== sizeId);
    } else {
        newPartialSets[index].sizes = [...currentSizes, sizeId];
    }
    setFormData({ ...formData, partialSets: newPartialSets });
  };

  const totalActualSets = formData.totalSets + formData.partialSets.length;
  const pendingQty = Math.max(0, (formData.expectedSets || 0) - totalActualSets);
  const totalItemsCalculated = (formData.totalSets * (selectedProductDetails?.sizes?.length || 0)) + 
    formData.partialSets.reduce((acc: number, set: any) => acc + (set.sizes?.length || 0), 0);

  const handleView = async (entryId: string) => {
    setViewLoading(true);
    setIsViewOpen(true);
    try {
      const result = await dispatch(fetchStockEntryInventory(entryId)).unwrap();
      setViewData(result);
    } catch {
      toast.error("Failed to load entry");
      setIsViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };



  const handlePrintBarcodes = async (items: any[], productCode: string) => {
    await printLabels(items, productCode);
  };

  const handleDownloadPDF = async () => {
    if (!viewData) return;
    await downloadLabelsPDF(viewData.items, viewData.entry.product?.productCode || "");
  };

  const handleSave = async () => {
    if (!formData.product || (!formData.totalSets && formData.partialSets.length === 0) || !formData.supplier) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSaving(true);
    try {
      const result = await dispatch(createStockEntry(formData)).unwrap();
      toast.success("Stock entry created successfully!", { duration: 4000 });
      setGeneratedBarcodes(result.barcodes || []);
      setFormData(emptyForm());
      setSelectedProductDetails(null);
      setIsOpen(false);
      setIsSuccessOpen(true);
      dispatch(fetchAllStockEntries({ page: 1, limit: 10 }));
    } catch (err: any) {
      toast.error(err.message || "Failed to create stock entry");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will also remove all barcodes associated with this stock entry.")) {
      try {
        await dispatch(deleteStockEntry(id)).unwrap();
        toast.success("Stock entry and related barcodes removed");
        dispatch(fetchAllStockEntries({ page: pagination.currentPage, limit: 10 }));
      } catch (err: any) {
        toast.error(typeof err === 'string' ? err : (err.message || "Failed to delete"));
      }
    }
  };

  const columns = [
    { header: "Date", accessorKey: "entryDate", cell: (item: any) => (
      <span className="text-sm font-medium">{new Date(item.entryDate).toLocaleDateString('en-GB')}</span>
    )},
    { header: "Supplier", accessorKey: "supplier", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-sm">{item.supplier?.name}</span>
        <span className="text-[10px] text-gray-400">Inv: {item.invoiceNumber}</span>
      </div>
    )},
    { header: "Product", accessorKey: "product", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600">{item.product?.productCode}</span>
        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
          ({item.product?.sizes?.map((s: any) => s.name).join(", ")})
        </span>
      </div>
    )},
    { header: "Barcodes", accessorKey: "totalSets", cell: (item: any) => (
      <div className="flex flex-col gap-1">
        <Badge variant="secondary">{item.totalSets} Received</Badge>
        {item.pendingQuantity > 0 && (
          <Badge className="bg-amber-100 text-amber-700 border-amber-200">{item.pendingQuantity} Pending</Badge>
        )}
        {item.linkedPendingEntryId && (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-[9px]">↳ Linked Entry</Badge>
        )}
      </div>
    )},
    { header: "Barcode Range", accessorKey: "range", cell: (item: any) => (
      <span className="text-[11px] font-mono text-gray-500">#{item.startSequence} - #{item.endSequence}</span>
    )},
    { header: "Total PCS", accessorKey: "totalItems", cell: (item: any) => (
      <span className="font-bold text-sm">{item.totalItems} PCS</span>
    )},
    { header: "ACTIONS", accessorKey: "actions", cell: (item: any) => (
      <div className="flex items-center gap-1">
        <Button onClick={() => handleView(item._id)} variant="outline" size="icon" className="h-8 w-8 text-indigo-600" title="View & Print"><Eye className="w-4 h-4" /></Button>
        <Button onClick={() => handleDelete(item._id)} variant="outline" size="sm" className="h-8 text-red-600 border-red-100 hover:bg-red-50">
          <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
      </div>
    )}
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock In</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => router.push("/stock-entry/pending-report")} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50">
            <ClipboardList className="w-4 h-4 mr-2" /> Pending Report
          </Button>
          <Button onClick={handleOpen} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Stock In
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 text-center">
        <CommonDataTable
          columns={columns}
          data={entries}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={handleSearch}
          loading={loading}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { setFormData(emptyForm()); setSelectedProductDetails(null); } setIsOpen(o); }}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock In</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.entryDate} onChange={(e) => setFormData({...formData, entryDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} placeholder="INV-001" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Supplier</Label>
              <Combobox
                options={supplierOptions}
                value={formData.supplier}
                onChange={(val) => setFormData({...formData, supplier: val})}
                onSearchChange={handleSupplierSearch}
                placeholder="Select Supplier"
              />
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <Combobox
                options={productOptions}
                value={formData.product}
                onChange={handleProductChange}
                onSearchChange={handleProductSearch}
                placeholder="Search Product..."
              />
            </div>

            {selectedProductDetails && (
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 flex items-center justify-between">
                <div>
                  <p className="font-bold text-xs text-indigo-700">{selectedProductDetails.productCode}</p>
                  <p className="text-[10px] text-gray-400">Sizes: {selectedProductDetails.sizes?.map((s: any) => s.name).join(", ")}</p>
                </div>
                <Badge className="bg-white text-indigo-600 border-indigo-200">{selectedProductDetails.sizes?.length || 0} Sizes</Badge>
              </div>
            )}

            {loadingPending && (
              <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Checking pending stock...
              </div>
            )}

            {!loadingPending && pendingEntries.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-bold text-amber-700">
                    {pendingEntries.length} pending {pendingEntries.length === 1 ? "entry" : "entries"} found for this product
                  </span>
                </div>
                {pendingEntries.map((entry: any) => (
                  <div key={entry._id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-700">{entry.supplier?.name}</span>
                        {entry.invoiceNumber && (
                          <span className="text-[10px] text-gray-400 font-mono">Inv: {entry.invoiceNumber}</span>
                        )}
                        <span className="text-[10px] text-gray-400">{new Date(entry.entryDate).toLocaleDateString("en-GB")}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-500">Expected: <b>{entry.expectedSets}</b></span>
                        <span className="text-[11px] text-gray-500">Received: <b className="text-green-600">{entry.totalSets}</b></span>
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] h-4 px-1.5">
                          {entry.pendingQuantity} pending
                        </Badge>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 shrink-0 text-xs"
                      onClick={() => fillFromPendingEntry(entry)}
                    >
                      + Add Stock
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Sets (from factory)</Label>
                <Input type="number" min={0} value={formData.expectedSets} onChange={(e) => setFormData({...formData, expectedSets: Math.max(0, +e.target.value)})} placeholder="e.g. 100" />
              </div>
              <div className="space-y-2">
                <Label>Number of Full Sets Received</Label>
                <Input type="number" min={0} value={formData.totalSets} onChange={(e) => setFormData({...formData, totalSets: Math.max(0, +e.target.value)})} />
              </div>
            </div>

            {formData.expectedSets > 0 && (
              <div className={`p-3 rounded-md border flex items-center justify-between ${
                pendingQty > 0 ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
              }`}>
                <span className={`text-sm font-bold ${ pendingQty > 0 ? 'text-amber-700' : 'text-green-700' }`}>
                  {pendingQty > 0 ? `⚠️ ${pendingQty} sets still pending from factory` : '✅ All expected sets received'}
                </span>
                <div className="text-xs text-gray-500">
                  Expected: {formData.expectedSets} &nbsp;|&nbsp; Received: {totalActualSets}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Partial Sets</Label>
                <div className="bg-gray-100 rounded-md p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Partial Barcodes</span>
                  <span className="text-xl font-bold">{formData.partialSets.length}</span>
                </div>
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total Items</span>
                <span className="text-xl font-bold">{totalItemsCalculated} Pcs</span>
              </div>
            </div>

            {selectedProductDetails && (
                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                        <Label className="text-md font-bold">Special Barcodes (with missing sizes)</Label>
                        <Button type="button" variant="outline" size="sm" onClick={addPartialSetRow} className="text-indigo-600 border-indigo-100">
                            <Plus className="w-3 h-3 mr-1" /> Add Special Barcode
                        </Button>
                    </div>

                    {formData.partialSets.map((set: any, idx: number) => (
                        <div key={idx} className="p-4 bg-gray-50 rounded-lg border border-gray-100 relative group">
                            <button onClick={() => removePartialSetRow(idx)} className="absolute -top-2 -right-2 bg-white border rounded-full p-1 text-red-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="w-3 h-3" />
                            </button>
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Barcode #{idx + 1} - Select Sizes Available:</p>
                            <div className="flex flex-wrap gap-2">
                                {selectedProductDetails.sizes?.map((size: any) => (
                                    <button
                                        key={size._id}
                                        onClick={() => toggleSizeInPartialSet(idx, size._id)}
                                        className={`px-3 py-1 rounded text-[11px] font-bold transition-all border ${
                                            set.sizes.includes(size._id)
                                                ? "bg-indigo-600 border-indigo-600 text-white"
                                                : "bg-white border-gray-200 text-gray-400 hover:border-indigo-200"
                                        }`}
                                    >
                                        {size.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
             <Button onClick={handleSave} className="bg-indigo-600 text-white font-bold" disabled={isSaving}>
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Saving...
                 </>
               ) : (
                 "Save Stock Entry"
               )}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewOpen} onOpenChange={(o) => { setIsViewOpen(o); if (!o) setViewData(null); }}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">
                  {viewData?.entry.product?.productCode} — Inv: {viewData?.entry.invoiceNumber}
                </DialogTitle>
                <p className="text-sm text-gray-500 mt-1">
                  {viewData?.entry.supplier?.name} &nbsp;·&nbsp; {viewData && new Date(viewData.entry.entryDate).toLocaleDateString('en-GB')} &nbsp;·&nbsp;
                  Seq #{viewData?.entry.startSequence} – #{viewData?.entry.endSequence}
                </p>
                {viewData?.entry.pendingQuantity > 0 && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold px-3 py-1 rounded-full">
                    ⚠️ {viewData.entry.pendingQuantity} sets pending from factory
                    &nbsp;(Expected: {viewData.entry.expectedSets}, Received: {viewData.entry.totalSets})
                  </div>
                )}
                {viewData?.entry.linkedPendingEntryId && (
                  <div className="mt-2 inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                    ↳ Linked to entry: Inv {viewData.entry.linkedPendingEntryId.invoiceNumber || "N/A"}
                    &nbsp;· Expected: {viewData.entry.linkedPendingEntryId.expectedSets}
                    &nbsp;· Total Received: {viewData.entry.linkedPendingEntryId.totalSets}
                    &nbsp;· Remaining: {viewData.entry.linkedPendingEntryId.pendingQuantity}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
                <Button onClick={() => handlePrintBarcodes(viewData?.items || [], viewData?.entry.product?.productCode || "")} size="sm" className="bg-gray-900 text-white"><Printer className="w-4 h-4 mr-2" /> Print Labels</Button>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {viewLoading ? (
              <div className="py-20 text-center text-gray-400">Loading...</div>
            ) : viewData?.items.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {viewData.items.map((item: any) => (
                  <div key={item._id} className="bg-white border rounded-lg p-3 flex flex-col items-center shadow-sm">
                    <p className="text-xs font-bold text-gray-800 uppercase mb-2 tracking-wide">{viewData.entry.product?.productCode}</p>
                    <Barcode value={item.barcode} displayText={item.sequenceNumber.toString()} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center text-gray-400">No items found</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                Inventory Added: {generatedBarcodes.length} Barcodes Created
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
                <div>
                   <p className="font-bold text-green-800">New Stock Processed Successfully!</p>
                   <p className="text-xs text-green-600 font-bold uppercase tracking-tight">Highlighting Partial Sets (with missing sizes)</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => handlePrintBarcodes(generatedBarcodes, selectedProductDetails?.productCode || "")} 
                        variant="outline" size="sm" className="text-indigo-600 border-indigo-100"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print All
                    </Button>
                    <Button onClick={() => setIsSuccessOpen(false)} className="bg-gray-900 text-white font-bold px-8">Confirm</Button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {generatedBarcodes.map((item, idx) => (
                <div key={idx} className={`bg-white border rounded-lg p-3 flex flex-col items-center shadow-sm relative group ${item.isPartial ? 'border-amber-300 ring-1 ring-amber-100' : ''}`}>
                    {item.isPartial && (
                        <Badge className="absolute -top-2 px-2 h-4 border-none bg-amber-500 text-white text-[8px] font-bold">
                            PARTIAL
                        </Badge>
                    )}
                    <p className="text-[9px] font-bold text-gray-400 uppercase mb-2 tracking-tighter truncate w-full text-center">
                        {selectedProductDetails?.productCode}
                    </p>
                    <Barcode value={item.barcode} displayText={item.sequenceNumber?.toString()} />
                    {item.isPartial && (
                        <div className="mt-2 w-full text-[8px] text-amber-600 font-bold bg-amber-50 p-1 rounded text-center leading-tight">
                            {item.sizeNames?.join(", ")}
                        </div>
                    )}
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setIsSuccessOpen(false)} className="bg-gray-900 text-white font-bold px-8">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
