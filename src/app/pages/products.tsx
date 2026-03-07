"use client";
import { useEffect, useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllProducts, createProduct, updateProduct, deleteProduct } from "@/redux/slices/productSlice";
import { fetchAllSizeMasters } from "@/redux/slices/sizeMasterSlice";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import bwipjs from "bwip-js";

function BarcodeImage({ barcode }: { barcode: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (barcode && canvasRef.current) {
      try {
        bwipjs.toCanvas(canvasRef.current, {
          bcid: 'code128',
          text: barcode,
          scale: 1,
          height: 6,
          includetext: false,
        });
      } catch (e) {
        console.error('Barcode error:', e);
      }
    }
  }, [barcode]);

  return <canvas ref={canvasRef} />;
}

export function Products() {
  const dispatch = useAppDispatch();
  const { products, loading } = useAppSelector((state) => state.product);
  const { sizeMasters } = useAppSelector((state) => state.sizeMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    purchasePrice: 0,
    salePrice: 0,
    barcode: "",
  });
  const [selectedSizes, setSelectedSizes] = useState<any>({});
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllSizeMasters());
  }, [dispatch]);

  useEffect(() => {
    if (formData.barcode && barcodeCanvasRef.current) {
      try {
        bwipjs.toCanvas(barcodeCanvasRef.current, {
          bcid: 'code128',
          text: formData.barcode,
          scale: 2,
          height: 8,
          includetext: false,
        });
      } catch (e) {
        console.error('Barcode generation error:', e);
      }
    }
  }, [formData.barcode]);

  const generateSKU = (name: string) => {
    const prefix = name.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(100 + Math.random() * 900);
    return `${prefix}${timestamp}${random}`;
  };

  const generateBarcode = () => {
    return Date.now().toString() + Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAdd = () => {
    setEditingProduct(null);
    const barcode = generateBarcode();
    setFormData({
      name: "",
      sku: "",
      category: "",
      purchasePrice: 0,
      salePrice: 0,
      barcode: barcode,
    });
    setSelectedSizes({});
    setIsOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      barcode: product.barcode,
    });
    
    const sizesObj: any = {};
    product.sizes?.forEach((s: any) => {
      sizesObj[s.size._id || s.size] = { checked: true, quantity: s.quantity };
    });
    setSelectedSizes(sizesObj);
    setIsOpen(true);
  };

  const handleNameChange = (name: string) => {
    const sku = name ? generateSKU(name) : "";
    const barcode = sku ? generateBarcode() : "";
    setFormData({...formData, name, sku, barcode});
  };

  const toggleSize = (sizeId: string) => {
    setSelectedSizes({
      ...selectedSizes,
      [sizeId]: selectedSizes[sizeId]?.checked 
        ? { ...selectedSizes[sizeId], checked: false }
        : { checked: true, quantity: 0 }
    });
  };

  const updateQuantity = (sizeId: string, quantity: number) => {
    setSelectedSizes({
      ...selectedSizes,
      [sizeId]: { ...selectedSizes[sizeId], quantity }
    });
  };

  const handleSave = async () => {
    try {
      const sizes = Object.keys(selectedSizes)
        .filter(sizeId => selectedSizes[sizeId]?.checked)
        .map(sizeId => ({
          size: sizeId,
          quantity: selectedSizes[sizeId].quantity || 0
        }));

      const data = { ...formData, sizes };

      if (editingProduct) {
        await dispatch(updateProduct({ id: editingProduct._id, data })).unwrap();
        toast.success("Product updated!");
      } else {
        await dispatch(createProduct(data)).unwrap();
        toast.success("Product created!");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save product");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteProduct(id)).unwrap();
      toast.success("Product deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage product inventory</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Products ({products.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-gray-500">No products found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">SKU</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Barcode</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Purchase Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sale Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Sizes</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => (
                    <tr key={product._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-semibold">{product.name}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.sku}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <BarcodeImage barcode={product.barcode} />
                        </div>
                      </td>
                      <td className="py-3 px-4">{product.category}</td>
                      <td className="py-3 px-4">₹{product.purchasePrice}</td>
                      <td className="py-3 px-4 font-medium">₹{product.salePrice}</td>
                      <td className="py-3 px-4">
                        {product.sizes?.length > 0 ? (
                          <div className="text-xs">
                            {product.sizes.map((s: any, i: number) => (
                              <span key={i} className="inline-block bg-gray-100 px-2 py-1 rounded mr-1 mb-1">
                                {s.size?.name || s.size}: {s.quantity}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400">No sizes</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button onClick={() => handleEdit(product)} variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button onClick={() => handleDelete(product._id)} variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-[90vw] max-w-[1600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <DialogTitle className="text-2xl">{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <p className="text-sm text-gray-500 mt-1">Fill in the product details below</p>
              </div>
            </div>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-6 px-1">
            <div className="space-y-6">
              {/* Product Information Section */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Product Name <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.name} 
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="Enter product name"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">SKU <span className="text-xs text-gray-500">(Auto-generated)</span></Label>
                    <Input 
                      value={formData.sku} 
                      disabled 
                      className="bg-gray-100 h-11 font-mono"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Barcode <span className="text-xs text-gray-500">(Auto-generated)</span></Label>
                    <div className="flex gap-2">
                      <Input 
                        value={formData.barcode} 
                        disabled 
                        className="bg-gray-100 h-11 font-mono flex-1"
                      />
                      <div className="flex items-center justify-center border-2 border-gray-300 rounded-lg px-2 py-1 bg-white">
                        <canvas ref={barcodeCanvasRef} style={{maxWidth: '80px', height: 'auto'}} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Category</h3>
                
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Category <span className="text-red-500">*</span></Label>
                    <Input 
                      value={formData.category} 
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      placeholder="e.g., Shirts, Sarees, Jeans"
                      className="h-11"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Purchase Price <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input 
                        type="number" 
                        value={formData.purchasePrice} 
                        onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})}
                        placeholder="0.00"
                        className="h-11 pl-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sale Price <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                      <Input 
                        type="number" 
                        value={formData.salePrice} 
                        onChange={(e) => setFormData({...formData, salePrice: +e.target.value})}
                        placeholder="0.00"
                        className="h-11 pl-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Sizes Section */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Size & Stock Management</h3>
                
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-indigo-50">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 w-24">Select</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700">Size Name</th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-gray-700 w-48">Stock Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sizeMasters.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-8 px-6 text-center">
                            <div className="text-gray-400">
                              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">No sizes available</p>
                              <p className="text-xs mt-1">Please create sizes in Size Master first</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sizeMasters.map((size: any, index: number) => (
                          <tr key={size._id} className={`border-t hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                            <td className="py-4 px-6">
                              <input
                                type="checkbox"
                                checked={selectedSizes[size._id]?.checked || false}
                                onChange={() => toggleSize(size._id)}
                                className="w-5 h-5 cursor-pointer accent-indigo-600"
                              />
                            </td>
                            <td className="py-4 px-6">
                              <div>
                                <span className="font-semibold text-gray-900">{size.name}</span>
                                {size.description && (
                                  <span className="text-sm text-gray-500 ml-2">({size.description})</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <Input
                                type="number"
                                value={selectedSizes[size._id]?.quantity || 0}
                                onChange={(e) => updateQuantity(size._id, +e.target.value)}
                                disabled={!selectedSizes[size._id]?.checked}
                                className="w-full h-10"
                                min="0"
                                placeholder="Enter quantity"
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex gap-3">
            <Button 
              onClick={() => setIsOpen(false)} 
              variant="outline" 
              className="flex-1 h-11"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              className="flex-1 h-11 bg-indigo-600 hover:bg-indigo-700"
            >
              {editingProduct ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
