"use client";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts } from "@/redux/slices/productSlice";
import { createStockEntry, fetchAllStockEntries, deleteStockEntry, fetchStockEntryInventory } from "@/redux/slices/stockEntrySlice";
import { fetchSupplierDropdown } from "@/redux/slices/supplierSlice";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Plus, Trash2, Eye, Download, Printer } from "lucide-react";
import { toast } from "sonner";
import { CommonDataTable } from "../components/ui/common-data-table";
import { Badge } from "../components/ui/badge";
import { Barcode } from "../components/ui/barcode";
import bwipjs from "bwip-js";
import jsPDF from "jspdf";

const emptyForm = () => ({
  entryDate: new Date().toISOString().split('T')[0],
  supplier: "",
  invoiceNumber: "",
  product: "",
  totalSets: 0,
});

export function StockEntry() {
  const dispatch = useAppDispatch();
  const { entries, loading, pagination } = useAppSelector((state) => state.stockEntry);
  const { products } = useAppSelector((state) => state.product);
  const { dropdownOptions: suppliers } = useAppSelector((state) => state.supplier);

  const [isOpen, setIsOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [viewData, setViewData] = useState<{ entry: any; items: any[] } | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [formData, setFormData] = useState(emptyForm());
  const [selectedProductDetails, setSelectedProductDetails] = useState<any>(null);

  useEffect(() => {
    dispatch(fetchAllStockEntries({ page: 1, limit: 10 }));
    dispatch(fetchAllProducts({ page: 1, limit: 100 }));
    dispatch(fetchSupplierDropdown());
  }, [dispatch]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllStockEntries({ page, limit: 10 }));
  };

  const handleOpen = () => {
    setFormData(emptyForm());
    setSelectedProductDetails(null);
    setIsOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p._id === productId);
    setSelectedProductDetails(product);
    setFormData({ ...formData, product: productId });
  };

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

  const generateBarcodeImages = async (items: any[]) => {
    return Promise.all(items.map(item => new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      bwipjs.toCanvas(canvas, { bcid: "code128", text: item.barcode, scale: 5, height: 10, includetext: false });
      resolve({ barcode: item.barcode, sequenceNumber: item.sequenceNumber, dataUrl: canvas.toDataURL("image/png") });
    }))) as Promise<any[]>;
  };

  const handlePrint = async () => {
    if (!viewData) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const images = await generateBarcodeImages(viewData.items);
    const productCode = viewData.entry.product?.productCode || "";
    win.document.write(`
      <html><head><title>Labels - ${productCode}</title>
      <style>
        @page { size: A4; margin: 10mm; }
        body { margin: 0; padding: 0; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; }
        .sticker { width: 100%; max-width: 600px; text-align: center; page-break-inside: avoid; padding: 10px 0; border-bottom: 0.5px solid #eee; display: flex; flex-direction: column; align-items: center; height: 30mm; justify-content: center; }
        .sku-name { font-weight: 900; font-size: 14px; margin-bottom: 4px; text-transform: uppercase; }
        .barcode-img { width: 450px; height: 12mm; object-fit: contain; }
        .barcode-id { font-size: 12px; font-family: monospace; margin-top: 4px; font-weight: bold; }
      </style></head><body><div>
      ${images.map((img: any) => `<div class="sticker"><div class="sku-name">${productCode}</div><img src="${img.dataUrl}" class="barcode-img" /><div class="barcode-id">${img.sequenceNumber}</div></div>`).join('')}
      </div><script>window.onload=function(){setTimeout(()=>{window.print();window.close();},500);}<\/script></body></html>`);
    win.document.close();
  };

  const handleDownloadPDF = async () => {
    if (!viewData) return;
    const toastId = toast.loading("Generating PDF...");
    try {
      const images = await generateBarcodeImages(viewData.items);
      const productCode = viewData.entry.product?.productCode || "";
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPos = 15;
      images.forEach((img: any) => {
        if (yPos + 30 > pageHeight - 15) { pdf.addPage(); yPos = 15; }
        pdf.setFontSize(12); pdf.setFont("helvetica", "bold");
        const tw = pdf.getTextWidth(productCode);
        pdf.text(productCode, (pageWidth - tw) / 2, yPos);
        pdf.addImage(img.dataUrl, "PNG", (pageWidth - 80) / 2, yPos + 2, 80, 12);
        pdf.setFontSize(10); pdf.setFont("courier", "bold");
        const idText = img.sequenceNumber.toString();
        pdf.text(idText, (pageWidth - pdf.getTextWidth(idText)) / 2, yPos + 18);
        pdf.setDrawColor(230); pdf.line(30, yPos + 22, pageWidth - 30, yPos + 22);
        yPos += 27;
      });
      pdf.save(`${productCode}-${viewData.entry.invoiceNumber}.pdf`);
      toast.success("PDF Downloaded", { id: toastId });
    } catch { toast.error("Failed", { id: toastId }); }
  };

  const handleSave = async () => {
    if (!formData.product || !formData.totalSets || !formData.supplier || !formData.invoiceNumber) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      await dispatch(createStockEntry(formData)).unwrap();
      toast.success("Stock entry created and barcodes generated!");
      setFormData(emptyForm());
      setSelectedProductDetails(null);
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
      <div className="flex flex-col">
        <span className="font-bold text-indigo-600">{item.product?.productCode}</span>
        <span className="text-[10px] text-gray-500 font-medium whitespace-nowrap">
          ({item.product?.sizes?.map((s: any) => s.name).join(", ")})
        </span>
      </div>
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
        <Button onClick={handleOpen} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> Stock In
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={entries}
          pagination={pagination}
          onPageChange={handlePageChange}
          onSearchChange={() => {}}
          loading={loading}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={(o) => { if (!o) { setFormData(emptyForm()); setSelectedProductDetails(null); } setIsOpen(o); }}>
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
                {products.map((p: any) => (
                  <option key={p._id} value={p._id}>
                    {p.productCode} ({p.sizes?.map((s: any) => s.name).join(", ")})
                  </option>
                ))}
              </select>
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
              </div>
              <div className="flex gap-2">
                <Button onClick={handleDownloadPDF} variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> Download PDF</Button>
                <Button onClick={handlePrint} size="sm" className="bg-gray-900 text-white"><Printer className="w-4 h-4 mr-2" /> Print Labels</Button>
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
    </div>
  );
}
