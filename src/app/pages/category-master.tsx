"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllCategoryMasters, createCategoryMaster, updateCategoryMaster, deleteCategoryMaster } from "@/redux/slices/categoryMasterSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function CategoryMaster() {
  const dispatch = useAppDispatch();
  const { categoryMasters, loading, pagination } = useAppSelector((state) => state.categoryMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchAllCategoryMasters({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllCategoryMasters({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setFormData({ name: "" });
    setIsOpen(true);
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    try {
      if (editingCategory) {
        await dispatch(updateCategoryMaster({ id: editingCategory._id, data: formData })).unwrap();
        toast.success("Category updated!");
      } else {
        await dispatch(createCategoryMaster(formData)).unwrap();
        toast.success("Category added!");
      }
      setIsOpen(false);
      dispatch(fetchAllCategoryMasters({ page: pagination.currentPage, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await dispatch(deleteCategoryMaster(id)).unwrap();
        toast.success("Category deleted!");
        dispatch(fetchAllCategoryMasters({ page: pagination.currentPage, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete category");
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
          <h1 className="text-3xl font-bold text-gray-900">Category Master</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={categoryMasters}
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
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                placeholder="e.g., Electronics, Clothing"
                value={formData.name}
                onChange={(e) => setFormData({ name: e.target.value })}
              />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingCategory ? "Update" : "Add"} Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
