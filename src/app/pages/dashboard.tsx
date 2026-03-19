"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { ShoppingCart, DollarSign, Users, Package, ArrowUp, ArrowDown } from "lucide-react";
import api from "@/lib/axios";
import { Skeleton } from "../components/ui/skeleton";

const iconMap: Record<string, any> = {
  DollarSign,
  Package,
  Users
};

export function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dashboard/stats")
      .then(res => {
        if (res.data.status) {
          setData(res.data.data);
        }
      })
      .catch(err => console.error("Dashboard error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const stats = data?.stats || [];
  const recentSales = data?.recentSales || [];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any) => {
          const Icon = iconMap[stat.icon] || Package;
          return (
            <Card key={stat.title} className={stat.alert ? "border-orange-300 border-2" : ""}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    <div className="flex items-center mt-2 text-sm">
                      {stat.trend === "up" ? (
                        <ArrowUp className="w-4 h-4 text-green-600 mr-1" />
                      ) : (
                        <ArrowDown className="w-4 h-4 text-orange-600 mr-1" />
                      )}
                      <span className={stat.trend === "up" ? "text-green-600" : "text-orange-600"}>
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentSales.length > 0 ? recentSales.map((sale: any) => (
              <div key={sale.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{sale.customer}</p>
                    <p className="text-sm text-gray-500">{sale.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{sale.amount}</p>
                  <p className="text-sm text-gray-500">{sale.time}</p>
                </div>
              </div>
            )) : (
                <p className="text-center text-gray-500 py-4 italic">No recent sales found.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
