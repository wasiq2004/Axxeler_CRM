import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, Info, Plus, Trash2, UploadCloud, X, Phone, ExternalLink, MessageSquare, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '@/components/ui/Button';

type Category = 'TRANSACTIONAL' | 'MARKETING' | 'OTP' | 'ACCOUNT_UPDATE';
type HeaderFormat = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';
type ButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';

interface TemplateButton {
  id: number;
  type: ButtonType;
  text: string;
  url?: string;
  phone_number?: string;
}

interface TemplateFormState {
  name: string;
  language: string;
  category: Category;
  namespace: string;
  description: string;

  // Header
  hasHeader: boolean;
  headerFormat: HeaderFormat | 'NONE';
  headerText: string;
  headerMediaUrl: string;

  // Body
  bodyText: string;

  // Footer
  footerText: string;

  // Buttons
  buttons: TemplateButton[];

  // Sample values for preview
  sampleValues: Record<string, string>;
}

const CATEGORIES: { value: Category; label: string; description: string }[] = [
  { value: 'TRANSACTIONAL', label: 'Transactional', description: 'Order updates, shipping notifications, account changes' },
  { value: 'MARKETING', label: 'Marketing', description: 'Promotional messages, offers, announcements' },
  { value: 'OTP', label: 'OTP', description: 'One-time passwords and authentication codes' },
  { value: 'ACCOUNT_UPDATE', label: 'Account Update', description: 'Account-related notifications and updates' },
];

