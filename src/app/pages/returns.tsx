"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Search, RotateCcw, Plus, Edit, Trash2, Scan, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

const mockReturns = [
  { id: "RET-001", invoice: "INV-1234", barcode: "8901234567890", product: "Cotton Shirt", customer: "Rajesh Kumar", amount: "₹2,540", date: "2024-01-15", status: "Pending", refundMode: "Cash" },
  { id: "RET-002", invoice: "INV-1235", barcode: "8901234567891", product: "Silk Saree", customer: "Priya Sharma", amount: "₹1,200", date: "2024-01-14", status: "Completed", refundMode: "Adjust" },
];

const mockBills = [
  { id: "INV-1234", date: "2024-01-10", items: [{barcode: "8901234567890", product: "Cotton Shirt", price: 2540}] },
  { id: "INV-1235", date: "2024-01-12", items: [{barcode: "8901234567891", product: "Silk Saree", price: 1200}] },
];

export function Returns() {
  const [returns, setReturns] = useState(mockReturns);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [formData, setFormData] = useState({ id: "", invoice: "", barcode: "", product: "", customer: "", amount: "", date: "", status: "Pending", refundMode: "Cash" });
  const [barcodeInput, setBarcodeInput] = useState("");
  const [verifiedItem, setVerifiedItem] = useState<any>(null);

  const verifyBarcode = () => {
    for (const bill of mockBills) {
      const item = bill.items.find(i => i.barcode === barcodeInput);
      if (item) {
        setVerifiedItem({ ...item, invoice: bill.id, date: bill.date });
        setFormData({
          ...formData,
          invoice: bill.id,
          barcode: item.barcode,
          product: item.product,
          amount: `₹${item.price}`
        });
        toast.success("Item verified!");
        return;
      }
    }
    toast.error("Item not found in any invoice!");
  };

  const handleAdd = () => {
    setEditingReturn(null);
    setVerifiedItem(null);
    setBarcodeInput("");
    setFormData({ id: `RET-${String(returns.length + 1).padStart(3, '0')}`, invoice: "", barcode: "", product: "", customer: "", amount: "", date: new Date().toISOString().split('T')[0], status: "Pending", refundMode: "Cash" });
    setIsOpen(true);
  };

  const handleEdit = (ret: any) => {
    setEditingReturn(ret);
    setFormData(ret);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingReturn) {
      setReturns(returns.map(r => r.id === editingReturn.id ? formData : r));
      toast.success("Return updated!");
    } else {
      setReturns([...returns, formData]);
      toast.success("Return created!");
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setReturns(returns.filter(r => r.id !== id));
    toast.success("Return deleted!");
  };

  const filteredReturns = returns.filter(
    (ret) =>
      ret.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ret.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Manage product returns</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Return
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search returns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Returns ({filteredReturns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Return ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Refund</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((ret) => (
                  <tr key={ret.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{ret.id}</td>
                    <td className="py-3 px-4">{ret.invoice}</td>
                    <td className="py-3 px-4">{ret.product}</td>
                    <td className="py-3 px-4">{ret.customer}</td>
                    <td className="py-3 px-4 font-medium">{ret.amount}</td>
                    <td className="py-3 px-4">{ret.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{ret.refundMode}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={ret.status === "Completed" ? "default" : "secondary"}>
                        {ret.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(ret)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(ret.id)} variant="ghost" size="sm">
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReturn ? "Edit Return" : "New Return"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Return ID</Label>
              <Input value={formData.id} disabled />
            </div>
            <div className="space-y-2">
              <Label>Scan Barcode</Label>
              <div className="flex gap-2">
                <Input 
                  placeholder="Scan product barcode" 
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && verifyBarcode()}
                />
                <Button type="button" onClick={verifyBarcode}>
                  <Scan className="w-4 h-4" />
                </Button>
              </div>
            </div>
            {verifiedItem && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Item Verified</span>
                </div>
                <div className="text-sm space-y-1">
                  <p><strong>Invoice:</strong> {verifiedItem.invoice}</p>
                  <p><strong>Product:</strong> {verifiedItem.product}</p>
                  <p><strong>Date:</strong> {verifiedItem.date}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Input value={formData.invoice} disabled />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Input value={formData.product} disabled />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input value={formData.amount} disabled />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Refund Mode</Label>
                <select 
                  className="w-full border rounded-md p-2" 
                  value={formData.refundMode} 
                  onChange={(e) => setFormData({...formData, refundMode: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="Adjust">Adjust in Next Purchase</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingReturn ? "Update" : "Create"} Return
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
