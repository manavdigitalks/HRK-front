"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Plus, CheckCircle, X, Printer, Download, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReturns, createReturn, deleteReturn } from "@/redux/slices/returnSlice";
import { CommonDataTable } from "../components/ui/common-data-table";
import api from "@/lib/axios";
import { Barcode as BarcodeComponent } from "../components/ui/barcode";
import { Combobox } from "../components/ui/combobox";
import { printLabels, downloadLabelsPDF } from "@/lib/barcode-print-utils";

export function Returns() {
  const dispatch = useAppDispatch();
  const { returns, loading, pagination } = useAppSelector((state) => state.return);

  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [generatedBarcodes, setGeneratedBarcodes] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Format options for Combobox
  const productOptions = allProducts.map((p: any) => ({
    label: `${p.designNo} / ${p.sku} ${p.category?.name ? `(${p.category.name})` : ""} ${p.sizes?.length ? `[${p.sizes.map((s: any) => s.name).join(", ")}]` : ""}`,
    value: p._id
  }));

  // sizeQtys: { [sizeId]: qty }
  const [sizeQtys, setSizeQtys] = useState<Record<string, number>>({});
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    dispatch(fetchAllReturns({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  useEffect(() => {
    api.get("/product", { params: { limit: 200 } }).then((r) => setAllProducts(r.data.data || []));
  }, []);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllReturns({ page, limit: 10, search }));
  };

  const handleOpenDialog = () => {
    setSelectedProduct(null);
    setSizeQtys({});
    setReturnDate(new Date().toISOString().split("T")[0]);
    setIsOpen(true);
  };

  const handleProductChange = (productId: string) => {
    const p = allProducts.find((x) => x._id === productId) || null;
    setSelectedProduct(p);
    setSizeQtys({});
  };

  const toggleSize = (sizeId: string) => {
    setSizeQtys((prev) => {
      if (sizeId in prev) {
        const next = { ...prev };
        delete next[sizeId];
        return next;
      }
      return { ...prev, [sizeId]: 1 };
    });
  };

  const handleSubmit = async () => {
    const selectedSizes = Object.entries(sizeQtys).filter(([, q]) => q > 0);
    if (!selectedProduct || selectedSizes.length === 0 || !returnDate) {
      toast.error("Please select a product, at least one size, and a return date");
      return;
    }
    try {
      const result = await dispatch(
        createReturn({
          product: selectedProduct._id,
          sizes: selectedSizes.map(([size, qty]) => ({ size, qty })),
          returnDate,
        })
      ).unwrap();
      
      toast.success("Return saved successfully!");
      setGeneratedBarcodes(result.barcodes || []);
      setIsOpen(false);
      setIsSuccessOpen(true);
      dispatch(fetchAllReturns({ page: 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save return");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this return?")) return;
    try {
      await dispatch(deleteReturn(id)).unwrap();
      toast.success("Return deleted successfully");
      dispatch(fetchAllReturns({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete return");
    }
  };



  const handlePrint = async (items: any[], pCode: string) => {
    await printLabels(items, pCode);
  };

  const handleDownloadPDF = async (items: any[], pCode: string, fileNamePart: string) => {
    await downloadLabelsPDF(items, pCode, fileNamePart);
  };

  const columns = [
    {
      header: "Return Date",
      accessorKey: "returnDate",
      cell: (item: any) => new Date(item.returnDate).toLocaleDateString("en-GB"),
    },
    {
      header: "Product",
      accessorKey: "product",
      cell: (item: any) =>
        item.product ? `${item.product.productCode}` : "-",
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (item: any) => item.product?.category?.name || "-",
    },
    {
      header: "Size",
      accessorKey: "size",
      cell: (item: any) => (
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
          {item.size?.name || "-"}
        </Badge>
      ),
    },
    { header: "Qty", accessorKey: "qty", cell: (item: any) => <span className="font-bold">{item.qty}</span> },
    {
        header: "Seq #",
        accessorKey: "sequenceNumber",
        cell: (item: any) => <span className="text-xs font-mono text-gray-400">#{item.sequenceNumber}</span>
    },
    {
        header: "Actions",
        accessorKey: "actions",
        cell: (item: any) => (
            <div className="flex items-center gap-1">
                <Button 
                    onClick={() => handlePrint([item], item.product?.productCode || "")} 
                    variant="outline" size="icon" className="h-8 w-8 text-gray-600" title="Print Barcode"
                >
                    <Printer className="w-4 h-4" />
                </Button>
                <Button 
                    onClick={() => handleDownloadPDF([item], item.product?.productCode || "", item.sequenceNumber)} 
                    variant="outline" size="icon" className="h-8 w-8 text-indigo-600" title="Download Barcode"
                >
                    <Download className="w-4 h-4" />
                </Button>
                <Button 
                    onClick={() => handleDelete(item._id)} 
                    variant="outline" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-50 border-red-100" title="Delete"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
        )
    }
  ];

  const hasSelectedSizes = Object.keys(sizeQtys).length > 0;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
        </div>
        <Button onClick={handleOpenDialog} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" /> New Return
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6 text-center">
        <CommonDataTable
          columns={columns}
          data={returns}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          loading={loading}
        />
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>New Return</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Product Dropdown */}
            <div className="space-y-1">
              <Label>Product (Design No / SKU)</Label>
              <Combobox
                options={productOptions}
                value={selectedProduct?._id || ""}
                onChange={(val) => handleProductChange(val)}
                placeholder="Search Product..."
              />
            </div>

            {/* Size Buttons + Qty per size */}
            {selectedProduct && (
              <div className="space-y-3">
                <Label>Select Sizes (multiple)</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedProduct.sizes?.map((s: any) => {
                    const isSelected = s._id in sizeQtys;
                    return (
                      <button
                        key={s._id}
                        type="button"
                        onClick={() => toggleSize(s._id)}
                        className={`px-4 py-1.5 text-sm font-bold rounded-md border transition-colors ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300"
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>

                {/* Qty inputs for selected sizes */}
                {hasSelectedSizes && (
                  <div className="space-y-2">
                    {selectedProduct.sizes
                      .filter((s: any) => s._id in sizeQtys)
                      .map((s: any) => (
                        <div key={s._id} className="flex items-center gap-3">
                          <span className="w-16 text-sm font-bold text-indigo-600">{s.name}</span>
                          <Input
                            type="number"
                            min={1}
                            value={sizeQtys[s._id]}
                            onChange={(e) =>
                              setSizeQtys((prev) => ({ ...prev, [s._id]: Math.max(1, +e.target.value) }))
                            }
                            className="h-8 w-24 text-sm"
                          />
                          <span className="text-xs text-gray-400">Qty</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Date + Submit */}
            {hasSelectedSizes && (
              <>
                <div className="space-y-1">
                  <Label>Return Date</Label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold">
                  Submit Return
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mr-8">
                <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    Return Barcodes Generated
                </DialogTitle>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => handleDownloadPDF(generatedBarcodes, selectedProduct?.productCode || "", "Bulk")} 
                        variant="outline" size="sm" className="text-indigo-600 border-indigo-100"
                    >
                        <Download className="w-4 h-4 mr-2" /> Download All
                    </Button>
                    <Button 
                        onClick={() => handlePrint(generatedBarcodes, selectedProduct?.productCode || "")} 
                        size="sm" className="bg-gray-900 text-white"
                    >
                        <Printer className="w-4 h-4 mr-2" /> Print All
                    </Button>
                </div>
            </div>
          </DialogHeader>
          
          <div className="py-6 space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center justify-between">
                <div>
                   <p className="font-bold text-green-800">Return Processed!</p>
                   <p className="text-sm text-green-600">Generated {generatedBarcodes.length} new barcodes for the returned items.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsSuccessOpen(false)} className="text-green-600"><X /></Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {generatedBarcodes.map((item, idx) => {
                  const sizeName = selectedProduct?.sizes?.find((s:any) => s._id === item.sizeId)?.name || 'N/A';
                  return (
                    <div key={idx} className="bg-white border rounded-lg p-3 flex flex-col items-center shadow-sm relative group">
                        <Badge variant="outline" className="mb-2 text-[10px] font-bold bg-indigo-50 text-indigo-700 border-indigo-100">
                            SIZE: {sizeName}
                        </Badge>
                        <BarcodeComponent value={item.barcode} displayText={item.sequenceNumber?.toString()} />
                    </div>
                  );
              })}
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
