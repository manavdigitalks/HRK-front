"use client";
import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/axios";

export function Reports() {
  const [sizes, setSizes] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get("/report/stock");
      setSizes(res.data.data.sizes);
      setRows(res.data.data.rows);
    } catch {
      toast.error("Report load nahi hua");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReport(); }, []);

  const handleDownload = () => {
    if (!rows.length) return;

    const headers = ["Design No", "SKU", "Category", ...sizes.map((s) => s.name)];
    const csvRows = rows.map((r) =>
      [
        r.designNo,
        r.sku,
        r.category,
        ...sizes.map((s) => (r.sizeCounts[s._id] === null ? "-" : r.sizeCounts[s._id])),
      ].join(",")
    );

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and download business reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchReport} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleDownload} disabled={!rows.length} className="bg-indigo-600 hover:bg-indigo-700">
            <Download className="w-4 h-4 mr-2" /> Download CSV
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Design No</th>
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">SKU</th>
                <th className="text-left px-4 py-3 font-semibold whitespace-nowrap">Category</th>
                {sizes.map((s) => (
                  <th key={s._id} className="text-center px-4 py-3 font-semibold whitespace-nowrap">
                    {s.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3 + sizes.length} className="text-center py-16 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={3 + sizes.length} className="text-center py-16 text-gray-400">
                    Koi data nahi mila
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-2.5 font-bold text-indigo-600">{row.designNo}</td>
                    <td className="px-4 py-2.5">{row.sku}</td>
                    <td className="px-4 py-2.5 text-gray-600">{row.category}</td>
                    {sizes.map((s) => {
                      const val = row.sizeCounts[s._id];
                      return (
                        <td key={s._id} className="px-4 py-2.5 text-center">
                          {val === null ? (
                            <span className="text-gray-300">—</span>
                          ) : (
                            <span className={`font-bold ${val === 0 ? "text-red-500" : "text-gray-800"}`}>
                              {val}
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
