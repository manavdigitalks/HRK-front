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
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Plus, Eye, Printer, Trash2, Edit, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Barcode } from "../components/ui/barcode";
import { printLabels, downloadLabelsPDF } from "@/lib/barcode-print-utils";

import { Combobox } from "../components/ui/combobox";

export function Products() {
  const dispatch = useAppDispatch();
  const { products, loading, pagination } = useAppSelector((state) => state.product);
  const { currentInventory, inventoryLoading } = useAppSelector((state) => state.stockEntry);
  
  const { dropdownItems: categories } = useAppSelector((state) => state.categoryMaster);
  const { dropdownItems: sizes } = useAppSelector((state) => state.sizeMaster);

  // Format options for Combobox
  const categoryOptions = categories.map((cat: any) => ({ label: cat.name, value: cat._id }));
  
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [inventoryTab, setInventoryTab] = useState("In Stock");

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
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAllProducts({ page: 1, limit: 10, search }));
    dispatch(fetchCategoryDropdown(""));
    dispatch(fetchSizeDropdown(""));
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



    if (formData.salePrice <= 0) {
      toast.error("Sale price must be greater than zero");
      return;
    }

    if (selectedSizes.length === 0) {
      toast.error("Please select at least one size");
      return;
    }

    setIsSaving(true);
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
    } finally {
      setIsSaving(false);
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



  const handlePrintLabels = async () => {
    await printLabels(currentInventory, selectedProduct?.productCode || "");
  };

  const handleDownloadPDF = async () => {
    await downloadLabelsPDF(currentInventory, selectedProduct?.productCode || "");
  };

  const columns = [
    { header: "Product Code", accessorKey: "productCode", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600 decoration-indigo-200 underline-offset-4">{item.productCode}</span>
        {/* <span className="text-[10px] text-gray-400 capitalize">{item.designNo}</span> */}
      </div>
    )},
    { header: "Category", accessorKey: "category", cell: (item: any) => (
      <span className="text-sm font-medium">{item.category?.name || "N/A"}</span>
    )},
    { header: "Price", accessorKey: "salePrice", cell: (item: any) => (
      <div className="flex flex-col">
        <span className="text-green-600 font-bold">₹{item.salePrice}</span>
        {/* <span className="text-[10px] text-gray-400 line-through">₹{item.purchasePrice}</span> */}
      </div>
    )},
    { header: "Sizes", accessorKey: "sizes", cell: (item: any) => (
      <div className="flex flex-wrap gap-1">
        {item.sizes?.map((s: any, i: number) => (
            <div key={i} className="flex flex-col items-center">
                <Badge 
                    variant={s.count === 0 ? "destructive" : "secondary"} 
                    className={`text-[9px] px-1 font-bold ${s.count === 0 ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100" : "bg-indigo-50 text-indigo-700 border-indigo-100"}`}
                >
                {s.name} : {s.count ?? 0}
                </Badge>
                {/* {s.lostQty > 0 && (
                    <span className="text-[8px] font-bold text-red-500 uppercase mt-0.5">Lost: {s.lostQty}</span>
                )} */}
            </div>
        ))}
      </div>
    )},
    { header: "Stock Status", accessorKey: "inventory", cell: (item: any) => (
        <div className="flex flex-col gap-1">
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none text-[10px] w-fit font-bold">
                Avail. Pcs: {item.totalInStock || 0}
            </Badge>
            <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none text-[10px] w-fit font-bold">
                Reserved: {item.totalReserved || 0}
            </Badge>
            <div className="text-[11px] font-bold text-indigo-600 mt-1 uppercase tracking-tight">
                Avail. Sets: {item.availableSets || 0}
            </div>
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


  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
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
                <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} placeholder="e.g. Color" />
              </div>
            </div>
            
            <div className="space-y-2">
                <Label>Category</Label>
                <Combobox
                  options={categoryOptions}
                  value={formData.category}
                  onChange={(val) => setFormData({...formData, category: val})}
                  onSearchChange={(val) => dispatch(fetchCategoryDropdown(val))}
                  placeholder="Select Category"
                />
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
             <Button onClick={handleSave} className="bg-indigo-600 text-white" disabled={isSaving}>
               {isSaving ? (
                 <>
                   <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                   Saving...
                 </>
               ) : (
                 "Save Product"
               )}
             </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* INVENTORY DIALOG */}
      <Dialog open={isInventoryOpen} onOpenChange={setIsInventoryOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
            <DialogHeader className="p-6 border-b">
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl font-bold">{selectedProduct?.productCode}</DialogTitle>
                    <p className="text-sm text-gray-500 mt-1">Sizes: {selectedProduct?.sizes?.map((s:any) => s.name).join(", ")}</p>
                  </div>
                  <div className="flex gap-2">
                      <Button onClick={handleDownloadPDF} variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" /> Download PDF
                      </Button>
                      <Button onClick={handlePrintLabels} size="sm" className="bg-gray-900 text-white">
                          <Printer className="w-4 h-4 mr-2" /> Print Labels
                      </Button>
                  </div>
                </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
                <div className="p-3 border-b bg-white mb-4">
                    <Tabs value={inventoryTab} onValueChange={setInventoryTab}>
                        <TabsList>
                            <TabsTrigger value="In Stock">In Stock</TabsTrigger>
                            <TabsTrigger value="Sold">Sold</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {inventoryLoading ? (
                        <div className="col-span-full py-20 text-center text-gray-400">Loading stock...</div>
                    ) : currentInventory.length > 0 ? (
                        currentInventory.map((item: any) => (
                            <div key={item._id} className="bg-white border rounded-lg p-3 flex flex-col items-center shadow-sm relative group">
                                {item.status === "Partial" && (
                                    <Badge className="absolute -top-2 -right-2 bg-amber-500 text-[8px] h-4 px-1 border-none shadow-sm z-10">Partial</Badge>
                                )}
                                <p className="text-xs font-bold text-gray-800 uppercase mb-2 tracking-wide">{selectedProduct?.productCode}</p>
                                <Barcode value={item.barcode} displayText={item.sequenceNumber.toString()} />
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full text-center py-20 text-gray-400">No stock found</div>
                    )}
                </div>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
