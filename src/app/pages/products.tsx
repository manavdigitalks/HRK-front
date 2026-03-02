"use client";
import { useState } from "react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Search, Plus, Edit, Trash2, Package, Barcode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";

const mockProducts = [
  { id: 1, name: "Cotton Shirt", sku: "CS-001", category: "Shirts", purchasePrice: 400, salePrice: 599, barcode: "8901234567890", sizes: [{size: "M", stock: 20}, {size: "L", stock: 25}], image: "👕" },
  { id: 2, name: "Silk Saree", sku: "SS-002", category: "Sarees", purchasePrice: 1800, salePrice: 2499, barcode: "8901234567891", sizes: [{size: "Free Size", stock: 12}], image: "🥻" },
  { id: 3, name: "Designer Kurti", sku: "DK-003", category: "Kurtis", purchasePrice: 600, salePrice: 899, barcode: "8901234567892", sizes: [{size: "S", stock: 10}, {size: "M", stock: 18}], image: "👗" },
];

const availableSizes = ["S", "M", "L", "XL", "XXL", "Free Size"];

export function Products() {
  const [products, setProducts] = useState(mockProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", sku: "", category: "", purchasePrice: 0, salePrice: 0, barcode: "", sizes: [{size: "M", stock: 0}], image: "📦" });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAdd = () => {
    setEditingProduct(null);
    const newBarcode = `890${Date.now().toString().slice(-10)}`;
    setFormData({ name: "", sku: "", category: "", purchasePrice: 0, salePrice: 0, barcode: newBarcode, sizes: [{size: "M", stock: 0}], image: "📦" });
    setIsOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData(product);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingProduct) {
      setProducts(products.map(p => p.id === editingProduct.id ? { ...formData, id: p.id } : p));
      toast.success("Product updated!");
    } else {
      setProducts([...products, { ...formData, id: Date.now() }]);
      toast.success("Product added!");
    }
    setIsOpen(false);
  };

  const addSize = () => {
    setFormData({...formData, sizes: [...formData.sizes, {size: "M", stock: 0}]});
  };

  const removeSize = (index: number) => {
    setFormData({...formData, sizes: formData.sizes.filter((_, i) => i !== index)});
  };

  const updateSize = (index: number, field: string, value: any) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = {...newSizes[index], [field]: value};
    setFormData({...formData, sizes: newSizes});
  };

  const getTotalStock = (product: any) => {
    return product.sizes?.reduce((sum: number, s: any) => sum + s.stock, 0) || 0;
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
    toast.success("Product deleted!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search products by name or SKU..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-indigo-100 rounded-lg flex items-center justify-center text-3xl">
                  {product.image}
                </div>
                <Badge variant={getTotalStock(product) < 20 ? "destructive" : "default"}>
                  {getTotalStock(product)} in stock
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
              <p className="text-sm text-gray-500 mb-1">{product.sku}</p>
              <div className="flex items-center text-xs text-gray-500 mb-2">
                <Barcode className="w-3 h-3 mr-1" />
                {product.barcode}
              </div>
              <p className="text-lg font-bold text-indigo-600 mb-4">₹{product.salePrice}</p>
              <div className="flex items-center space-x-2">
                <Button onClick={() => handleEdit(product)} variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button onClick={() => handleDelete(product.id)} variant="outline" size="sm">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No products found</p>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>SKU</Label>
                <Input value={formData.sku} onChange={(e) => setFormData({...formData, sku: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Purchase Price</Label>
                <Input type="number" value={formData.purchasePrice} onChange={(e) => setFormData({...formData, purchasePrice: +e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Sale Price</Label>
                <Input type="number" value={formData.salePrice} onChange={(e) => setFormData({...formData, salePrice: +e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input value={formData.barcode} disabled />
            </div>
            <div className="space-y-2">
              <Label>Size Mapping</Label>
              {formData.sizes.map((sizeItem, index) => (
                <div key={index} className="flex gap-2">
                  <Select value={sizeItem.size} onValueChange={(val) => updateSize(index, 'size', val)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSizes.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Stock" value={sizeItem.stock} onChange={(e) => updateSize(index, 'stock', +e.target.value)} />
                  <Button type="button" variant="ghost" size="icon" onClick={() => removeSize(index)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addSize}>
                <Plus className="w-4 h-4 mr-2" /> Add Size
              </Button>
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingProduct ? "Update" : "Add"} Product
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
