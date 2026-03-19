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
    { header: "Product Code", accessorKey: "productCode", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600 underline decoration-indigo-200 underline-offset-4">{item.productCode}</span>
        <span className="text-[10px] text-gray-400 capitalize">{item.designNo}</span>
      </div>
    )},
    { header: "Category", accessorKey: "category", cell: (item: any) => (
      <span className="text-sm font-medium">{item.category?.name || "N/A"}</span>
    )},
    { header: "Price", accessorKey: "salePrice", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="text-green-600 font-bold">₹{item.salePrice}</span>
        <span className="text-[10px] text-gray-400 line-through">₹{item.purchasePrice}</span>
      </div>
    )},
    { header: "Sizes", accessorKey: "sizes", cell: (item: any) => (
      <div className="flex flex-wrap gap-1">
        {item.sizes?.map((s: any, i: number) => (
          <Badge key={i} variant="secondary" className="text-[9px] px-1 font-bold">{s.name}</Badge>
        ))}
      </div>
    )},
    { header: "Actions", accessorKey: "actions", cell: (item: any) => (
        <div className="flex items-center gap-1">
            <Button onClick={() => handleViewInventory(item)} variant="outline" size="icon" className="h-8 w-8 text-indigo-600" title="View Stock"><Eye className="w-4 h-4" /></Button>
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
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-gray-500">Manage your products and prices</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
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
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
                <DialogTitle>
                    {editingProduct ? "Edit Product" : "New Product"}
                </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Design No</Label>
                <Input value={formData.designNo} onChange={(e) => setFormData({...formData, designNo: e.target.value})} placeholder="e.g. DP01" />
              </div>
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. Cotton" />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label>Category</Label>
                <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category</option>
                    {categories.map((cat: any) => (<option key={cat._id} value={cat._id}>{cat.name}</option>))}
                </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})} className="pl-7" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₹</span>
                    <Input type="number" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: +e.target.value})} className="pl-7 font-bold text-indigo-600" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sizes</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {sizes.map((size: any) => (
                  <button 
                    key={size._id} 
                    type="button" 
                    onClick={() => toggleSize(size._id)} 
                    className={`px-3 py-1 text-xs font-semibold rounded-md border transition-colors ${selectedSizes.includes(size._id) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
             <Button onClick={handleSave} className="bg-indigo-600 text-white">Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INVENTORY DIALOG */}
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b flex flex-row items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <DialogTitle className="text-2xl font-bold">{selectedProduct?.productCode}</DialogTitle>
                        <Badge variant="secondary">In Stock</Badge>
                    </div>
                    <p className="text-sm text-gray-500">View available barcodes and stock details</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <Button onClick={handlePrintLabels} size="sm" className="bg-gray-900 text-white">
                        <Printer className="w-4 h-4 mr-2" /> Print Labels
                    </Button>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
                <div className="p-4 border-b flex items-center justify-between bg-white">
                    <Tabs value={inventoryTab} onValueChange={setInventoryTab} className="w-fit">
                        <TabsList>
                            <TabsTrigger value="In Stock">In Stock</TabsTrigger>
                            <TabsTrigger value="Sold">Sold</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <div className="relative w-64">
                        <Input value={inventorySearch} onChange={(e) => setInventorySearch(e.target.value)} placeholder="Search barcodes..." className="pl-9 h-9 text-sm" />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {inventoryLoading ? (
                            <div className="col-span-full py-20 text-center text-gray-400">Loading stock...</div>
                        ) : filteredInventory.length > 0 ? (
                            filteredInventory.map((item: any) => (
                                <div key={item._id} className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
                                    <div className="p-2 bg-gray-50 rounded w-full mb-3 flex justify-center">
                                        <Barcode value={item.barcode} displayText={item.sequenceNumber.toString()} />
                                    </div>
                                    <div className="text-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">#{item.sequenceNumber}</span>
                                        <p className="text-sm font-semibold">{selectedProduct?.productCode}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center py-20 text-gray-400">No stock found</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 border-t bg-white flex items-center justify-between">
                <div className="flex gap-6">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Stock Count</span>
                        <span className="text-sm font-bold">{currentInventory.length} Units</span>
                     </div>
                     <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Total Value</span>
                        <span className="text-sm font-bold text-green-600">₹{currentInventory.length * (selectedProduct?.salePrice || 0)}</span>
                     </div>
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
