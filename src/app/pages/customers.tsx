"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Search, Plus, Edit, Trash2, User, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";

const mockCustomers = [
  { id: 1, name: "Rajesh Kumar", phone: "9876543210", email: "rajesh@email.com", totalPurchase: 45000, visits: 12 },
  { id: 2, name: "Priya Sharma", phone: "9876543211", email: "priya@email.com", totalPurchase: 32000, visits: 8 },
  { id: 3, name: "Amit Patel", phone: "9876543212", email: "amit@email.com", totalPurchase: 67000, visits: 15 },
];

export function Customers() {
  const [customers, setCustomers] = useState(mockCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", phone: "", email: "", totalPurchase: 0, visits: 0 });

  const filteredCustomers = customers.filter(
    (c) => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm)
  );

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({ name: "", phone: "", email: "", totalPurchase: 0, visits: 0 });
    setIsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingCustomer) {
      setCustomers(customers.map(c => c.id === editingCustomer.id ? { ...formData, id: c.id } : c));
      toast.success("Customer updated!");
    } else {
      setCustomers([...customers, { ...formData, id: Date.now() }]);
      toast.success("Customer added!");
    }
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    setCustomers(customers.filter(c => c.id !== id));
    toast.success("Customer deleted!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600 mt-1">Manage customer database</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <Input
          placeholder="Search by name or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Customers ({filteredCustomers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Phone</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total Purchase</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Visits</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-medium">{customer.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">{customer.phone}</td>
                    <td className="py-3 px-4">{customer.email}</td>
                    <td className="py-3 px-4 font-medium">₹{customer.totalPurchase.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{customer.visits} visits</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(customer)} variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(customer.id)} variant="ghost" size="icon">
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
            <DialogTitle>{editingCustomer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingCustomer ? "Update" : "Add"} Customer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
