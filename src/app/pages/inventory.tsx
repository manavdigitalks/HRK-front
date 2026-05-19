"use client";
import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchInventoryItems, markSizeLost, fetchBarcodeHistory } from "@/redux/slices/stockEntrySlice";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { AlertTriangle, Printer, Download, History, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Barcode } from "../components/ui/barcode";
import { printLabels, downloadLabelsPDF } from "@/lib/barcode-print-utils";

import { fetchProductDropdown } from "@/redux/slices/productSlice";
import { Combobox } from "../components/ui/combobox";

export function Inventory() {
  const dispatch = useAppDispatch();
  const { inventoryItems, inventoryLoading, inventoryPagination } = useAppSelector((state) => state.stockEntry);
  const { dropdownItems: products } = useAppSelector((state) => state.product);
  
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedSizeIds, setSelectedSizeIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  
  const [isLostModalOpen, setIsLostModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSizesToLose, setSelectedSizesToLose] = useState<string[]>([]);
  const [markingLost, setMarkingLost] = useState(false);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const openHistoryModal = async (item: any) => {
    setSelectedItem(item);
    setLoadingHistory(true);
    setIsHistoryModalOpen(true);
    try {
      const result = await dispatch(fetchBarcodeHistory(item._id)).unwrap();
      setHistoryData(result);
    } catch (err: any) {
      toast.error("Failed to load barcode history");
      setIsHistoryModalOpen(false);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    dispatch(fetchProductDropdown(""));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchInventoryItems({ 
        page: page, 
        limit: 20, 
        productId: selectedProductId, 
        sizeId: selectedSizeIds,
        search: search
    }));
  }, [dispatch, page, selectedProductId, selectedSizeIds, search]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSearchChange = useCallback((val: string) => {
      if (val === search) return;
      setSearch(val);
      setPage(1);
  }, [search]);

  const handleProductSearch = useCallback((v: string) => {
      dispatch(fetchProductDropdown(v));
  }, [dispatch]);

  const productOptions = products.map((p: any) => ({
    label: p.productCode,
    value: p._id
  }));

  const selectedProduct = products.find((p: any) => p._id === selectedProductId);
  const sizeOptions = selectedProduct ? selectedProduct.sizes.map((s: any) => ({ label: s.name, value: s._id })) : [];

  const toggleSizeFilter = (sizeId: string) => {
    setSelectedSizeIds(prev => 
      prev.includes(sizeId) ? prev.filter(id => id !== sizeId) : [...prev, sizeId]
    );
  };

  const openLostModal = (item: any) => {
    setSelectedItem(item);
    setSelectedSizesToLose([]);
    setIsLostModalOpen(true);
  };

  const openPrintModal = (item: any) => {
    setSelectedItem(item);
    setIsPrintModalOpen(true);
  };

  const handleDownload = async () => {
    if (!selectedItem) return;
    await downloadLabelsPDF([selectedItem], selectedItem.product?.productCode || "", selectedItem.sequenceNumber?.toString());
  };

  const currentPrint = async () => {
    if (!selectedItem) return;
    await printLabels([selectedItem], selectedItem.product?.productCode || "");
  };

  const handleMarkLost = async () => {
    if (selectedSizesToLose.length === 0) {
      toast.error("Please select at least one size");
      return;
    }
    setMarkingLost(true);
    try {
      await dispatch(markSizeLost({ id: selectedItem._id, sizeIds: selectedSizesToLose })).unwrap();
      toast.success("Sizes marked as lost");
      setIsLostModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to mark sizes as lost");
    } finally {
      setMarkingLost(false);
    }
  };

  const toggleSizeSelection = (sizeId: string) => {
    setSelectedSizesToLose(prev => 
      prev.includes(sizeId) ? prev.filter(id => id !== sizeId) : [...prev, sizeId]
    );
  };

  const columns = [
    { 
        header: "Seq ID", 
        accessorKey: "sequenceNumber", 
        cell: (item: any) => (
            <div className="flex flex-col">
                <span className="font-mono font-bold text-indigo-600 text-sm"># {item.sequenceNumber}</span>
                {item.isReturn && <Badge variant="outline" className="text-[8px] h-4 mt-1 bg-orange-50 text-orange-600 border-orange-100 uppercase inline-flex justify-center">Return</Badge>}
            </div>
        )
    },
    { 
        header: "Product", 
        accessorKey: "product", 
        cell: (item: any) => (
            <div className="flex flex-col">
                <span className="font-bold text-gray-800 text-sm">{item.product?.productCode}</span>
                {/* <span className="text-[10px] text-gray-500">{item.product?.designNo} - {item.product?.sku}</span> */}
            </div>
        )
    },
    { 
        header: "Available Sizes", 
        accessorKey: "availableSizes", 
        cell: (item: any) => (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
                {item.availableSizes?.length > 0 ? (
                    item.availableSizes.map((s: any, idx: number) => (
                        <Badge key={s._id || `av-${idx}`} variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200">
                            {s.name}
                        </Badge>
                    ))
                ) : (
                    <span className="italic">Out of Stock</span>
                )}
            </div>
        )
    },
    { 
        header: "Sold Sizes", 
        accessorKey: "soldSizes", 
        cell: (item: any) => {
            const initialSizes = item.initialSizes?.length > 0 ? item.initialSizes : (item.product?.sizes || []);
            const availableSizeIds = item.availableSizes?.map((s: any) => s._id) || [];
            const lostSizeIds = item.lostSizes?.map((s: any) => s._id) || [];
            
            // Sold = Initial - Available - Lost
            const soldSizes = initialSizes.filter((is: any) => !availableSizeIds.includes(is._id) && !lostSizeIds.includes(is._id));
            
            return (
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {soldSizes.length > 0 ? (
                        soldSizes.map((s: any, idx: number) => (
                            <Badge key={s._id || `sold-${idx}`} variant="outline" className="text-[9px] bg-blue-50 text-blue-600 border-blue-100">
                                {s.name}
                            </Badge>
                        ))
                    ) : (
                        <span className="text-gray-300 text-[10px]">-</span>
                    )}
                </div>
            );
        }
    },
    { 
        header: "Excluded", 
        accessorKey: "excludedSizes", 
        cell: (item: any) => {
            const productSizes = item.product?.sizes || [];
            const initialSizeIds = item.initialSizes?.map((s: any) => s._id) || [];
            
            // Excluded = Product Total - Initial
            const excludedSizes = productSizes.filter((ps: any) => !initialSizeIds.includes(ps._id));
            
            if (excludedSizes.length === 0) return <span className="text-gray-300 text-[10px]">-</span>;

            return (
                <div className="flex flex-wrap gap-1 max-w-[150px]">
                    {excludedSizes.map((s: any, idx: number) => (
                        <Badge key={s._id || `excl-${idx}`} variant="outline" className="text-[9px] bg-gray-50 text-gray-400 border-gray-200">
                            {s.name}
                        </Badge>
                    ))}
                </div>
            );
        }
    },
    { 
        header: "Lost Sizes", 
        accessorKey: "lostSizes", 
        cell: (item: any) => (
            <div className="flex flex-wrap gap-1 max-w-[150px]">
                {item.lostSizes?.length > 0 ? (
                    item.lostSizes.map((s: any, idx: number) => (
                        <Badge key={s._id || `ls-${idx}`} variant="outline" className="text-[9px] bg-red-50 text-red-600 border-red-200">
                            {s.name}
                        </Badge>
                    ))
                ) : (
                    <span className="text-gray-300 text-[10px]">-</span>
                )}
            </div>
        )
    },
    { 
        header: "Status", 
        accessorKey: "status", 
        cell: (item: any) => {
            const status = item.status;
            let color = "bg-gray-100 text-gray-600";
            if (status === "In Stock") color = "bg-emerald-100 text-emerald-700";
            if (status === "Partial") color = "bg-amber-100 text-amber-700";
            if (status === "Sold") color = "bg-blue-100 text-blue-700";
            if (status === "Reserved") color = "bg-purple-100 text-purple-700";
            
            return <Badge className={`${color} border-none font-bold uppercase text-[9px]`}>{status}</Badge>;
        }
    },
    { 
        header: "Actions", 
        accessorKey: "actions", 
        cell: (item: any) => (
            <div className="flex gap-2">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-indigo-600 border-indigo-100 hover:bg-indigo-50"
                    onClick={() => openPrintModal(item)}
                >
                    <Printer className="w-4 h-4 mr-1" /> Print
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-amber-600 border-amber-100 hover:bg-amber-50"
                    onClick={() => openHistoryModal(item)}
                >
                    <History className="w-4 h-4 mr-1" /> History
                </Button>
                {item.status !== "Sold" && item.availableSizes?.length > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-red-600 border-red-100 hover:bg-red-50"
                        onClick={() => openLostModal(item)}
                    >
                        <AlertTriangle className="w-4 h-4 mr-1" /> Mark Lost
                    </Button>
                )}
            </div>
        )
    }
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Barcode Management</h1>
          <p className="text-gray-500 text-sm">Track individual barcode sizes and status</p>
        </div>
        {(selectedProductId || selectedSizeIds.length > 0) && (
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                    setSelectedProductId("");
                    setSelectedSizeIds([]);
                }}
                className="text-red-600 border-red-100 hover:bg-red-50 font-bold"
            >
                Clear All Filters
            </Button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Product Filter</Label>
                <Combobox 
                    options={productOptions} 
                    value={selectedProductId} 
                    onChange={(v) => { setSelectedProductId(v); setSelectedSizeIds([]); setPage(1); }} 
                    onSearchChange={handleProductSearch} 
                    placeholder="Search Product..."
                />
            </div>
            
            <div className="space-y-2">
                <Label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Available Sizes</Label>
                <div className="flex flex-wrap gap-2">
                    {sizeOptions.length > 0 ? (
                        sizeOptions.map((opt: any) => {
                            const isSelected = selectedSizeIds.includes(opt.value);
                            return (
                                <Badge
                                    key={opt.value}
                                    variant="outline"
                                    className={`cursor-pointer px-4 py-1.5 text-sm font-bold transition-all border-2 ${
                                        isSelected 
                                        ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105" 
                                        : "bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:bg-indigo-50"
                                    }`}
                                    onClick={() => { toggleSizeFilter(opt.value); setPage(1); }}
                                >
                                    {opt.label}
                                </Badge>
                            );
                        })
                    ) : (
                        <p className="text-gray-300 text-sm italic py-2">Select a product to see sizes</p>
                    )}
                </div>
            </div>
        </div>
      </div>

    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <CommonDataTable
          columns={columns}
          data={inventoryItems}
          pagination={inventoryPagination}
          onPageChange={handlePageChange}
          onSearchChange={handleSearchChange}
          loading={inventoryLoading}
        />
      </div>

      <Dialog open={isLostModalOpen} onOpenChange={setIsLostModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Mark Sizes as Lost
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg border border-dashed flex items-center justify-between">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Barcode</p>
                    <p className="font-mono font-bold text-lg">{selectedItem?.barcode}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase">Product</p>
                    <p className="font-bold text-gray-800">{selectedItem?.product?.productCode}</p>
                </div>
            </div>

            <div className="space-y-3">
                <Label className="text-sm font-bold text-gray-700">Select available sizes that are lost:</Label>
                <div className="grid grid-cols-3 gap-2">
                    {selectedItem?.availableSizes?.map((size: any) => {
                        const isSelected = selectedSizesToLose.includes(size._id);
                        return (
                            <button
                                key={size._id}
                                onClick={() => toggleSizeSelection(size._id)}
                                className={`px-3 py-2 rounded-md font-bold text-sm transition-all border ${
                                    isSelected 
                                        ? "bg-red-600 border-red-600 text-white shadow-md scale-105" 
                                        : "bg-white border-gray-200 text-gray-600 hover:border-red-300 hover:bg-red-50"
                                }`}
                            >
                                {size.name}
                            </button>
                        );
                    })}
                </div>
                {selectedItem?.availableSizes?.length === 0 && (
                    <p className="text-center py-4 text-gray-400 text-sm italic">No sizes available to mark as lost.</p>
                )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsLostModalOpen(false)} className="font-bold">Cancel</Button>
            <Button 
                onClick={handleMarkLost} 
                disabled={markingLost || selectedSizesToLose.length === 0}
                className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
                {markingLost ? "Processing..." : `Mark ${selectedSizesToLose.length} Sizes Lost`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600">
                <Printer className="w-5 h-5" />
                Barcode Label
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-8 flex flex-col items-center justify-center space-y-6">
              <div className="bg-white p-6 border rounded-xl shadow-inner flex flex-col items-center">
                <Barcode value={selectedItem?.barcode} displayText={selectedItem?.sequenceNumber?.toString()} />
                <div className="mt-4 text-center border-t pt-4 w-full">
                    <p className="font-bold text-lg text-gray-900">{selectedItem?.product?.productCode}</p>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{selectedItem?.availableSizes?.map((s:any)=>s.name).join(", ")}</p>
                </div>
              </div>

              <div className="flex gap-3 w-full">
                <Button 
                    variant="outline" 
                    className="flex-1 font-bold h-11 border-indigo-100 text-indigo-600 hover:bg-indigo-50"
                    onClick={handleDownload}
                >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                </Button>
                <Button 
                    className="flex-1 font-bold h-11 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                    onClick={currentPrint}
                >
                    <Printer className="w-4 h-4 mr-2" />
                    Print Now
                </Button>
              </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-600 text-xl font-bold">
                <History className="w-5 h-5 text-indigo-600" />
                Barcode History & Lifecycle
            </DialogTitle>
          </DialogHeader>
          
          {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                  <p className="text-gray-500 text-sm">Fetching barcode lifecycle...</p>
              </div>
          ) : historyData ? (
              <div className="py-4 space-y-6">
                  {/* Summary Header Card */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-2xl border border-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Sequence / Barcode</p>
                          <h2 className="font-mono font-extrabold text-2xl text-indigo-900 mt-1">
                              #{historyData.item?.sequenceNumber} <span className="text-xs font-normal font-sans text-gray-500">({historyData.item?.barcode})</span>
                          </h2>
                          <p className="text-sm font-bold text-gray-700 mt-1">Product: <span className="text-indigo-600">{historyData.item?.product?.productCode}</span></p>
                      </div>
                      
                      <div className="flex flex-col items-start md:items-end gap-1.5">
                          <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Current Status</p>
                          {(() => {
                              const status = historyData.item?.status;
                              let color = "bg-gray-100 text-gray-600";
                              if (status === "In Stock") color = "bg-emerald-100 text-emerald-700";
                              if (status === "Partial") color = "bg-amber-100 text-amber-700";
                              if (status === "Sold") color = "bg-blue-100 text-blue-700";
                              if (status === "Reserved") color = "bg-purple-100 text-purple-700";
                              return <Badge className={`${color} border-none font-bold uppercase px-3 py-1 text-[10px]`}>{status}</Badge>;
                          })()}
                      </div>
                  </div>

                  {/* Size status summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-gray-400 uppercase">Initial Sizes</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                              {historyData.item?.initialSizes?.map((s: any) => (
                                  <Badge key={s._id} variant="outline" className="text-[9px] bg-gray-50 text-gray-600">
                                      {s.name}
                                  </Badge>
                              )) || <span className="text-xs text-gray-400 italic">None</span>}
                          </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-emerald-500 uppercase">Available Sizes</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                              {historyData.item?.availableSizes?.length > 0 ? (
                                  historyData.item.availableSizes.map((s: any) => (
                                      <Badge key={s._id} variant="outline" className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-100">
                                          {s.name}
                                      </Badge>
                                  ))
                              ) : (
                                  <span className="text-xs text-red-400 italic font-bold">Sold Out</span>
                              )}
                          </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-blue-500 uppercase">Sold Sizes</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                              {(() => {
                                  const initial = historyData.item?.initialSizes || [];
                                  const availableIds = historyData.item?.availableSizes?.map((s: any) => s._id) || [];
                                  const lostIds = historyData.item?.lostSizes?.map((s: any) => s._id) || [];
                                  const sold = initial.filter((is: any) => !availableIds.includes(is._id) && !lostIds.includes(is._id));
                                  return sold.length > 0 ? (
                                      sold.map((s: any) => (
                                          <Badge key={s._id} variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-100 font-bold">
                                              {s.name}
                                          </Badge>
                                      ))
                                  ) : (
                                      <span className="text-xs text-gray-300">-</span>
                                  );
                              })()}
                          </div>
                      </div>

                      <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-bold text-red-500 uppercase">Lost Sizes</p>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                              {historyData.item?.lostSizes?.length > 0 ? (
                                  historyData.item.lostSizes.map((s: any) => (
                                      <Badge key={s._id} variant="outline" className="text-[9px] bg-red-50 text-red-700 border-red-100">
                                          {s.name}
                                      </Badge>
                                  ))
                              ) : (
                                  <span className="text-xs text-gray-300">-</span>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Creation Source Info */}
                  <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
                          Creation / Source Information
                      </h3>
                      
                      {historyData.item?.isReturn ? (
                          /* Return inward source */
                          <div className="bg-orange-50/50 p-4 rounded-xl border border-orange-100/80 flex items-start gap-3">
                              <div className="bg-orange-100 p-2.5 rounded-lg text-orange-600">
                                  <Calendar className="w-5 h-5" />
                              </div>
                              <div className="flex-1 space-y-1">
                                  <p className="text-xs font-bold text-orange-850 uppercase tracking-wider">Inward via Customer Return</p>
                                  <div className="text-sm text-gray-600 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 mt-2">
                                      {historyData.returns?.map((ret: any, idx: number) => (
                                          <div key={ret._id || idx} className="bg-white/80 p-3 rounded-lg border border-orange-100 space-y-1 shadow-sm">
                                              <div className="flex justify-between items-center">
                                                  <span className="text-[10px] text-gray-400 font-bold uppercase">Returned Size</span>
                                                  <Badge className="bg-orange-100 hover:bg-orange-100 text-orange-700 border-none font-bold text-[10px]">{ret.size?.name}</Badge>
                                              </div>
                                              <div>
                                                  <span className="text-[10px] text-gray-400 block mt-1">Return Date</span>
                                                  <span className="font-bold text-gray-700 text-xs">{ret.returnDate ? new Date(ret.returnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span>
                                              </div>
                                          </div>
                                      ))}
                                      {(!historyData.returns || historyData.returns.length === 0) && (
                                          <p className="text-xs text-gray-500 italic">No details found. Created as return barcode.</p>
                                      )}
                                  </div>
                              </div>
                          </div>
                      ) : (
                          /* Stock entry source */
                          <div className="bg-blue-50/40 p-4 rounded-xl border border-blue-100/80 flex items-start gap-3">
                              <div className="bg-blue-100 p-2.5 rounded-lg text-blue-600 mt-1">
                                  <Calendar className="w-5 h-5" />
                              </div>
                              <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-4">
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Source Type</p>
                                      <p className="text-xs font-extrabold text-gray-700 mt-0.5">Stock Purchase In</p>
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Invoice Number</p>
                                      <p className="text-xs font-extrabold text-gray-700 mt-0.5">{historyData.item?.stockEntry?.invoiceNumber || "N/A"}</p>
                                  </div>
                                  <div>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Inward Date</p>
                                      <p className="text-xs font-extrabold text-gray-700 mt-0.5">
                                          {historyData.item?.stockEntry?.entryDate 
                                              ? new Date(historyData.item.stockEntry.entryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) 
                                              : "N/A"
                                          }
                                      </p>
                                  </div>
                                  <div className="col-span-2 sm:col-span-3 border-t border-blue-50 pt-2.5">
                                      <p className="text-[10px] font-bold text-gray-400 uppercase">Supplier</p>
                                      <p className="text-sm font-extrabold text-indigo-600 mt-0.5">
                                          {historyData.item?.stockEntry?.supplier?.name || "N/A"} 
                                          {historyData.item?.stockEntry?.supplier?.companyName && ` (${historyData.item.stockEntry.supplier.companyName})`}
                                      </p>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* Sales / Packing Slip History */}
                  <div className="space-y-3">
                      <h3 className="text-sm font-bold text-gray-800 border-b pb-2 flex items-center gap-1.5">
                          <span className="w-1.5 h-3 bg-indigo-600 rounded-full inline-block"></span>
                          Sales / Packing Slips Details
                      </h3>
                      
                      {historyData.sales && historyData.sales.length > 0 ? (
                          <div className="space-y-3">
                              {historyData.sales.map((sale: any) => (
                                  <div key={sale._id} className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm space-y-3 hover:border-indigo-100 transition-all duration-200">
                                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed pb-2">
                                          <div>
                                              <p className="text-sm font-bold text-indigo-600">
                                                  Packing Slip # {sale.billNumber}
                                              </p>
                                              <p className="text-[10px] text-gray-450 mt-0.5">
                                                  {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                                              </p>
                                          </div>
                                          <div className="text-right">
                                              <p className="text-[10px] text-gray-400 font-bold uppercase">Sold Quantity</p>
                                              <p className="text-sm font-extrabold text-gray-800">{sale.qty} Piece{sale.qty > 1 ? "s" : ""}</p>
                                          </div>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                          <div>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase">Customer Details</p>
                                              <p className="font-bold text-gray-700 mt-0.5">{sale.customer?.name || "Cash Customer"}</p>
                                              {sale.customer?.companyName && <p className="text-gray-400 text-[10px]">{sale.customer?.companyName}</p>}
                                          </div>
                                          <div>
                                              <p className="text-[10px] text-gray-400 font-bold uppercase">Sizes Sold in this Slip</p>
                                              <div className="flex flex-wrap gap-1 mt-1">
                                                  {sale.soldSizes?.map((s: any) => (
                                                      <Badge key={s._id} className="bg-blue-50 hover:bg-blue-50 text-blue-700 border border-blue-100 text-[9px] font-bold">
                                                          {s.name}
                                                      </Badge>
                                                  )) || <span className="italic text-gray-400">No size data</span>}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="bg-gray-50/50 p-6 rounded-xl border border-dashed flex flex-col items-center justify-center text-center">
                              <p className="text-gray-450 text-sm font-bold">No Packing Slip Records Found</p>
                              <p className="text-gray-400 text-[11px] mt-1">This barcode hasn't been added to any sales invoice or packing slip yet.</p>
                          </div>
                      )}
                  </div>
              </div>
          ) : (
              <div className="py-8 text-center text-red-500 font-bold">Failed to load history data.</div>
          )}

          <DialogFooter className="border-t pt-4">
              <Button onClick={() => setIsHistoryModalOpen(false)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold w-full sm:w-auto">
                  Close History
              </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
