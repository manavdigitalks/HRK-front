"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Edit, Trash2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllStaffs, createStaff, updateStaff, deleteStaff } from "@/redux/slices/staffSlice";

export function Users() {
  const dispatch = useAppDispatch();
  const { staffs, loading } = useAppSelector((state) => state.staff);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", status: "active" });

  useEffect(() => {
    dispatch(fetchAllStaffs());
  }, [dispatch]);

  const handleAdd = () => {
    setEditingUser(null);
    setFormData({ fullName: "", email: "", password: "", status: "active" });
    setIsOpen(true);
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ fullName: user.fullName, email: user.email, password: "", status: user.status });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingUser) {
        const updateData: any = { fullName: formData.fullName, email: formData.email, status: formData.status };
        if (formData.password) updateData.password = formData.password;
        await dispatch(updateStaff({ id: editingUser._id, data: updateData })).unwrap();
        toast.success("User updated!");
      } else {
        await dispatch(createStaff(formData)).unwrap();
        toast.success("User created!");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteStaff(id)).unwrap();
      toast.success("User deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Staff</h1>
          <p className="text-gray-600 mt-1">Manage system users</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users ({staffs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffs.map((user: any) => (
                  <tr key={user._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                          <UserCircle className="w-6 h-6 text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-900">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-700">{user.email}</td>
                    <td className="py-3 px-4">
                      <Badge variant={user.status === "active" ? "default" : "secondary"}>{user.status}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(user)} variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(user._id)} variant="ghost" size="icon">
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
            <DialogTitle>{editingUser ? "Edit User" : "Create New User"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Password {editingUser && "(leave blank to keep current)"}</Label>
              <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingUser ? "Update" : "Create"} User
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
