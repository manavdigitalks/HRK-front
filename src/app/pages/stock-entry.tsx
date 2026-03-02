"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Save, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";

const mockEntries = [
  { id: 1, date: "2024-01-15", supplier: "ABC Textiles", invoice: "INV-001", items: 5, total: 25000, status: "Completed" },
  { id: 2, date: "2024-01-14", supplier: "XYZ Fabrics", invoice: "INV-002", items: 3, total: 15000, status: "Pending" },
];

export function StockEntry() {
  const [entries, setEntries] = useState(mockEntries);
  const [isOpen, setIsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [formData, setFormData] = useState({ date: "", supplier: "", invoice: "", items: 0, total: 0, status: "Pending" });

  const handleAdd = () => {
    setEditingEntry(null);
    setFormData({ date: new Date().toISOString().split('T')[0], supplier: "", invoice: "", items: 0, total: 0, status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (entry: any) => {
    setEditingEntry(entry);
    setFormData(entry);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingEntry) {
      setEntries(entries.map(e => e.id === editingEntry.id ? { ...formData, id: e.id } : e));
      toast.success("Entry updated!");
    } else {
      setEntries([...entries, { ...formData, id: Date.now() }]);
      toast.success("Entry created!");
    }
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    setEntries(entries.filter(e => e.id !== id));
    toast.success("Entry deleted!");
  };

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
          <CardTitle>All Stock Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Supplier</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{entry.date}</td>
                    <td className="py-3 px-4">{entry.supplier}</td>
                    <td className="py-3 px-4 font-medium">{entry.invoice}</td>
                    <td className="py-3 px-4">{entry.items}</td>
                    <td className="py-3 px-4 font-medium">₹{entry.total}</td>
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
                        <Button onClick={() => handleDelete(entry.id)} variant="ghost" size="sm">
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
              <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Input value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Invoice Number</Label>
              <Input value={formData.invoice} onChange={(e) => setFormData({...formData, invoice: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Items</Label>
                <Input type="number" value={formData.items} onChange={(e) => setFormData({...formData, items: +e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <Input type="number" value={formData.total} onChange={(e) => setFormData({...formData, total: +e.target.value})} />
              </div>
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
