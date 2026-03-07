"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { toast } from "sonner";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchAllReturns, createReturn, updateReturn, deleteReturn } from "@/redux/slices/returnSlice";

export function Returns() {
  const dispatch = useAppDispatch();
  const { returns, loading } = useAppSelector((state) => state.return);
  const [isOpen, setIsOpen] = useState(false);
  const [editingReturn, setEditingReturn] = useState<any>(null);
  const [formData, setFormData] = useState({ invoice: "", product: "", customer: "", amount: 0, reason: "", status: "Pending" });

  useEffect(() => {
    dispatch(fetchAllReturns());
  }, [dispatch]);

  const handleAdd = () => {
    setEditingReturn(null);
    setFormData({ invoice: "", product: "", customer: "", amount: 0, reason: "", status: "Pending" });
    setIsOpen(true);
  };

  const handleEdit = (ret: any) => {
    setEditingReturn(ret);
    setFormData({ invoice: ret.invoice, product: ret.product, customer: ret.customer, amount: ret.amount, reason: ret.reason, status: ret.status });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingReturn) {
        await dispatch(updateReturn({ id: editingReturn._id, data: formData })).unwrap();
        toast.success("Return updated!");
      } else {
        await dispatch(createReturn(formData)).unwrap();
        toast.success("Return created!");
      }
      setIsOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save return");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteReturn(id)).unwrap();
      toast.success("Return deleted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete return");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Manage product returns</p>
        </div>
        <Button onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          New Return
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Returns ({returns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Invoice</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((ret: any) => (
                  <tr key={ret._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{ret.invoice}</td>
                    <td className="py-3 px-4">{ret.product}</td>
                    <td className="py-3 px-4">{ret.customer}</td>
                    <td className="py-3 px-4 font-medium">₹{ret.amount}</td>
                    <td className="py-3 px-4">
                      <Badge variant={ret.status === "Completed" ? "default" : "secondary"}>
                        {ret.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <Button onClick={() => handleEdit(ret)} variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button onClick={() => handleDelete(ret._id)} variant="ghost" size="sm">
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
            <DialogTitle>{editingReturn ? "Edit Return" : "New Return"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Input value={formData.invoice} onChange={(e) => setFormData({...formData, invoice: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Product</Label>
              <Input value={formData.product} onChange={(e) => setFormData({...formData, product: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <Input value={formData.customer} onChange={(e) => setFormData({...formData, customer: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: +e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={formData.reason} onChange={(e) => setFormData({...formData, reason: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Input value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} />
            </div>
            <Button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-700">
              {editingReturn ? "Update" : "Create"} Return
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
