import { useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  LoaderCircle,
  ArrowRight,
  FileUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { createFinancialData } from "../services/financialDataService";

const REQUIRED_COLUMNS = [
  "date",
  "type",
  "category",
  "amount",
  "paymentmethod",
];

const VALID_PAYMENT_METHODS = ["Cash", "Bank", "UPI", "Card", "Other"];

function normalizeHeader(header) {
  return String(header ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/\uFEFF/g, "")
    .replace(/[\u200B-\u200D\u2060]/g, "")
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1$2")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeRow(row) {
  const normalized = {};

  Object.entries(row ?? {}).forEach(([key, value]) => {
    const normalizedKey = normalizeHeader(key);

    if (normalizedKey) {
      normalized[normalizedKey] = value;
    }
  });

  return normalized;
}

function formatDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return [
        String(parsed.y).padStart(4, "0"),
        String(parsed.m).padStart(2, "0"),
        String(parsed.d).padStart(2, "0"),
      ].join("-");
    }

    return "";
  }

  const text = String(value ?? "").trim();

  if (!text) return "";

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);

  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return "";
  }

  const localMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);

  if (localMatch) {
    const [, day, month, year] = localMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    return "";
  }

  return "";
}

function parseBoolean(value) {
  if (typeof value === "boolean") return value;

  const text = String(value ?? "")
    .trim()
    .toLowerCase();

  if (["true", "yes", "1", "paid"].includes(text)) return true;
  if (["false", "no", "0", "unpaid", ""].includes(text)) return false;

  return null;
}

function getErrorMessage(error) {
  const backendError = error.response?.data;

  if (typeof backendError === "string") {
    return backendError;
  }

  if (backendError && typeof backendError === "object") {
    if (typeof backendError.message === "string") {
      return backendError.message;
    }

    if (typeof backendError.error === "string") {
      return backendError.error;
    }

    return JSON.stringify(backendError);
  }

  if (error.response?.status) {
    return `Request failed with HTTP status ${error.response.status}`;
  }

  return error.message || "Unknown error";
}

function normalizeTransaction(row, index) {
  const normalized = normalizeRow(row);

  const date = formatDate(normalized.date);

  const typeText = String(normalized.type ?? "")
    .trim()
    .toLowerCase();

  const type =
    typeText === "revenue"
      ? "Revenue"
      : typeText === "expense"
        ? "Expense"
        : "";

  const category = String(normalized.category ?? "").trim();
  const description = String(normalized.description ?? "").trim();

  const amountText = String(normalized.amount ?? "")
    .replace(/,/g, "")
    .trim();

  const amount = Number(amountText);

  const paymentText = String(normalized.paymentmethod ?? "")
    .trim()
    .toLowerCase();

  const paymentMethod = VALID_PAYMENT_METHODS.find(
    (method) => method.toLowerCase() === paymentText,
  );

  const isPaid = parseBoolean(normalized.ispaid);

  const paymentDateText = String(normalized.paymentdate ?? "").trim();

  const paymentDate = paymentDateText
    ? formatDate(normalized.paymentdate)
    : null;

  const errors = [];

  if (!date) errors.push("Invalid or missing date");
  if (!type) errors.push("Type must be Revenue or Expense");
  if (!category) errors.push("Category is required");

  if (!amountText || !Number.isFinite(amount) || amount <= 0) {
    errors.push("Amount must be greater than zero");
  }

  if (!paymentMethod) {
    errors.push("Invalid or missing payment method");
  }

  if (isPaid === null) {
    errors.push("IsPaid must be Yes/No or True/False");
  }

  if (paymentDateText && !paymentDate) {
    errors.push("Invalid payment date");
  }

  if (isPaid === true && !paymentDate) {
    errors.push("A payment date is required for paid transactions");
  }

  if (isPaid === false && paymentDate) {
    errors.push("Unpaid transactions must not have a payment date");
  }

  return {
    rowNumber: index + 2,
    data: {
      date,
      type,
      category,
      description,
      amount,
      paymentMethod,
      isPaid: isPaid ?? false,
      paymentDate: isPaid === true ? paymentDate : null,
    },
    errors,
  };
}

