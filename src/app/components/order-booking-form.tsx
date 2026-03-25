"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCustomerDropdown } from "@/redux/slices/customerSlice";
import { fetchProductDropdown } from "@/redux/slices/productSlice";
import { createOrderBooking, updateOrderBooking } from "@/redux/slices/orderBookingSlice";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Combobox } from "./ui/combobox";

export function OrderBookingForm({ id, initialData }: { id?: string; initialData?: any }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { dropdownItems: customers } = useAppSelector((state) => state.customer);
  const { dropdownItems: products } = useAppSelector((state) => state.product);

  const [customer, setCustomer] = useState(initialData?.customer?._id || "");
  const [product, setProduct] = useState(initialData?.product?._id || "");
  const [totalSets, setTotalSets] = useState(initialData?.totalSets || 1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchCustomerDropdown(""));
    dispatch(fetchProductDropdown(""));
  }, [dispatch]);

  const customerOptions = customers.map((c: any) => ({
    label: `${c.name} ${c.number ? `(${c.number})` : ""}`,
    value: c._id,
  }));

  const productOptions = products.map((p: any) => ({
    label: `${p.productCode} (${p.category?.name}) - Sizes: [${p.sizes?.map((s: any) => s.name).join(", ")}]`,
    value: p._id,
  }));

  const handleSave = async () => {
    if (!customer || !product || !totalSets) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await dispatch(updateOrderBooking({ id, data: { totalSets } })).unwrap();
        toast.success("Order updated and stock updated!");
      } else {
        await dispatch(createOrderBooking({ customer, product, totalSets })).unwrap();
        toast.success("Order booked and items reserved!");
      }
      router.push("/order-form");
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : err.message || "Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto bg-white rounded-xl border shadow-sm mt-10">
      <div className="flex items-center gap-4 border-b pb-4">
        <Button variant="outline" size="icon" onClick={() => router.push("/order-form")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Order Form" : "New Order Form"}</h1>
      </div>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Select Customer</Label>
          <Combobox
            options={customerOptions}
            value={customer}
            onChange={setCustomer}
            onSearchChange={(val) => dispatch(fetchCustomerDropdown(val))}
            placeholder="Search Customer..."
            disabled={!!id}
          />
        </div>

        <div className="space-y-2">
          <Label>Select Product</Label>
          <Combobox
            options={productOptions}
            value={product}
            onChange={setProduct}
            onSearchChange={(val) => dispatch(fetchProductDropdown(val))}
            placeholder="Search Product..."
            disabled={!!id}
          />
        </div>

        <div className="space-y-2">
          <Label>Number of Sets (Hold Quantity)</Label>
          <Input
            type="number"
            min={1}
            value={totalSets}
            onChange={(e) => setTotalSets(parseInt(e.target.value))}
            placeholder="Enter number of sets"
          />
          <p className="text-xs text-gray-500">Note: This will reserve available items for this customer.</p>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <Button onClick={handleSave} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 px-8">
          {loading ? "Saving..." : (id ? "Update Reservation" : "Confirm Reservation")}
          <Save className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
