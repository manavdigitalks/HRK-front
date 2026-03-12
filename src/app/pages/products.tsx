"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from "@/redux/slices/productSlice";
import { fetchSizeDropdown } from "@/redux/slices/sizeMasterSlice";
import { fetchCategoryDropdown } from "@/redux/slices/categoryMasterSlice";
import { fetchProductInventory } from "@/redux/slices/stockEntrySlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Eye, Printer, Search, Trash2, Edit, Download } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Barcode } from "../components/ui/barcode";
import bwipjs from "bwip-js";
import jsPDF from "jspdf";

export function Products() {
  const dispatch = useAppDispatch();
  const { products, loading, pagination } = useAppSelector((state) => state.product);
  const { currentInventory, inventoryLoading } = useAppSelector((state) => state.stockEntry);
  
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [inventoryTab, setInventoryTab] = useState("In Stock");
  const [inventorySearch, setInventorySearch] = useState("");

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    designNo: "",
    sku: "",
    category: "",
    purchasePrice: 0,
    salePrice: 0,
  });
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 10, search }));
    dispatch(fetchCategoryDropdown()).unwrap().then(setCategories);
    dispatch(fetchSizeDropdown()).unwrap().then(setSizes);
  }, [dispatch, search]);

  useEffect(() => {
    if (selectedProduct && isInventoryOpen) {
      dispatch(fetchProductInventory({ productId: selectedProduct._id, status: inventoryTab }));
    }
  }, [dispatch, selectedProduct, isInventoryOpen, inventoryTab]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllProducts({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setFormData({ designNo: "", sku: "", category: "", purchasePrice: 0, salePrice: 0 });
    setSelectedSizes([]);
    setIsOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      designNo: product.designNo,
      sku: product.sku,
      category: product.category?._id || product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
    });
    setSelectedSizes(product.sizes?.map((s: any) => s._id || s) || []);
    setIsOpen(true);
  };

  const handleViewInventory = (product: any) => {
    setSelectedProduct(product);
    setInventoryTab("In Stock");
    setIsInventoryOpen(true);
  };

  const toggleSize = (sizeId: string) => {
    if (selectedSizes.includes(sizeId)) {
      setSelectedSizes(selectedSizes.filter(id => id !== sizeId));
    } else {
      setSelectedSizes([...selectedSizes, sizeId]);
    }
  };

  const handleSave = async () => {
    if (!formData.designNo || !formData.sku || !formData.category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const data = { ...formData, sizes: selectedSizes };
      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct._id, data })).unwrap();
        toast.success("Product updated!");
      } else {
        await dispatch(createProduct(data)).unwrap();
        toast.success("Product created!");
      }
      setIsOpen(false);
      dispatch(fetchAllProducts({ page: pagination.currentPage, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await dispatch(deleteProduct(id)).unwrap();
        toast.success("Product deleted!");
        dispatch(fetchAllProducts({ page: pagination.currentPage, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product");
      }
    }
  };

  const generateBarcodeImages = async () => {
    return Promise.all(
        currentInventory.map(item => {
          return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            bwipjs.toCanvas(canvas, {
              bcid: "code128",
              text: item.barcode, // We still scan the random barcode for uniqueness
              scale: 5,
              height: 10,
              includetext: false,
            });
            resolve({ 
                barcode: item.barcode, 
                sequenceNumber: item.sequenceNumber, 
                dataUrl: canvas.toDataURL("image/png") 
            });
          });
        })
    ) as Promise<any[]>;
  };

  const handlePrintLabels = async () => {
    const win = window.open("", "_blank");
    if (!win) return;

    const barcodeImages = await generateBarcodeImages();

    win.document.write(`
      <html>
        <head>
          <title>Labels - ${selectedProduct?.productCode}</title>
          <style>
            @page { size: A4; margin: 10mm; }
            body { 
                margin: 0; padding: 0; font-family: sans-serif; background: #fff;
                display: flex; flex-direction: column; align-items: center;
            }
            .grid { 
                width: 100%; display: flex; flex-direction: column; align-items: center; gap: 5px;
            }
            .sticker { 
                width: 100%; max-width: 600px; text-align: center; page-break-inside: avoid;
                padding: 10px 0; border-bottom: 0.5px solid #eee; display: flex; flex-direction: column; align-items: center;
                height: 30mm; justify-content: center;
            }
            .sku-name { font-weight: 900; font-size: 14px; margin-bottom: 4px; text-transform: uppercase; }
            .barcode-img { width: 450px; height: 12mm; object-fit: contain; }
            .barcode-id { font-size: 12px; font-family: monospace; margin-top: 4px; font-weight: bold; }
            @media print {
                .sticker { border-bottom: 0.5px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="grid">
            ${barcodeImages.map((img: any) => `
              <div class="sticker">
                <div class="sku-name">${selectedProduct?.productCode}</div>
                <img src="${img.dataUrl}" class="barcode-img" />
                <div class="barcode-id">${img.sequenceNumber}</div>
              </div>
            `).join('')}
          </div>
          <script>
            window.onload = function() { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    const toastId = toast.loading("Generating Document...");
    try {
        const barcodeImages = await generateBarcodeImages();
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPos = 15;
        const itemHeight = 30;

        barcodeImages.forEach((img) => {
            if (yPos + itemHeight > pageHeight - 15) {
                pdf.addPage();
                yPos = 15;
            }

            // SKU Text
            pdf.setFontSize(12);
            pdf.setFont("helvetica", "bold");
            const textWidth = pdf.getTextWidth(selectedProduct?.productCode || "");
            pdf.text(selectedProduct?.productCode || "", (pageWidth - textWidth) / 2, yPos);

            // Barcode Image - Further reduced width
            const imgWidth = 80; 
            const imgHeight = 12;
            pdf.addImage(img.dataUrl, "PNG", (pageWidth - imgWidth) / 2, yPos + 2, imgWidth, imgHeight);

            // Display Sequence Number instead of random barcode string
            pdf.setFontSize(10);
            pdf.setFont("courier", "bold");
            const idText = img.sequenceNumber.toString();
            const idWidth = pdf.getTextWidth(idText);
            pdf.text(idText, (pageWidth - idWidth) / 2, yPos + 18);

            // Separator
            pdf.setDrawColor(230);
            pdf.line(30, yPos + 22, pageWidth - 30, yPos + 22);

            yPos += 27;
        });

        pdf.save(`${selectedProduct?.productCode}.pdf`);
        toast.success("PDF Downloaded", { id: toastId });
    } catch (err) {
        console.error(err);
        toast.error("Generation failed.");
    }
  };

  const columns = [
    { header: "PRODUCT CODE / DESIGN", accessorKey: "productCode", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-4">{item.productCode}</span>
        <span className="text-[10px] text-gray-400 capitalize">{item.designNo}</span>
      </div>
    )},
    { header: "CATEGORY", accessorKey: "category", cell: (item: any) => (
      <span className="text-sm font-medium">{item.category?.name || "N/A"}</span>
    )},
    { header: "PRICING", accessorKey: "salePrice", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="text-green-600 font-bold">₹{item.salePrice}</span>
        <span className="text-[10px] text-gray-400 line-through">₹{item.purchasePrice}</span>
      </div>
    )},
    { header: "SIZES", accessorKey: "sizes", cell: (item: any) => (
      <div className="flex flex-wrap gap-1">
        {item.sizes?.map((s: any, i: number) => (
          <Badge key={i} variant="secondary" className="text-[9px] px-1 font-bold">{s.name}</Badge>
        ))}
      </div>
    )},
    { header: "ACTIONS", accessorKey: "actions", cell: (item: any) => (
        <div className="flex items-center gap-1">
            <Button onClick={() => handleViewInventory(item)} variant="outline" size="icon" className="h-8 w-8 text-indigo-600" title="View Inventory"><Eye className="w-4 h-4" /></Button>
            <Button onClick={() => handleEdit(item)} variant="outline" size="icon" className="h-8 w-8 text-amber-600" title="Edit"><Edit className="w-4 h-4" /></Button>
            <Button onClick={() => handleDelete(item._id)} variant="outline" size="icon" className="h-8 w-8 text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></Button>
        </div>
    )}
  ];

  const filteredInventory = currentInventory.filter(item => 
    item.barcode.toLowerCase().includes(inventorySearch.toLowerCase()) || 
    item.sequenceNumber.toString().includes(inventorySearch)
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-black tracking-tighter uppercase">Product Master</h1>
            <p className="text-[10px] text-gray-400 font-black tracking-[0.2em] uppercase">Inventory & Identity Engine</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 font-bold px-6 h-11 rounded-xl shadow-lg shadow-indigo-100 italic transition-all hover:scale-105 active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> CREATE NEW DESIGN
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <CommonDataTable
          columns={columns}
          data={products}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
        />
      </div>

      {/* CONFIG DIALOG */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 pb-0">
                <DialogTitle className="text-2xl font-black tracking-tighter italic uppercase text-indigo-900 leading-none">
                    {editingProduct ? "Update Mapping" : "Initialize Pattern"}
                </DialogTitle>
                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mt-2 px-1">Configure Product Identity Specs</p>
          </DialogHeader>
          
          <div className="p-8 pt-6 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Design Reference</Label>
                <Input value={formData.designNo} onChange={(e) => setFormData({...formData, designNo: e.target.value})} placeholder="e.g. DP01" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold" />
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SKU Tag</Label>
                <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. Cotton" className="h-12 bg-gray-50/50 border-gray-100 rounded-xl focus:ring-4 focus:ring-indigo-50 font-bold" />
              </div>
            </div>
            
            <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Classification Category</Label>
                <select className="flex h-12 w-full rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2 text-sm font-bold focus:ring-4 focus:ring-indigo-50 outline-none" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="">SELECT CATEGORY</option>
                    {categories.map((cat: any) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Purchase Cost</Label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})} className="h-12 bg-gray-50/50 border-gray-100 rounded-xl pl-8 font-bold" />
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Listing Price</Label>
                <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 font-black text-xs">₹</span>
                    <Input type="number" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: +e.target.value})} className="h-12 bg-indigo-50/30 border-indigo-100 rounded-xl pl-8 font-black text-indigo-600 focus:ring-indigo-100" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Size Distribution</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {sizes.map((size: any) => (
                  <button key={size._id} type="button" onClick={() => toggleSize(size._id)} className={`px-5 py-2 text-[10px] font-black rounded-full border transition-all duration-300 active:scale-95 ${selectedSizes.includes(size._id) ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-100 -translate-y-1" : "bg-white text-gray-400 border-gray-100 hover:border-indigo-200"}`}>
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="p-8 bg-gray-50/50 flex gap-4">
             <Button variant="ghost" onClick={() => setIsOpen(false)} className="flex-1 h-12 rounded-xl text-gray-400 font-bold uppercase text-[10px] tracking-widest">Discard</Button>
             <Button onClick={handleSave} className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 rounded-xl font-black text-[10px] uppercase tracking-widest text-white">Commit Configuration</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* INVENTORY DIALOG */}
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
            <DialogHeader className="p-8 border-b bg-white flex flex-row items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-3xl font-black tracking-tighter italic uppercase text-gray-900">{selectedProduct?.productCode}</DialogTitle>
                        <Badge variant="outline" className="h-5 px-2 text-[8px] font-black uppercase text-indigo-400 bg-indigo-50/50 border-indigo-100">Live Master</Badge>
                    </div>
                    <p className="text-[10px] text-gray-400 font-black tracking-[0.25em] uppercase mt-2">Sequential Identity Cluster Map</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={handleDownloadPDF} variant="outline" size="sm" className="h-11 font-black text-[10px] uppercase tracking-widest px-8 rounded-xl border-gray-200 hover:bg-gray-50 transition-all active:scale-95">
                        <Download className="w-4 h-4 mr-2" /> Export Map
                    </Button>
                    <Button onClick={handlePrintLabels} size="sm" className="bg-gray-900 text-white h-11 font-black text-[10px] uppercase tracking-widest px-8 rounded-xl shadow-xl shadow-gray-200 transition-all hover:translate-y-[-2px] active:scale-95">
                        <Printer className="w-4 h-4 mr-2" /> Sync Print
                    </Button>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50/30">
                <div className="p-6 border-b flex items-center justify-between bg-white px-8">
                    <Tabs value={inventoryTab} onValueChange={setInventoryTab} className="w-fit">
                        <TabsList className="bg-gray-100 p-1 rounded-xl h-10">
                            <TabsTrigger value="In Stock" className="text-[10px] font-black uppercase rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600">Stock Ready</TabsTrigger>
                            <TabsTrigger value="Sold" className="text-[10px] font-black uppercase rounded-lg px-8 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-400">Archive Log</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-80">
                        <Input value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Filter by System ID or Hash..." className="pl-10 h-10 text-[11px] font-bold bg-gray-50/50 border-none rounded-xl focus:bg-white transition-all shadow-inner" />
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 scrollbar-hide">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 pb-20">
                        {inventoryLoading ? (
                            <div className="col-span-full py-40 text-center">
                                <div className="text-[11px] font-black text-gray-300 animate-pulse tracking-[0.4em] uppercase italic">Decrypting Cluster...</div>
                            </div>
                        ) : filteredInventory.length > 0 ? (
                            filteredInventory.map((item: any) => (
                                <div key={item._id} className="group border-none bg-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_50px_rgba(79,70,229,0.12)] hover:-translate-y-2 transition-all duration-500 flex flex-col items-center">
                                    <div className="p-5 bg-gray-50/50 rounded-2xl w-full flex flex-col items-center border border-gray-50 group-hover:bg-indigo-50/20 transition-colors">
                                        <Barcode value={item.barcode} displayText={item.sequenceNumber.toString()} className="w-full grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                    </div>
                                    <div className="mt-6 text-center w-full">
                                        <div className="flex items-center justify-center gap-2 mb-1">
                                            <div className={`w-1.5 h-1.5 rounded-full ${inventoryTab === 'In Stock' ? 'bg-indigo-500' : 'bg-gray-200'}`}></div>
                                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{item.sequenceNumber}</span>
                                        </div>
                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tighter truncate group-hover:text-indigo-600 transition-colors">{selectedProduct?.productCode}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-40">
                                <p className="text-xs font-black text-gray-200 uppercase tracking-[0.5em] italic">Cluster.Empty();</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-6 border-t bg-white flex items-center justify-between px-10">
                <div className="flex gap-8">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase underline decoration-gray-100 mb-1">Total Payload</span>
                        <span className="text-sm font-black text-gray-900">{currentInventory.length} UNITS</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-300 uppercase underline decoration-gray-100 mb-1">Market Valuation</span>
                        <span className="text-sm font-black text-emerald-500">₹{currentInventory.length * (selectedProduct?.salePrice || 0)}</span>
                     </div>
                </div>
                <p className="text-[8px] font-black text-gray-200 uppercase tracking-[0.4em] font-mono">HRK_CLUSTER_SYSTEM_STABLE_V12</p>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
