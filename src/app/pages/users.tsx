"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Plus, Edit, Trash2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";

const mockUsers = [
  { id: 1, name: "Admin User", email: "admin@retailpro.com", role: "Admin", status: "Active" },
  { id: 2, name: "John Manager", email: "john@retailpro.com", role: "Manager", status: "Active" },
  { id: 3, name: "Sarah Sales", email: "sarah@retailpro.com", role: "Salesman", status: "Active" },
  { id: 4, name: "Mike Stock", email: "mike@retailpro.com", role: "Stock Manager", status: "Active" },
];

const roles = [
  { value: "Admin", description: "Full system access" },
  { value: "Manager", description: "Reports, Orders, View billing" },
  { value: "Salesman", description: "Billing only, Customer add" },
  { value: "Stock Manager", description: "Stock entry, Purchase entry" },
];

export function Users() {
  const [users, setUsers] = useState(mockUsers);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "Salesman", status: "Active" });

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ name: "", email: "", role: "Salesman", status: "Active" });
    setIsOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData(user);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (editingUser) {
      setUsers(users.map(u => u.id === editingUser.id ? { ...formData, id: u.id } : u));
      toast.success("User updated!");
    } else {
      setUsers([...users, { ...formData, id: Date.now() }]);
      toast.success("User created!");
    }
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    setUsers(users.filter(u => u.id !== id));
    toast.success("User deleted!");
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Roles</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Full Name</Label>
                <Input id="user-name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Enter full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-role">Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {editingUser ? "Update" : "Create"} User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.value} className="border-l-4 border-l-indigo-600">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900">{role.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{role.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">{user.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant="outline">{user.role}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{user.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(user)} variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(user.id)} variant="ghost" size="icon">
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
    </div>
  );
}
