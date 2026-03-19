"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Badge } from "../components/ui/badge";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllStaffs, createStaff, updateStaff, deleteStaff } from "@/redux/slices/staffSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function Users() {
  const dispatch = useAppDispatch();
  const { staffs, loading, pagination } = useAppSelector((state) => state.staff);
  const [isOpen, setIsOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "", status: "active" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllStaffs({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllStaffs({ page, limit: 10, search }));
  };

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
      dispatch(fetchAllStaffs({ page: pagination?.currentPage || 1, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save user");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await dispatch(deleteStaff(id)).unwrap();
        toast.success("User deleted!");
        dispatch(fetchAllStaffs({ page: pagination?.currentPage || 1, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete user");
      }
    }
  };

  const columns = [
    { header: "User", accessorKey: "fullName", cell: (item: any) => (
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-indigo-600" />
        </div>
        <span className="font-medium text-gray-900">{item.fullName}</span>
      </div>
    )},
    { header: "Email", accessorKey: "email" },
    { header: "Status", accessorKey: "status", cell: (item: any) => (
      <Badge variant={item.status === "active" ? "default" : "secondary"}>{item.status}</Badge>
    )},
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users & Staff</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={staffs}
          pagination={pagination || { totalRecords: 0, currentPage: 1, totalPages: 0, limit: 10 }}
          onPageChange={handlePageChange}
          onSearchChange={setSearch}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </div>

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
