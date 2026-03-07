"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllStocks, createStock, updateStock, deleteStock } from "@/redux/slices/stockSlice";

export function StockEntry() {
  const dispatch = useAppDispatch();
  const { stocks, loading } = useAppSelector((state) => state.stock);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formData, setFormData] = useState({ 
    entryDate: new Date().toISOString().split('T')[0], 
    supplier: "", 
    invoiceNumber: "", 
    items: [], 
    totalAmount: 0, 
    status: "Pending" 
  });

  useEffect(() => {
    dispatch(fetchAllStocks());
  }, [dispatch]);

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({ 
      entryDate: new Date().toISOString().split('T')[0], 
      supplier: "", 
      invoiceNumber: "", 
      items: [], 
      totalAmount: 0, 
      status: "Pending" 
    });
    setIsOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData({
      entryDate: entry.entryDate?.split('T')[0] || "",
      supplier: entry.supplier,
      invoiceNumber: entry.invoiceNumber,
      items: entry.items,
      totalAmount: entry.totalAmount,
      status: entry.status
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingEntry) {
        await dispatch(updateStock({ id: editingEntry._id, data: formData })).unwrap();
        toast.success("Entry updated!");
      } else {
        await dispatch(createStock(formData)).unwrap();
        toast.success("Entry created!");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save entry");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteStock(id)).unwrap();
      toast.success("Entry deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete entry");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Stock Entry</h1>
          <p className="text-gray-600 mt-1">Add new stock to inventory</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Stock Entries ({stocks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((entry: any) => (
                  <tr key={entry._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{entry.entryDate?.split('T')[0]}</td>
                    <td className="py-3 px-4">{entry.supplier}</td>
                    <td className="py-3 px-4 font-medium">{entry.invoiceNumber}</td>
                    <td className="py-3 px-4 font-medium">₹{entry.totalAmount}</td>
                    <td className="py-3 px-4">
                      <Badge variant={entry.status === "Completed" ? "default" : "secondary"}>
                        {entry.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(entry)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(entry._id)} variant="ghost" size="sm">
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
            <DialogTitle>{editingEntry ? "Edit Stock Entry" : "New Stock Entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Entry Date</Label>
              <Input type="date" value={formData.entryDate} onChange={(e) => setFormData({...formData, entryDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={formData.invoiceNumber} onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Total Amount</Label>
              <Input type="number" value={formData.totalAmount} onChange={(e) => setFormData({...formData, totalAmount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingEntry ? "Update" : "Create"} Entry
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
