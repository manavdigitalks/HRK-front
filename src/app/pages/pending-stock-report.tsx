"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Search, AlertTriangle, Package, TrendingDown, CheckCircle2 } from "lucide-react";

export function PendingStockReport() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchReport = useCallback(async (searchVal = "") => {
    setLoading(true);
    try {
      const res = await api.get("/report/pending-stock", {
        params: searchVal ? { search: searchVal } : {},
      });
      setData(res.data.data);
      setSummary(res.data.summary);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleSearch = useCallback(
    (val: string) => {
      setSearch(val);
      const timeout = setTimeout(() => fetchReport(val), 400);
      return () => clearTimeout(timeout);
    },
    [fetchReport]
  );

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="h-9 w-9">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pending Stock Report</h1>
          <p className="text-sm text-gray-500 mt-0.5">Factory se jo stock abhi tak nahi aaya</p>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Pending Entries</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalPendingEntries}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total Pending Sets</p>
              <p className="text-2xl font-bold text-red-600">{summary.totalPendingSets}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total Expected</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalExpectedSets}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Total Received</p>
              <p className="text-2xl font-bold text-green-600">{summary.totalReceivedSets}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search by product, invoice..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
            {data.length} Pending
          </Badge>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">Loading...</div>
        ) : data.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Koi pending stock nahi hai!</p>
            <p className="text-gray-400 text-sm mt-1">Sab factory orders complete ho gaye hain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Supplier</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Invoice</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Product</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Expected</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Received</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Pending</th>
                  <th className="text-center px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Progress</th>
                  <th className="text-left px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">History</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map((entry: any) => {
                  const pct = entry.expectedSets > 0
                    ? Math.round((entry.totalSets / entry.expectedSets) * 100)
                    : 100;
                  return (
                    <tr key={entry._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(entry.entryDate).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {entry.supplier?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                        {entry.invoiceNumber || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-indigo-600">{entry.product?.productCode}</span>
                          <span className="text-[10px] text-gray-400">
                            {entry.product?.sizes?.map((s: any) => s.name).join(", ")}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700">
                        {entry.expectedSets}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-bold text-green-600">{entry.totalSets}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
                          {entry.pendingQuantity} sets
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                            <div
                              className="h-2 rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-bold text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.history && entry.history.length > 0 ? (
                          <div className="flex flex-col gap-1">
                            {entry.history.map((h: any, i: number) => (
                              <div key={h._id} className="text-[10px] text-gray-500 flex items-center gap-1">
                                <span className="w-3 h-3 rounded-full bg-green-400 inline-block shrink-0" />
                                <span>{new Date(h.entryDate).toLocaleDateString("en-GB")}</span>
                                <span className="font-bold text-green-700">+{h.totalSets} sets</span>
                                {h.invoiceNumber && <span className="text-gray-400 font-mono">({h.invoiceNumber})</span>}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
