"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllMyStaffs, createMyStaff, updateMyStaff, deleteMyStaff } from "@/redux/slices/myStaffSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function MyStaff() {
  const dispatch = useAppDispatch();
  const { myStaffs, loading, pagination } = useAppSelector((state) => state.myStaff);
  const [isOpen, setIsOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAllMyStaffs({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllMyStaffs({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingStaff(null);
    setFormData({ name: "" });
    setIsOpen(true);
  };

  const handleEdit = (staff: any) => {
    setEditingStaff(staff);
    setFormData({ name: staff.name });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Staff name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingStaff) {
        await dispatch(updateMyStaff({ id: editingStaff._id, data: formData })).unwrap();
        toast.success("Staff updated!");
      } else {
        await dispatch(createMyStaff(formData)).unwrap();
        toast.success("Staff added!");
      }
      setIsOpen(false);
      dispatch(fetchAllMyStaffs({ page: pagination.currentPage, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save staff");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this staff member?")) {
      try {
        await dispatch(deleteMyStaff(id)).unwrap();
        toast.success("Staff deleted!");
        dispatch(fetchAllMyStaffs({ page: pagination.currentPage, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete staff");
      }
    }
  };

  const columns = [
    { header: "Name", accessorKey: "name" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Staff</h1>
          <p className="text-gray-500">Manage your sales and service staff</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={myStaffs}
          pagination={pagination}
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
            <DialogTitle>{editingStaff ? "Edit Staff" : "Add New Staff"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Staff Name</Label>
              <Input
                placeholder="e.g., John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>{editingStaff ? "Update" : "Add"} Staff</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
