import React, { useState, useCallback } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileText, Loader } from 'lucide-react';
import { useApi } from '@/contexts/ApiContext';
import { useContacts } from '@/contexts/ContactsContext';
import Button from '@/components/ui/Button';

interface ParsedRow {
  name: string;
  phone: string;
  group?: string;
  tags?: string;
}

interface ImportResult {
  importedRows: number;
  duplicateRows: number;
  invalidRows: number;
  totalRows: number;
}

interface Props {
  file: File;
  onClose: () => void;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 1) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

const TEMPLATE_CSV = `name,phone,group,tags
John Smith,+1555000001,Leads,vip;enterprise
Jane Doe,+1555000002,Customers,retail`;

const CsvImportModal: React.FC<Props> = ({ file, onClose }) => {
  const { crmApi } = useApi();
  const { refresh } = useContacts();
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, string>[] } | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setParsed(parseCSV(text));
    };
    reader.readAsText(file);
  }, [file]);

  const handleImport = useCallback(async () => {
    setImporting(true);
    setError(null);
    try {
      const res = await crmApi.importContactsCsv(file);
      setResult(res.data);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Check your CSV format and try again.');
    } finally {
      setImporting(false);
    }
  }, [file, crmApi, refresh]);

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const previewRows = parsed?.rows.slice(0, 5) ?? [];
  const hasNameCol = parsed?.headers.some(h => h.toLowerCase() === 'name');
  const hasPhoneCol = parsed?.headers.some(h => h.toLowerCase() === 'phone');
  const isValidFormat = hasNameCol && hasPhoneCol;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Import Contacts</h2>
              <p className="text-xs text-gray-500 mt-0.5 font-medium truncate max-w-xs">{file.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Result state */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
                <div>
                  <p className="font-bold text-green-800">Import complete</p>
                  <p className="text-sm text-green-700 mt-0.5">Your contacts have been added to the CRM.</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-green-700">{result.importedRows}</p>
                  <p className="text-xs font-bold text-green-600 mt-1 uppercase tracking-wide">Imported</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-yellow-700">{result.duplicateRows}</p>
                  <p className="text-xs font-bold text-yellow-600 mt-1 uppercase tracking-wide">Duplicates</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                  <p className="text-2xl font-black text-red-700">{result.invalidRows}</p>
                  <p className="text-xs font-bold text-red-600 mt-1 uppercase tracking-wide">Invalid</p>
                </div>
              </div>
              {result.invalidRows > 0 && (
                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 font-medium">
                  Invalid rows are missing a <strong>name</strong> or <strong>phone</strong> value. Download the template below to see the correct format.
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Format warning */}
              {parsed && !isValidFormat && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-red-800">Missing required columns</p>
                    <p className="text-xs text-red-700 mt-1">
                      Your CSV must have <strong>name</strong> and <strong>phone</strong> columns.
                      Download the template below for the correct format.
                    </p>
                  </div>
                </div>
              )}

              {/* Stats */}
              {parsed && (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="text-center flex-1">
                    <p className="text-xl font-black text-gray-900">{parsed.rows.length}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">Rows detected</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="text-center flex-1">
                    <p className="text-xl font-black text-gray-900">{parsed.headers.length}</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">Columns</p>
                  </div>
                  <div className="w-px h-10 bg-gray-200" />
                  <div className="text-center flex-1">
                    <p className="text-sm font-black text-gray-700 truncate">{(file.size / 1024).toFixed(1)} KB</p>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mt-0.5">File size</p>
                  </div>
                </div>
              )}

              {/* Column mapping info */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Expected columns</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { col: 'name', required: true, desc: 'Full name' },
                    { col: 'phone', required: true, desc: 'Phone with country code' },
                    { col: 'group', required: false, desc: 'Contact group' },
                    { col: 'tags', required: false, desc: 'Comma-separated tags' },
                  ].map(({ col, required, desc }) => {
                    const present = parsed?.headers.some(h => h.toLowerCase() === col);
                    return (
                      <div key={col} className={`flex items-center gap-2 p-2.5 rounded-lg border text-sm ${
                        present ? 'bg-green-50 border-green-200' : required ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                      }`}>
                        <span className={`font-mono font-bold text-xs ${present ? 'text-green-700' : required ? 'text-red-600' : 'text-gray-500'}`}>
                          {col}
                        </span>
                        {required && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold">required</span>}
                        <span className="text-gray-400 text-xs ml-auto">{desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Preview table */}
              {previewRows.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Preview (first {previewRows.length} rows)</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-100">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          {parsed!.headers.map(h => (
                            <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {previewRows.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            {parsed!.headers.map(h => (
                              <td key={h} className="px-3 py-2 text-gray-700 font-medium whitespace-nowrap max-w-[150px] truncate">{row[h] || '—'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsed!.rows.length > 5 && (
                    <p className="text-xs text-gray-400 font-medium text-center">…and {parsed!.rows.length - 5} more rows</p>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <Download className="w-4 h-4" />
            Download template
          </button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={importing || !parsed || !isValidFormat}
                className="rounded-xl font-bold"
                icon={importing ? Loader : Upload}
              >
                {importing ? 'Importing…' : `Import ${parsed?.rows.length ?? 0} contacts`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvImportModal;
