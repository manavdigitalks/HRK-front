"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts } from "@/redux/slices/productSlice";
import { createStockEntry, fetchAllStockEntries, deleteStockEntry } from "@/redux/slices/stockEntrySlice";
import { fetchSupplierDropdown } from "@/redux/slices/supplierSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Plus, Inbox, Calendar, User, FileText, Package, Hash, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";

export function StockEntry() {
  const dispatch = useAppDispatch();
  const { entries, loading, pagination } = useAppSelector((state) => state.stockEntry);
  const { products } = useAppSelector((state) => state.product);
  const { dropdownOptions: suppliers } = useAppSelector((state) => state.supplier);
  
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    supplier: "",
    invoiceNumber: "",
    product: "",
    totalSets: 0,
  });

  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchAllStockEntries({ page: 1, limit: 10 }));
    dispatch(fetchAllProducts({ page: 1, limit: 100 }));
    dispatch(fetchSupplierDropdown());
  }, [dispatch]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllStockEntries({ page, limit: 10 }));
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProductDetails(product);
    setFormData({ ...formData, product: productId });
  };

  const handleSave = async () => {
    if (!formData.product || !formData.totalSets || !formData.supplier || !formData.invoiceNumber) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      await dispatch(createStockEntry(formData)).unwrap();
      toast.success("Stock entry created and barcodes generated!");
      setIsOpen(false);
      dispatch(fetchAllStockEntries({ page: 1, limit: 10 }));
    } catch (err: any) {
      toast.error(err.message || "Failed to create stock entry");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure? This will also remove all barcodes associated with this stock entry.")) {
        try {
            await dispatch(deleteStockEntry(id)).unwrap();
            toast.success("Stock entry and related barcodes removed");
            dispatch(fetchAllStockEntries({ page: pagination.currentPage, limit: 10 }));
        } catch (err: any) {
            toast.error(err.message || "Failed to delete");
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
      <span className="font-bold text-indigo-600">{item.product?.productCode}</span>
    )},
    { header: "Sets", accessorKey: "totalSets", cell: (item: any) => (
      <Badge variant="secondary">{item.totalSets} Sets</Badge>
    )},
    { header: "Barcode Range", accessorKey: "range", cell: (item: any) => (
      <span className="text-[11px] font-mono text-gray-500">#{item.startSequence} - #{item.endSequence}</span>
    )},
    { header: "Total PCS", accessorKey: "totalItems", cell: (item: any) => (
        <span className="font-bold text-sm">{item.totalItems} PCS</span>
    )},
    { header: "ACTIONS", accessorKey: "actions", cell: (item: any) => (
        <Button onClick={() => handleDelete(item._id)} variant="outline" size="sm" className="h-8 text-red-600 border-red-100 hover:bg-red-50">
            <Trash2 className="w-4 h-4 mr-1" /> Delete
        </Button>
    )}
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
            <h1 className="text-2xl font-bold">Stock In</h1>
            <p className="text-sm text-gray-500">Add new stock to inventory</p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-indigo-600">
          <Plus className="w-4 h-4 mr-2" /> Stock In
        </Button>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <CommonDataTable
          columns={columns}
          data={entries}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={() => {}} 
          loading={loading}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[550px]">
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
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" 
                value={formData.supplier} 
                onChange={(e) => setFormData({...formData, supplier: e.target.value})}
              >
                <option value="">Select supplier</option>
                {suppliers.map((s: any) => (<option key={s._id} value={s._id}>{s.name}</option>))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Product</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={formData.product} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">Select product</option>
                {products.map((p: any) => (<option key={p._id} value={p._id}>{p.productCode} - {p.designNo}</option>))}
              </select>
            </div>

            {selectedProductDetails && (
              <div className="p-3 bg-indigo-50 rounded-md border border-indigo-100 flex items-center justify-between">
                <div>
                   <p className="font-bold text-xs text-indigo-700">{selectedProductDetails.productCode}</p>
                   <p className="text-[10px] text-gray-400">Sizes: {selectedProductDetails.sizes?.map((s:any) => s.name).join(", ")}</p>
                </div>
                <Badge className="bg-white text-indigo-600 border-indigo-200">{selectedProductDetails.sizes?.length || 0} Sizes</Badge>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Number of Sets</Label>
                <Input type="number" value={formData.totalSets} onChange={(e) => setFormData({...formData, totalSets: +e.target.value})} />
              </div>
              <div className="bg-gray-100 rounded-md p-3 flex flex-col justify-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Total Items</span>
                <span className="text-xl font-bold">{formData.totalSets * (selectedProductDetails?.sizes?.length || 0)} Pcs</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} className="bg-indigo-600 text-white">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
