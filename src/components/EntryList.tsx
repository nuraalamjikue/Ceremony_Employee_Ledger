import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSpreadsheet,
  Search,
  Trash2,
  Database,
  HelpCircle,
  ArrowUpDown,
  Edit2,
  Check,
  X,
  Download,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Entry } from "../types";

interface EntryListProps {
  entries: Entry[];
  onEntriesChanged: (updatedEntries: Entry[]) => void;
}

export default function EntryList({
  entries,
  onEntriesChanged,
}: EntryListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(false); // Default sort desc (latest first)
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const handleStartEdit = (entry: Entry) => {
    setEditingId(entry.id);
    setEditName(entry.name);
    setEditAmount(entry.amount.toString());
    setEditAddress(entry.address);
  };

  const handleSaveEdit = () => {
    const trimmedName = editName.trim();
    const trimmedAddress = editAddress.trim();
    const amountVal = parseFloat(editAmount);

    if (!trimmedName) {
      alert("Employee Name cannot be empty.");
      return;
    }
    if (isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount greater than zero.");
      return;
    }
    if (!trimmedAddress) {
      alert("Address/Location context cannot be empty.");
      return;
    }

    // Check duplicate employee name among other log items
    const hasDuplicate = entries.some(
      (entry) =>
        entry.id !== editingId &&
        entry.name.toLowerCase() === trimmedName.toLowerCase(),
    );
    if (hasDuplicate) {
      alert(`An entry for "${trimmedName}" has already been recorded.`);
      return;
    }

    const updated = entries.map((entry) => {
      if (entry.id === editingId) {
        return {
          ...entry,
          name: trimmedName,
          amount: amountVal,
          address: trimmedAddress,
        };
      }
      return entry;
    });

    // Send to API
    fetch("http://localhost:3001/api/entries", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updated),
    })
      .then((response) => response.json())
      .then((data) => {
        onEntriesChanged(data);
        setEditingId(null);
      })
      .catch((error) => {
        console.error("Error updating entry:", error);
        alert("Failed to update entry.");
      });
  };

  // Handle Export to Excel
  const handleExport = () => {
    if (entries.length === 0) {
      alert("There are no entries to export.");
      return;
    }

    try {
      // Structure the data clearly for the spreadsheet columns
      const formattedData = entries.map((entry, index) => ({
        "Serial No": index + 1,
        "Employee Name": entry.name,
        "Amount ($)": entry.amount,
        "Address / Location": entry.address,
        Gift: entry.gift || "-",
        "Record Date": entry.date,
      }));

      // Create Worksheet and Workbook
      const worksheet = XLSX.utils.json_to_sheet(formattedData);

      // Auto-adjust column widths for better visual readability in Excel
      const maxLens = formattedData.reduce(
        (acc, row) => {
          Object.keys(row).forEach((key) => {
            const val = String(row[key as keyof typeof row] || "");
            acc[key] = Math.max(acc[key] || 0, val.length);
          });
          return acc;
        },
        {} as Record<string, number>,
      );

      worksheet["!cols"] = Object.keys(maxLens).map((key) => ({
        wch: Math.max(maxLens[key] + 3, key.length + 3),
      }));

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Ceremony Entries");

      // Save/Download Excel file
      XLSX.writeFile(workbook, "ceremony_entries.xlsx");
    } catch (e) {
      console.error("Error exporting to Excel:", e);
      alert("An error occurred while exporting data to Excel.");
    }
  };

  // Handle Export to JSON
  const handleExportJSON = () => {
    if (entries.length === 0) {
      alert("There are no entries to export.");
      return;
    }

    try {
      const jsonData = {
        exportedAt: new Date().toISOString(),
        entries: entries,
        totalRecords: entries.length,
        totalAmount: entries.reduce((sum, e) => sum + e.amount, 0),
      };

      const dataStr = JSON.stringify(jsonData, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `ceremony_entries_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Error exporting to JSON:", e);
      alert("An error occurred while exporting data to JSON.");
    }
  };

  // Handle Import from JSON
  const handleImportJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const jsonData = JSON.parse(content);

        // Extract entries from the imported JSON
        let importedEntries: Entry[] = [];
        if (Array.isArray(jsonData)) {
          // If it's directly an array of entries
          importedEntries = jsonData;
        } else if (jsonData.entries && Array.isArray(jsonData.entries)) {
          // If it's our exported format with metadata
          importedEntries = jsonData.entries;
        }

        if (importedEntries.length === 0) {
          alert("No valid entries found in the imported file.");
          return;
        }

        // Merge or replace - ask user
        const shouldMerge = confirm(
          `Found ${importedEntries.length} entries in the file.\n\nClick OK to MERGE with existing data.\nClick Cancel to REPLACE all data.`,
        );

        let finalEntries: Entry[];
        if (shouldMerge) {
          finalEntries = [...importedEntries, ...entries];
        } else {
          finalEntries = importedEntries;
        }

        // Send to API
        fetch("http://localhost:3001/api/entries", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(finalEntries),
        })
          .then((response) => response.json())
          .then((data) => {
            onEntriesChanged(data);
            alert(`Successfully imported ${importedEntries.length} entries!`);
          })
          .catch((error) => {
            console.error("Error importing entries:", error);
            alert("Failed to import entries.");
          });
      };
      reader.readAsText(file);
    } catch (e) {
      console.error("Error importing JSON:", e);
      alert(
        "Failed to import JSON file. Please ensure it's a valid JSON file.",
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete individual entry
  const handleDeleteEntry = (id: string) => {
    if (confirm("Are you sure you want to delete this entry?")) {
      const updated = entries.filter((entry) => entry.id !== id);

      // Send to API
      fetch("http://localhost:3001/api/entries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updated),
      })
        .then((response) => response.json())
        .then((data) => {
          onEntriesChanged(data);
        })
        .catch((error) => {
          console.error("Error deleting entry:", error);
          alert("Failed to delete entry.");
        });
    }
  };

  // Clear all entries
  const handleClearAll = () => {
    if (
      confirm(
        "WARNING: Are you sure you want to delete ALL entries? This action cannot be undone.",
      )
    ) {
      // Send to API
      fetch("http://localhost:3001/api/entries", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([]),
      })
        .then((response) => response.json())
        .then((data) => {
          onEntriesChanged(data);
        })
        .catch((error) => {
          console.error("Error clearing entries:", error);
          alert("Failed to clear entries.");
        });
    }
  };

  // Filter in real time
  const filteredEntries = entries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.name.toLowerCase().includes(q) ||
      entry.address.toLowerCase().includes(q) ||
      entry.amount.toString().includes(q) ||
      entry.date.toLowerCase().includes(q)
    );
  });

  // Calculate stats
  const totalAmount = filteredEntries.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* List Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50/25">
        <div>
          <h2 className="text-lg font-bold font-display text-slate-900 tracking-tight leading-none">
            Ceremony Attendance Ledger
          </h2>
          <p className="text-[11px] text-slate-400 mt-1 font-sans font-medium">
            Displaying {filteredEntries.length} of {entries.length} recorded
            items
          </p>
        </div>

        {/* Buttons and controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExport}
            disabled={entries.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold shadow-xs select-none transition-all cursor-pointer ${
              entries.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200/30"
                : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-blue-600/10 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <FileSpreadsheet size={15} />
            <span>Export to Excel</span>
          </button>

          {/* <button
            onClick={handleExportJSON}
            disabled={entries.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold shadow-xs select-none transition-all cursor-pointer ${
              entries.length === 0
                ? "bg-slate-100 text-slate-400 cursor-not-allowed shadow-none border border-slate-200/30"
                : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-emerald-600/10 hover:scale-[1.01] active:scale-[0.99]"
            }`}
          >
            <Download size={15} />
            <span>Save JSON</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-bold shadow-xs select-none transition-all cursor-pointer bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-indigo-600/10 hover:scale-[1.01] active:scale-[0.99]"
          >
            <Upload size={15} />
            <span>Load JSON</span>
          </button> */}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            style={{ display: "none" }}
          />
        </div>
      </div>

      {/* Real-time search/filter inputs */}
      <div className="px-6 py-3 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={15}
          />
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-sans"
            placeholder="Filter list values..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {filteredEntries.length > 0 && (
          <div className="ml-auto flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-bold font-display uppercase tracking-wider text-[9px]">
              Filtered sum
            </span>
            <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 border border-emerald-200/40 px-2.5 py-1 rounded-lg">
              $
              {totalAmount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Table block */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider select-none border-b border-slate-100">
              <th className="px-4 py-2.5 text-center font-bold w-12">S/N</th>
              <th className="px-4 py-2.5 font-bold">Employee Name</th>
              <th className="px-4 py-2.5 font-bold text-right">Amount ($)</th>
              <th className="px-4 py-2.5 font-bold">Address / Location</th>
              <th className="px-4 py-2.5 font-bold">Gift</th>
              <th className="px-4 py-2.5 font-bold">Recorded Date</th>
              <th className="px-4 py-2.5 text-center font-bold w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database size={24} className="text-slate-300 stroke-1.5" />
                    <p className="text-[11px]">No matching records found</p>
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-500 hover:underline cursor-pointer"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredEntries.map((entry, index) => {
                // Serial count from 1 (latest)
                const serialNo = index + 1;
                const isEditing = editingId === entry.id;

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-slate-50/70 transition-colors odd:bg-white even:bg-slate-50/30"
                  >
                    <td className="px-4 py-2 text-center font-mono font-medium text-slate-400 text-[11px]">
                      {serialNo}
                    </td>

                    {isEditing ? (
                      <>
                        <td className="px-4 py-1.5">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                            placeholder="Employee Name"
                          />
                        </td>
                        <td className="px-4 py-1.5 text-right font-mono">
                          <div className="relative inline-block w-24">
                            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                              $
                            </span>
                            <input
                              type="number"
                              step="any"
                              min="0.01"
                              value={editAmount}
                              onChange={(e) => setEditAmount(e.target.value)}
                              className="w-full pl-4 pr-1.5 py-1 bg-white border border-slate-300 rounded text-xs text-right focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono font-bold"
                              placeholder="0.00"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-1.5">
                          <input
                            type="text"
                            value={editAddress}
                            onChange={(e) => setEditAddress(e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-sans"
                            placeholder="Address / Location"
                          />
                        </td>
                        <td className="px-4 py-1.5 text-slate-400 font-sans text-[11px]">
                          {entry.gift || "-"}
                        </td>
                        <td className="px-4 py-1.5 text-slate-400 font-sans text-[11px]">
                          {entry.date}
                        </td>
                        <td className="px-4 py-1.5 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={handleSaveEdit}
                              className="p-1 rounded-md text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="Save changes"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 active:bg-slate-200 cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="Cancel"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-2 font-semibold text-slate-900">
                          {entry.name}
                        </td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-950">
                          ${entry.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-slate-500 font-sans">
                          {entry.address}
                        </td>
                        <td className="px-4 py-2 text-slate-600 font-sans text-[11px]">
                          {entry.gift ? (
                            <span className="inline-block bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-semibold">
                              {entry.gift}
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-slate-405 text-slate-400 font-sans text-[11px]">
                          {entry.date}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <button
                              onClick={() => handleStartEdit(entry)}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 active:bg-blue-100 cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="Edit entry"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 active:bg-rose-100 cursor-pointer transition-colors inline-flex items-center justify-center"
                              title="Delete entry"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
