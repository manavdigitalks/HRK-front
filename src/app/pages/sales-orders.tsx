"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Search, Eye, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

const mockOrders = [
  { id: "SO-001", customer: "Rajesh Kumar", items: 5, amount: "₹12,540", date: "2024-01-15", status: "Completed" },
  { id: "SO-002", customer: "Priya Sharma", items: 3, amount: "₹6,980", date: "2024-01-15", status: "Pending" },
  { id: "SO-003", customer: "Amit Patel", items: 8, amount: "₹15,200", date: "2024-01-14", status: "Completed" },
];

export function SalesOrders() {
  const [orders, setOrders] = useState(mockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [formData, setFormData] = useState({ id: "", customer: "", items: 0, amount: "", date: "", status: "Pending" });

  const handleAdd = () => {
    setEditingOrder(null);
    setFormData({ id: `SO-${String(orders.length + 1).padStart(3, '0')}`, customer: "", items: 0, amount: "", date: new Date().toISOString().split('T')[0], status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (order: any) => {
    setEditingOrder(order);
    setFormData(order);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingOrder) {
      setOrders(orders.map(o => o.id === editingOrder.id ? formData : o));
      toast.success("Order updated!");
    } else {
      setOrders([...orders, formData]);
      toast.success("Order created!");
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setOrders(orders.filter(o => o.id !== id));
    toast.success("Order deleted!");
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sales Orders</h1>
          <p className="text-gray-600 mt-1">View and manage sales orders</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search orders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Order ID</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{order.id}</td>
                    <td className="py-3 px-4">{order.customer}</td>
                    <td className="py-3 px-4">{order.items}</td>
                    <td className="py-3 px-4 font-medium">{order.amount}</td>
                    <td className="py-3 px-4">{order.date}</td>
                    <td className="py-3 px-4">
                      <Badge variant={order.status === "Completed" ? "default" : "secondary"}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(order)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(order.id)} variant="ghost" size="sm">
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
            <DialogTitle>{editingOrder ? "Edit Sales Order" : "New Sales Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Order ID</Label>
              <Input value={formData.id} disabled />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Items</Label>
                <Input type="number" value={formData.items} onChange={(e) => setFormData({...formData, items: +e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Amount</Label>
                <Input value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} placeholder="₹0" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
              </div>
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingOrder ? "Update" : "Create"} Order
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
