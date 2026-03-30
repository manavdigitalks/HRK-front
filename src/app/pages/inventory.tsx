"use client";
import { useEffect, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchInventoryItems, markSizeLost } from "@/redux/slices/stockEntrySlice";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { AlertTriangle, Printer, Download } from "lucide-react";
import { toast } from "sonner";
import bwipjs from "bwip-js";
import jsPDF from "jspdf";

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
    // Let's generate barcode on next tick
    setTimeout(() => {
        const canvas = document.getElementById('barcode-canvas-print') as HTMLCanvasElement;
        if (canvas) {
          try {
            bwipjs.toCanvas(canvas, {
              bcid: 'code128',       // Barcode type
              text: item.barcode,    // Text to encode
              scale: 5,              // Match products.tsx scale
              height: 10,            // Bar height
              includetext: false,    // Don't show the random barcode string in the image
            });
          } catch (e) {
            console.error(e);
          }
        }
    }, 100);
  };

  const handleDownload = async () => {
    const canvas = document.getElementById('barcode-canvas-print') as HTMLCanvasElement;
    if (canvas) {
        const toastId = toast.loading("Generating PDF...");
        try {
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });
            const dataUrl = canvas.toDataURL("image/png");

            const productCode = selectedItem?.product?.productCode || "";
            const seqNum = selectedItem?.sequenceNumber || "";
            const stickerWidth = 50;
            const stickerHeight = 24;
            const centerX = (210 - stickerWidth) / 2;
            const margin = 10;

            // Product Code (Top)
            pdf.setFontSize(10);
            pdf.setFont("helvetica", "bold");
            const tw = pdf.getTextWidth(productCode);
            pdf.text(productCode, centerX + (stickerWidth - tw) / 2, margin + 6);

            // Barcode Image (Middle)
            pdf.addImage(dataUrl, "PNG", centerX + 4, margin + 7, 42, 11);

            // Sequence Number (Bottom)
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            const idText = seqNum.toString();
            const idTw = pdf.getTextWidth(idText);
            pdf.text(idText, centerX + (stickerWidth - idTw) / 2, margin + 22);

            pdf.save(`${productCode}-barcode-${seqNum}-A4.pdf`);
            toast.success("PDF Downloaded", { id: toastId });
        } catch (err) {
            console.error(err);
            toast.error("Generation failed.", { id: toastId });
        }
    }
  };

  const currentPrint = () => {
     const canvas = document.getElementById('barcode-canvas-print') as HTMLCanvasElement;
     if (canvas) {
        const dataUrl = canvas.toDataURL();
        
        // Create a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = 'none';
        document.body.appendChild(iframe);

        const productCode = selectedItem?.product?.productCode || "";
        const seqNum = selectedItem?.sequenceNumber || "";

        const printContent = `
            <html>
            <head>
                <title>Label - ${selectedItem.barcode}</title>
                <style>
                    @page { size: auto; margin: 0 10mm 10mm 10mm; }
                    body { margin: 0; padding: 0; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; }
                    .sticker { 
                        width: 50mm; height: 24mm; 
                        display: flex; flex-direction: column; align-items: center; justify-content: center; 
                        box-sizing: border-box; overflow: hidden;
                        background: #fff;
                    }
                    .sku-name { font-size: 11px; font-weight: 900; text-transform: uppercase; color: #000; margin-bottom: 1.5mm; }
                    .barcode-img { width: 42mm; height: 11mm; object-fit: contain; margin-bottom: 1.5mm; }
                    .barcode-id { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #000; font-family: sans-serif; }
                </style>
            </head>
            <body onload="setTimeout(() => { window.print(); }, 300);">
                <div class="sticker">
                    <div class="sku-name">${productCode}</div>
                    <img src="${dataUrl}" class="barcode-img" />
                    <div class="barcode-id">${seqNum}</div>
                </div>
            </body>
            </html>
        `;

        const doc = iframe.contentWindow?.document;
        if (doc) {
            doc.write(printContent);
            doc.close();
            
            // Clean up the iframe after printing
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 2000);
        }
     }
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
                <canvas id="barcode-canvas-print" className="max-w-full h-auto"></canvas>
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
    </div>
  );
}
