"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllTransportMasters, createTransportMaster, updateTransportMaster, deleteTransportMaster } from "@/redux/slices/transportMasterSlice";
import { CommonDataTable } from "../components/ui/common-data-table";

export function TransportMaster() {
  const dispatch = useAppDispatch();
  const { transportMasters, loading, pagination } = useAppSelector((state) => state.transportMaster);
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransport, setEditingTransport] = useState<any>(null);
  const [formData, setFormData] = useState({ name: "" });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAllTransportMasters({ page: 1, limit: 10, search }));
  }, [dispatch, search]);

  const handlePageChange = (page: number) => {
    dispatch(fetchAllTransportMasters({ page, limit: 10, search }));
  };

  const handleAdd = () => {
    setEditingTransport(null);
    setFormData({ name: "" });
    setIsOpen(true);
  };

  const handleEdit = (transport: any) => {
    setEditingTransport(transport);
    setFormData({ name: transport.name });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Transport name is required");
      return;
    }

    setIsSaving(true);
    try {
      if (editingTransport) {
        await dispatch(updateTransportMaster({ id: editingTransport._id, data: formData })).unwrap();
        toast.success("Transport updated!");
      } else {
        await dispatch(createTransportMaster(formData)).unwrap();
        toast.success("Transport added!");
      }
      setIsOpen(false);
      dispatch(fetchAllTransportMasters({ page: pagination.currentPage, limit: 10, search }));
    } catch (err: any) {
      toast.error(err.message || "Failed to save transport");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this transport?")) {
      try {
        await dispatch(deleteTransportMaster(id)).unwrap();
        toast.success("Transport deleted!");
        dispatch(fetchAllTransportMasters({ page: pagination.currentPage, limit: 10, search }));
      } catch (err: any) {
        toast.error(err.message || "Failed to delete transport");
      }
    }
  };

  const columns = [
    { header: "Transport Name", accessorKey: "name" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transport Master</h1>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Transport
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden p-6">
        <CommonDataTable
          columns={columns}
          data={transportMasters}
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
            <DialogTitle>{editingTransport ? "Edit Transport" : "Add New Transport"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Transport Name</Label>
              <Input
                placeholder="e.g., DHL, FedEx, Local Courier"
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
                <>{editingTransport ? "Update" : "Add"} Transport</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
