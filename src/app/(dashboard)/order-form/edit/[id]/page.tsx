"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { OrderBookingForm } from "@/app/components/order-booking-form";
import { useParams } from "next/navigation";
import { fetchAllOrderBookings } from "@/redux/slices/orderBookingSlice";

export default function EditOrderBooking() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const { orderBookings } = useAppSelector((state) => state.orderBooking);
  const [initialData, setInitialData] = useState<any>(null);

  useEffect(() => {
    if (orderBookings.length === 0) {
      dispatch(fetchAllOrderBookings({}));
    }
  }, [dispatch, orderBookings.length]);

  useEffect(() => {
    const booking = orderBookings.find((b) => b._id === id);
    if (booking) {
      setInitialData(booking);
    }
  }, [id, orderBookings]);

  if (!initialData) return <div>Loading...</div>;

  return <OrderBookingForm id={id} initialData={initialData} />;
}