const LANGUAGES = [
  { code: 'en_US', name: 'English (US)' },
  { code: 'en_GB', name: 'English (UK)' },
  { code: 'es', name: 'Spanish' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'pt_BR', name: 'Portuguese (Brazil)' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

const HEADER_FORMATS: { value: HeaderFormat | 'NONE'; label: string }[] = [
  { value: 'NONE', label: 'None' },
  { value: 'TEXT', label: 'Text' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'VIDEO', label: 'Video' },
];

const DEFAULT_STATE: TemplateFormState = {
  name: '',
  language: 'en_US',
  category: 'TRANSACTIONAL',
  namespace: '',
  description: '',
  hasHeader: false,
  headerFormat: 'NONE',
  headerText: '',
  headerMediaUrl: '',
  bodyText: '',
  footerText: '',
  buttons: [],
  sampleValues: {},
};

const WhatsAppTemplateBuilder: React.FC = () => {
  const [form, setForm] = useState<TemplateFormState>(DEFAULT_STATE);
  const [errors, setErrors] = useState<string[]>([]);
  const [showPayload, setShowPayload] = useState(false);

  const updateForm = <K extends keyof TemplateFormState>(key: K, value: TemplateFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  // Extract variables from body text
  const extractedVariables = useMemo<number[]>(() => {
    const matches = form.bodyText.match(/\{\{(\d+)\}\}/g);
    if (!matches) return [];

    const uniqueVars = Array.from<number>(new Set(
      matches.map(m => parseInt(m.replace(/[{}]/g, ''), 10))
    ));

    return uniqueVars.sort((a, b) => a - b);
  }, [form.bodyText]);

  // Auto-populate sample values
  useMemo(() => {
    const newSamples: Record<string, string> = {};
    extractedVariables.forEach((varNum) => {
      if (!form.sampleValues[varNum.toString()]) {
        newSamples[varNum.toString()] = `Sample ${varNum}`;
      } else {
        newSamples[varNum.toString()] = form.sampleValues[varNum.toString()];
      }
    });
    if (Object.keys(newSamples).length > 0) {
      setForm(prev => ({ ...prev, sampleValues: { ...prev.sampleValues, ...newSamples } }));
    }
  }, [extractedVariables]);

  const addButton = (type: ButtonType = 'QUICK_REPLY') => {
    if (form.buttons.length >= 3) return;
    setForm((prev) => ({
      ...prev,
      buttons: [
        ...prev.buttons,
        {
          id: Date.now(),
          type,
          text: '',
          url: type === 'URL' ? 'https://' : undefined,
          phone_number: type === 'PHONE_NUMBER' ? '+' : undefined,
        },
      ],
    }));
  };

  const removeButton = (id: number) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.filter((btn) => btn.id !== id),
    }));
  };

  const updateButton = (id: number, field: keyof TemplateButton, value: any) => {
    setForm((prev) => ({
      ...prev,
      buttons: prev.buttons.map((btn) =>
        btn.id === id ? { ...btn, [field]: value } : btn
      ),
    }));
  };

  const validate = (): boolean => {
    const issues: string[] = [];

    // Name validation
    if (!form.name.trim()) {
      issues.push('Template name is required');
    } else if (!/^[a-z0-9_]+$/.test(form.name)) {
      issues.push('Template name must be lowercase alphanumeric with underscores only');
    }

    // Body validation
    if (!form.bodyText.trim()) {
      issues.push('Body text is required');
    }
    if (form.bodyText.length > 1024) {
      issues.push('Body text exceeds 1024 characters');
    }

    // Header validation
    if (form.hasHeader && form.headerFormat === 'TEXT' && !form.headerText.trim()) {
      issues.push('Header text is required when header type is TEXT');
    }
    if (form.hasHeader && form.headerFormat === 'TEXT' && form.headerText.length > 60) {
      issues.push('Header text exceeds 60 characters');
    }
    if (form.hasHeader && ['IMAGE', 'DOCUMENT', 'VIDEO'].includes(form.headerFormat) && !form.headerMediaUrl.trim()) {
      issues.push(`${form.headerFormat} URL is required`);
    }

    // Footer validation
    if (form.footerText.length > 60) {
      issues.push('Footer text exceeds 60 characters');
    }

    // Button validation
    form.buttons.forEach((btn, idx) => {
      if (!btn.text.trim()) {
        issues.push(`Button ${idx + 1}: Text is required`);
      }
      if (btn.text.length > 20) {
        issues.push(`Button ${idx + 1}: Text exceeds 20 characters`);
      }
      if (btn.type === 'URL' && btn.url && !btn.url.match(/^https?:\/\/.+/)) {
        issues.push(`Button ${idx + 1}: Invalid URL format (must start with http:// or https://)`);
      }
      if (btn.type === 'PHONE_NUMBER' && btn.phone_number && !btn.phone_number.match(/^\+\d{1,15}$/)) {
        issues.push(`Button ${idx + 1}: Invalid phone number (must be E.164 format, e.g., +1234567890)`);
      }
    });

    // Variable sequence validation
    if (extractedVariables.length > 0) {
      const expectedSequence = Array.from({ length: extractedVariables.length }, (_, i) => i + 1);
      const isSequential = JSON.stringify(extractedVariables) === JSON.stringify(expectedSequence);
      if (!isSequential) {
        issues.push('Variables must be sequential starting from {{1}}, e.g., {{1}}, {{2}}, {{3}}');
      }
    }

    setErrors(issues);
    return issues.length === 0;
  };

  const buildPayload = () => {
    const components: any[] = [];

    // Header component
    if (form.hasHeader && form.headerFormat !== 'NONE') {
      if (form.headerFormat === 'TEXT') {
        components.push({
          type: 'HEADER',
          format: 'TEXT',
          text: form.headerText,
        });
      } else {
        components.push({
          type: 'HEADER',
          format: form.headerFormat,
          example: {
            header_handle: [form.headerMediaUrl],
          },
        });
      }
    }

    // Body component
    components.push({
      type: 'BODY',
      text: form.bodyText,
      ...(extractedVariables.length > 0 && {
        example: {
          body_text: [extractedVariables.map(v => form.sampleValues[v.toString()] || `Sample ${v}`)],
        },
      }),
    });

    // Footer component
    if (form.footerText.trim()) {
      components.push({
        type: 'FOOTER',
        text: form.footerText,
      });
    }

    // Buttons component
    if (form.buttons.length > 0) {
      components.push({
        type: 'BUTTONS',
        buttons: form.buttons.map((btn) => {
          const baseButton: any = {
            type: btn.type,
            text: btn.text,
          };

          if (btn.type === 'URL') {
            baseButton.url = btn.url;
          } else if (btn.type === 'PHONE_NUMBER') {
            baseButton.phone_number = btn.phone_number;
          }

          return baseButton;
        }),
      });
    }

    return {
      name: form.name,
      language: form.language,
      category: form.category,
      ...(form.namespace && { namespace: form.namespace }),
      components,
    };
  };

  const handleExport = () => {
    if (!validate()) return;

    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name || 'whatsapp_template'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderPreview = () => {
    let previewBody = form.bodyText || 'Your message preview will appear here.';

    // Replace variables with sample values
    extractedVariables.forEach((varNum) => {
      const sampleValue = form.sampleValues[varNum.toString()] || `Sample ${varNum}`;
      previewBody = previewBody.replace(new RegExp(`\\{\\{${varNum}\\}\\}`, 'g'), `**${sampleValue}**`);
    });

    return (
      <div className="sticky top-4 space-y-4">
        <div className="rounded-2xl bg-gradient-to-b from-gray-100 to-gray-50 p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-gray-500">Live WhatsApp Preview</p>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">{form.language}</span>
          </div>

          <div className="rounded-3xl bg-emerald-50/80 border border-emerald-100 shadow-inner p-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/french-stucco.png')]" />
            <div className="relative space-y-3">
              {/* Header */}
              {form.hasHeader && form.headerFormat !== 'NONE' && (
                <div>
                  {form.headerFormat === 'TEXT' && form.headerText && (
                    <p className="text-sm font-semibold text-gray-900 mb-2">{form.headerText}</p>
                  )}
                  {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && (
                    <div className="rounded-xl overflow-hidden bg-gray-200 border border-gray-300 h-48 flex items-center justify-center text-sm text-gray-600 mb-2">
                      {form.headerMediaUrl ? (
                        form.headerFormat === 'IMAGE' ? (
                          <img src={form.headerMediaUrl} alt="Header" className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center">
                            <p className="font-semibold">{form.headerFormat}</p>
                            <p className="text-xs mt-1 break-all px-4">{form.headerMediaUrl}</p>
                          </div>
                        )
                      ) : (
                        `${form.headerFormat} preview`
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div className="rounded-2xl bg-white shadow p-4 space-y-2 border border-emerald-100">
                <p className="text-sm text-gray-800 whitespace-pre-line">{previewBody}</p>

                {/* Footer */}
                {form.footerText && (
                  <p className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {form.footerText}
                  </p>
                )}

                {/* Buttons */}
                {form.buttons.length > 0 && (
                  <div className="pt-3 space-y-2">
                    {form.buttons.map((button) => (
                      <div
                        key={button.id}
                        className="text-center text-sm font-semibold text-emerald-600 border border-emerald-200 rounded-full py-2 hover:bg-emerald-50 flex items-center justify-center gap-2"
                      >
                        {button.type === 'PHONE_NUMBER' && <Phone className="h-4 w-4" />}
                        {button.type === 'URL' && <ExternalLink className="h-4 w-4" />}
                        {button.type === 'QUICK_REPLY' && <MessageSquare className="h-4 w-4" />}
                        {button.text || 'Button'}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-right text-gray-500 pt-1">11:45 AM</p>
            </div>
          </div>
        </div>

        {/* Payload panel */}
        <div className="rounded-2xl bg-gray-900 text-white p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm">WhatsApp Template Payload</p>
            <button
              onClick={() => setShowPayload(!showPayload)}
              className="text-emerald-400 hover:text-emerald-300"
            >
              {showPayload ? 'Hide' : 'Show'}
            </button>
          </div>
          {showPayload && (
            <pre className="max-h-96 overflow-auto text-[10px] leading-relaxed">
              {JSON.stringify(buildPayload(), null, 2)}
            </pre>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen p-6">
      <Link to="/campaigns" className="inline-flex items-center text-sm text-gray-500 hover:text-emerald-600 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Campaigns
      </Link>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">WhatsApp Business API</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1">Template Builder</h1>
        <p className="text-sm text-gray-600 mt-2">
          Create WhatsApp message templates that comply with WhatsApp Business API format and validation rules.
        </p>
      </div>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 space-y-1">
          <p className="font-semibold flex items-center gap-2">
            <X className="h-4 w-4" />
            Validation Errors
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        {/* Left column - Form */}
        <div className="space-y-6">
          {/* Template Metadata */}
          <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Template Metadata</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Template Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                  placeholder="order_confirmation_2025"
                  value={form.name}
                  onChange={(e) => updateForm('name', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                />
                <p className="text-xs text-gray-500 mt-1">Lowercase, alphanumeric, underscores only</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">
                  Language <span className="text-red-500">*</span>
                </label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                  value={form.language}
                  onChange={(e) => updateForm('language', e.target.value)}
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <div className="mt-2 grid gap-3 md:grid-cols-2">
                {CATEGORIES.map((cat) => (
                  <label
                    key={cat.value}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition ${form.category === cat.value ? 'border-emerald-300 bg-emerald-50/50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <input
                      type="radio"
                      className="mt-1 h-4 w-4 text-emerald-600"
                      checked={form.category === cat.value}
                      onChange={() => updateForm('category', cat.value)}
                    />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{cat.label}</p>
                      <p className="text-xs text-gray-600">{cat.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Namespace / Brand ID (Optional)</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                  placeholder="your_business_namespace"
                  value={form.namespace}
                  onChange={(e) => updateForm('namespace', e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Description / Internal Notes (Optional)</label>
                <input
                  type="text"
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                  placeholder="For team reference"
                  value={form.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Header Section */}
          <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Header Section (Optional)</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-emerald-600 rounded"
                  checked={form.hasHeader}
                  onChange={(e) => {
                    updateForm('hasHeader', e.target.checked);
                    if (!e.target.checked) {
                      updateForm('headerFormat', 'NONE');
                      updateForm('headerText', '');
                      updateForm('headerMediaUrl', '');
                    }
                  }}
                />
                <span className="text-sm text-gray-600">Enable header</span>
              </label>
            </div>

            {form.hasHeader && (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-700">Header Type</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {HEADER_FORMATS.filter(f => f.value !== 'NONE').map((format) => (
                      <button
                        key={format.value}
                        className={`px-4 py-2 rounded-full border text-sm font-medium transition ${form.headerFormat === format.value
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        onClick={() => {
                          updateForm('headerFormat', format.value);
                          updateForm('headerText', '');
                          updateForm('headerMediaUrl', '');
                        }}
                      >
                        {format.label}
                      </button>
                    ))}
                  </div>
                </div>

                {form.headerFormat === 'TEXT' && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Header Text</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                      placeholder="Your header text"
                      maxLength={60}
                      value={form.headerText}
                      onChange={(e) => updateForm('headerText', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">{form.headerText.length}/60</p>
                  </div>
                )}

                {['IMAGE', 'DOCUMENT', 'VIDEO'].includes(form.headerFormat) && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{form.headerFormat} URL</label>
                    <input
                      type="url"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                      placeholder="https://example.com/media.jpg"
                      value={form.headerMediaUrl}
                      onChange={(e) => updateForm('headerMediaUrl', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-1">Provide a URL or upload file</p>
                  </div>
                )}
              </>
            )}
          </section>

          {/* Body Section */}
          <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Body Section <span className="text-red-500">*</span>
            </h2>

            <div>
              <label className="text-sm font-medium text-gray-700">Body Text</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-3 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500 min-h-[160px]"
                value={form.bodyText}
                onChange={(e) => updateForm('bodyText', e.target.value)}
                placeholder="Hello {{1}}, your order {{2}} is ready for pickup."
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                <div className="flex items-center gap-2">
                  <Info className="h-3 w-3" />
                  <span>Use <code className="bg-gray-100 px-1 rounded">{'{{1}}'}</code> for first variable, <code className="bg-gray-100 px-1 rounded">{'{{2}}'}</code> for second. Don't add HTML.</span>
                </div>
                <span>{form.bodyText.length}/1024</span>
              </div>
            </div>

            {/* Variable samples */}
            {extractedVariables.length > 0 && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">Sample Values for Preview</p>
                <div className="grid gap-3 md:grid-cols-2">
                  {extractedVariables.map((varNum) => (
                    <div key={varNum}>
                      <label className="text-xs font-medium text-gray-700">
                        Variable {'{{' + varNum + '}}'}
                      </label>
                      <input
                        type="text"
                        className="mt-1 w-full rounded-lg border border-emerald-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                        value={form.sampleValues[varNum.toString()] || ''}
                        onChange={(e) =>
                          updateForm('sampleValues', {
                            ...form.sampleValues,
                            [varNum.toString()]: e.target.value,
                          })
                        }
                        placeholder={`Sample value for {{${varNum}}}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Footer Section */}
          <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Footer Section (Optional)</h2>

            <div>
              <label className="text-sm font-medium text-gray-700">Footer Text</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm shadow-sm focus:ring-1 focus:ring-emerald-500"
                placeholder="Thank you for your business"
                maxLength={60}
                value={form.footerText}
                onChange={(e) => updateForm('footerText', e.target.value)}
              />
              <p className="text-xs text-gray-500 text-right mt-1">{form.footerText.length}/60</p>
            </div>
          </section>

          {/* Buttons Section */}
          <section className="rounded-2xl bg-white border border-gray-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Buttons / Interactive Elements (Optional)</h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => addButton('QUICK_REPLY')}
                  size="sm"
                  variant="outline"
                  disabled={form.buttons.length >= 3}
                >
                  Quick Reply
                </Button>
                <Button
                  onClick={() => addButton('URL')}
                  size="sm"
                  variant="outline"
                  disabled={form.buttons.length >= 3}
                >
                  URL
                </Button>
                <Button
                  onClick={() => addButton('PHONE_NUMBER')}
                  size="sm"
                  variant="outline"
                  disabled={form.buttons.length >= 3}
                >
                  Call
                </Button>
              </div>
            </div>

            {form.buttons.length === 0 && (
              <p className="text-sm text-gray-500">No buttons added yet. Maximum 3 buttons allowed.</p>
            )}

            <div className="space-y-3">
              {form.buttons.map((button, idx) => (
                <div key={button.id} className="rounded-xl border border-gray-200 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">
                      Button {idx + 1} - {button.type.replace('_', ' ')}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      onClick={() => removeButton(button.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-700">Button Text (max 20 chars)</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                      placeholder="Button label"
                      maxLength={20}
                      value={button.text}
                      onChange={(e) => updateButton(button.id, 'text', e.target.value)}
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">{button.text.length}/20</p>
                  </div>

                  {button.type === 'URL' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">URL</label>
                      <input
                        type="url"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="https://example.com"
                        value={button.url || ''}
                        onChange={(e) => updateButton(button.id, 'url', e.target.value)}
                      />
                    </div>
                  )}

                  {button.type === 'PHONE_NUMBER' && (
                    <div>
                      <label className="text-xs font-medium text-gray-700">Phone Number (E.164 format)</label>
                      <input
                        type="tel"
                        className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        placeholder="+1234567890"
                        value={button.phone_number || ''}
                        onChange={(e) => updateButton(button.id, 'phone_number', e.target.value)}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column - Preview */}
        {renderPreview()}
      </div>

      {/* Action buttons */}
      <div className="mt-8 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={() => setForm(DEFAULT_STATE)}>
          Reset
        </Button>
        <Button variant="outline" onClick={() => { validate(); setShowPayload(true); }}>
          Validate
        </Button>
        <Button variant="primary" onClick={handleExport}>
          Export JSON
        </Button>
      </div>
    </div>
  );
};

export default WhatsAppTemplateBuilder;