function ImportData() {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [summary, setSummary] = useState(null);

  const validTransactions = transactions.filter(
    (transaction) => transaction.errors.length === 0,
  );

  const invalidTransactions = transactions.filter(
    (transaction) => transaction.errors.length > 0,
  );

  const handleFile = async (selectedFile) => {
    if (!selectedFile) return;

    const extension = selectedFile.name.split(".").pop().toLowerCase();

    if (!["csv", "xlsx", "xls"].includes(extension)) {
      toast.error("Please select a CSV or Excel file.");
      return;
    }

    setFile(selectedFile);
    setTransactions([]);
    setSummary(null);

    try {
      let rows = [];

      if (extension === "csv") {
        rows = await new Promise((resolve, reject) => {
          Papa.parse(selectedFile, {
            header: true,
            skipEmptyLines: "greedy",
            transformHeader: (header) =>
              String(header ?? "")
                .replace(/^\uFEFF/, "")
                .trim(),
            complete: (result) => {
              if (result.errors.length > 0) {
                reject(new Error(result.errors[0].message));
              } else {
                resolve(result.data);
              }
            },
            error: reject,
          });
        });
      } else {
        const buffer = await selectedFile.arrayBuffer();

        const workbook = XLSX.read(buffer, {
          type: "array",
          cellDates: true,
        });

        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

        if (!firstSheet) {
          throw new Error("The selected workbook contains no worksheet.");
        }

        rows = XLSX.utils.sheet_to_json(firstSheet, {
          defval: "",
          raw: true,
        });
      }

      if (rows.length === 0) {
        throw new Error("The selected file contains no transaction rows.");
      }

      const availableColumns = Object.keys(rows[0] ?? {}).map(normalizeHeader);

      const missingColumns = REQUIRED_COLUMNS.filter(
        (column) => !availableColumns.includes(normalizeHeader(column)),
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}. ` +
            `Detected columns: ${availableColumns.join(", ")}.`,
        );
      }

      const parsedTransactions = rows.map(normalizeTransaction);

      setTransactions(parsedTransactions);

      toast.success(`${parsedTransactions.length} rows ready for review.`);
    } catch (error) {
      setFile(null);
      setTransactions([]);

      toast.error(error.message || "Unable to read the selected file.");
    }
  };

  const handleFileChange = (event) => {
    handleFile(event.target.files?.[0]);
    event.target.value = "";
  };

  const downloadTemplate = () => {
    const headers = [
      "date",
      "type",
      "category",
      "description",
      "amount",
      "paymentMethod",
      "isPaid",
      "paymentDate",
    ];

    const example = [
      "2026-04-01",
      "Revenue",
      "Sales",
      "Sample transaction",
      "5000",
      "UPI",
      "Yes",
      "2026-04-01",
    ];

    const csv = Papa.unparse([headers, example]);

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "finsight-import-template.csv";
    link.click();

    URL.revokeObjectURL(url);

    toast.success("Import template downloaded.");
  };

  const handleImport = async () => {
    if (validTransactions.length === 0) {
      toast.error("There are no valid transactions to import.");
      return;
    }

    setIsImporting(true);
    setSummary(null);

    const result = {
      successful: 0,
      failed: 0,
      errors: [],
    };

    setProgress({
      completed: 0,
      total: validTransactions.length,
    });

    for (let index = 0; index < validTransactions.length; index += 1) {
      const transaction = validTransactions[index];

      try {
        await createFinancialData(transaction.data);
        result.successful += 1;
      } catch (error) {
        result.failed += 1;

        result.errors.push({
          rowNumber: transaction.rowNumber,
          message: getErrorMessage(error),
        });
      }

      setProgress({
        completed: index + 1,
        total: validTransactions.length,
      });
    }

    setIsImporting(false);
    setSummary(result);

    if (result.successful > 0) {
      toast.success(`${result.successful} transaction(s) imported.`);
    }

    if (result.failed > 0) {
      toast.error(`${result.failed} transaction(s) could not be imported.`);
    }
  };

  const clearFile = () => {
    if (isImporting) return;

    setFile(null);
    setTransactions([]);
    setSummary(null);
    setProgress({ completed: 0, total: 0 });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);

  return (
    <div className="min-h-screen bg-[#f7f8fa] px-4 py-6 text-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-blue-600">
              Financial management
            </p>

            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Import financial data
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Upload your existing financial records, review the transactions,
              and import valid entries into FinSight.
            </p>
          </div>

          <button
            type="button"
            onClick={downloadTemplate}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:self-auto"
          >
            <Download size={16} />
            Download CSV template
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                <FileUp size={20} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Rows detected</p>
                <p className="mt-1 text-2xl font-semibold">
                  {transactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Valid transactions</p>
                <p className="mt-1 text-2xl font-semibold">
                  {validTransactions.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200/80 bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-600">
                <AlertCircle size={20} />
              </div>

              <div>
                <p className="text-sm text-gray-500">Rows with errors</p>
                <p className="mt-1 text-2xl font-semibold">
                  {invalidTransactions.length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-7">
          <div className="mb-5">
            <h2 className="text-base font-semibold">Upload your file</h2>
            <p className="mt-1 text-sm text-gray-500">
              Supported formats: CSV, XLSX and XLS.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />

          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50/70 px-5 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/30"
            >
              <div className="rounded-2xl bg-white p-4 text-blue-600 shadow-sm ring-1 ring-gray-200">
                <Upload size={25} />
              </div>

              <p className="mt-4 text-sm font-semibold">
                Choose a file to upload
              </p>

              <p className="mt-1 text-sm text-gray-500">
                Select a CSV or Excel file from your computer
              </p>

              <span className="mt-5 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
                Browse files
              </span>
            </button>
          ) : (
            <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-blue-600 ring-1 ring-gray-200">
                  {file.name.toLowerCase().endsWith(".csv") ? (
                    <FileText size={22} />
                  ) : (
                    <FileSpreadsheet size={22} />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{file.name}</p>

                  <p className="mt-1 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB · {transactions.length}{" "}
                    row(s)
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearFile}
                disabled={isImporting}
                className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 sm:self-auto"
              >
                <X size={15} />
                Remove file
              </button>
            </div>
          )}

          <div className="mt-5 rounded-xl bg-blue-50/70 p-4">
            <p className="text-sm font-semibold text-gray-800">
              Required column names
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              <code>date</code>, <code>type</code>, <code>category</code>,{" "}
              <code>amount</code>, and <code>paymentMethod</code>.
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Optional columns: <code>description</code>, <code>isPaid</code>,
              and <code>paymentDate</code>. Use YYYY-MM-DD dates, Revenue or
              Expense types, and Cash, Bank, UPI, Card or Other payment methods.
            </p>
          </div>
        </section>

        {transactions.length > 0 && (
          <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
            <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Review transactions</h2>

                <p className="mt-1 text-sm text-gray-500">
                  Only valid rows will be imported. Rows with errors are
                  skipped.
                </p>
              </div>

              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || validTransactions.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isImporting ? (
                  <>
                    <LoaderCircle size={16} className="animate-spin" />
                    Importing {progress.completed}/{progress.total}
                  </>
                ) : (
                  <>
                    Import {validTransactions.length} valid rows
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>

            {isImporting && (
              <div className="px-5 pt-4 sm:px-6">
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${
                        progress.total
                          ? (progress.completed / progress.total) * 100
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-5 py-3 font-medium">Row</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Category</th>
                    <th className="px-5 py-3 font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Payment</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {transactions.map((transaction, index) => (
                    <tr
                      key={`${transaction.rowNumber}-${index}`}
                      className="align-top hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4 text-gray-500">
                        {transaction.rowNumber}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4">
                        {transaction.data.date || "—"}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                            transaction.data.type === "Revenue"
                              ? "bg-emerald-50 text-emerald-700"
                              : transaction.data.type === "Expense"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {transaction.data.type || "Invalid"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {transaction.data.category || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-medium">
                        {Number.isFinite(transaction.data.amount) &&
                        transaction.data.amount > 0
                          ? formatCurrency(transaction.data.amount)
                          : "—"}
                      </td>

                      <td className="px-5 py-4">
                        {transaction.data.paymentMethod || "—"}
                      </td>

                      <td className="max-w-xs px-5 py-4">
                        {transaction.errors.length === 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                            <CheckCircle2 size={14} />
                            Valid
                          </span>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700">
                              <AlertCircle size={14} />
                              Needs correction
                            </span>

                            <p className="mt-1 text-xs leading-5 text-rose-600">
                              {transaction.errors.join("; ")}
                            </p>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {invalidTransactions.length > 0 && (
              <div className="border-t border-amber-100 bg-amber-50/70 px-5 py-4 text-sm text-amber-800 sm:px-6">
                {invalidTransactions.length} row(s) contain errors and will be
                skipped. Correct the source file and upload it again to import
                those records.
              </div>
            )}
          </section>
        )}

        {summary && (
          <section className="rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold">Import results</h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-sm text-emerald-700">
                  Successfully imported
                </p>

                <p className="mt-1 text-2xl font-semibold text-emerald-800">
                  {summary.successful}
                </p>
              </div>

              <div className="rounded-xl bg-rose-50 p-4">
                <p className="text-sm text-rose-700">Failed to import</p>

                <p className="mt-1 text-2xl font-semibold text-rose-800">
                  {summary.failed}
                </p>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold">
                  Failed rows and backend errors
                </h3>

                {summary.errors.map((error, index) => (
                  <div
                    key={`${error.rowNumber}-${index}`}
                    className="rounded-xl border border-rose-100 bg-rose-50/60 p-3"
                  >
                    <p className="text-sm font-semibold text-rose-800">
                      CSV/Excel row {error.rowNumber}
                    </p>

                    <p className="mt-1 break-words text-sm text-rose-700">
                      {error.message}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {summary.successful > 0 && (
              <p className="mt-4 text-sm text-gray-500">
                Successfully imported transactions have been saved. Check the
                Financial Data page to verify them.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default ImportData;
