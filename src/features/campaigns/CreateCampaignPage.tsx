import React, { useState, useMemo } from 'react';
import { ArrowLeft, Send, Clock, Users, Upload, FileText, CheckCircle, ChevronRight, AlertCircle, Calendar, MessageSquare } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCampaignModule } from '../../contexts/CampaignModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '@/components/ui/Button';

const steps = [
  { id: 'details', title: 'Campaign Details', icon: FileText },
  { id: 'audience', title: 'Target Audience', icon: Users },
  { id: 'message', title: 'Message Content', icon: MessageSquare }, // Changed from Send to MessageSquare for better clarity
  { id: 'review', title: 'Review & Schedule', icon: CheckCircle },
];

const CreateCampaignPage: React.FC = () => {
  const navigate = useNavigate();
  const { accounts, templates, importJobs, createCampaign } = useCampaignModule();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);

  // Campaign basic info
  const [name, setName] = useState('');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');

  // Message type and template
  const [messageType, setMessageType] = useState<'template' | 'free_text'>('template');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [messageBody, setMessageBody] = useState('');

  // Template variables mapping
  const [variableMappings, setVariableMappings] = useState<Record<string, string>>({});

  // Schedule
  const [scheduleType, setScheduleType] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Recipients selection type
  const [recipientType, setRecipientType] = useState<'manual' | 'import' | 'meta'>('manual');

  // Manual entry
  const [manualPhoneNumbers, setManualPhoneNumbers] = useState('');
  const [saveManualAsContacts, setSaveManualAsContacts] = useState(false);
  const [defaultCountryCode, setDefaultCountryCode] = useState('+1');

  // Import leads
  const [selectedImportJobId, setSelectedImportJobId] = useState('');
  const [selectedImportedLeads, setSelectedImportedLeads] = useState<string[]>([]);
  const [convertToContacts, setConvertToContacts] = useState(false);
  const [dedupeKey, setDedupeKey] = useState<'phone' | 'email'>('phone');

  // Meta ads (Placeholder state as per original file)
  const [selectedPageId, setSelectedPageId] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const [metaDateRange, setMetaDateRange] = useState({ start: '', end: '' });
  const [includeUnsentLeads, setIncludeUnsentLeads] = useState(false);
  const [autoSyncNewLeads, setAutoSyncNewLeads] = useState(false);
  const [triggerFollowUp, setTriggerFollowUp] = useState(false);

  // Test send
  const [testPhoneNumber, setTestPhoneNumber] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);

  // Derived state
  const selectedAccount = useMemo(() => accounts.find(a => a.id === accountId), [accounts, accountId]);
  const accountTemplates = useMemo(() => templates.filter(t => t.accountId === accountId && t.status === 'APPROVED'), [templates, accountId]);
  const selectedTemplate = useMemo(() => templates.find(t => t.id === selectedTemplateId), [templates, selectedTemplateId]);
  const completedImportJobs = useMemo(() => importJobs.filter(j => j.status === 'completed'), [importJobs]);

  const recipientCount = useMemo(() => {
    switch (recipientType) {
      case 'manual': return manualPhoneNumbers.split('\n').filter(p => p.trim() !== '').length;
      case 'import': return selectedImportedLeads.length;
      case 'meta': return 0;
      default: return 0;
    }
  }, [recipientType, manualPhoneNumbers, selectedImportedLeads]);

  // Handlers
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setMessageBody(template.components.find(c => c.type === 'BODY')?.text || '');
      const mappings: Record<string, string> = {};
      template.variables.forEach(v => mappings[v] = '');
      setVariableMappings(mappings);
    }
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      if (!name.trim()) return alert('Please enter a campaign name');
      if (!accountId) return alert('Please select a sender profile');
    } else if (step === 1) {
      if (recipientType === 'manual' && !manualPhoneNumbers.trim()) return alert('Please enter at least one phone number');
      if (recipientType === 'import' && !selectedImportJobId) return alert('Please select an import job');
    } else if (step === 2) {
      if (messageType === 'template' && !selectedTemplateId) return alert('Please select a message template');
      if (messageType === 'free_text' && !messageBody.trim()) return alert('Please enter message content');
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleCreateCampaign = () => {
    // ... (logic from original file)
    let scheduledAt: string | undefined;
    if (scheduleType === 'scheduled') {
      if (!scheduledDate || !scheduledTime) return alert("Please select date and time");
      scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
    }

    // Construct target query
    let targetQuery: any = { type: 'manual', value: {} };
    if (recipientType === 'manual') {
      targetQuery = { type: 'manual', value: { phones: manualPhoneNumbers.split('\n').map(p => p.trim()).filter(Boolean), saveAsContacts: saveManualAsContacts, defaultCountryCode } };
    } else if (recipientType === 'import') {
      targetQuery = { type: 'imported_csv_job', value: { jobId: selectedImportJobId, selectedLeads: selectedImportedLeads, convertToContacts, dedupeKey } };
    }

    const newCampaign = {
      name,
      senderAccountId: accountId,
      messageType,
      messageBody,
      variables: selectedTemplate?.variables || [],
      targetQuery,
      scheduleAt: scheduledAt,
      status: scheduleType === 'immediate' ? 'sending' : 'scheduled',
      createdBy: user?.id || '',
      id: `camp_${Date.now()}` // Temporary
    };

    // @ts-ignore
    createCampaign(newCampaign);
    alert('Campaign created successfully!');
    // @ts-ignore
    navigate(`/campaigns/${newCampaign.id}`);
  };

  return (
    <div className="max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link to="/campaigns" className="p-2 rounded-full hover:bg-gray-100 mr-4 text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="text-gray-500 text-sm mt-1">reach your audience with WhatsApp campaigns</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />

          {steps.map((step, index) => {
            const isCurrent = currentStep === index;
            const isCompleted = currentStep > index;
            const Icon = step.icon;

            return (
              <div key={step.id} className="flex flex-col items-center bg-gray-50 px-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-200 ${isCompleted ? 'bg-green-500 border-green-500 text-white' :
                      isCurrent ? 'bg-white border-[#0079C1] text-[#0079C1]' :
                        'bg-white border-gray-300 text-gray-300'
                    }`}
                >
                  {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-xs font-semibold mt-2 ${isCurrent ? 'text-[#0079C1]' : 'text-gray-500'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 min-h-[400px]">

        {/* Step 1: Details */}
        {currentStep === 0 && (
          <div className="space-y-6 max-w-2xl mx-auto animate-fadeIn">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Sale 2026"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0079C1] focus:border-[#0079C1] transition-all"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sender Profile (From)</label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0079C1] focus:border-[#0079C1] bg-white transition-all"
              >
                {accounts.filter(a => a.status === 'connected').map(account => (
                  <option key={account.id} value={account.id}>{account.name} ({account.phoneNumber})</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Select the WhatsApp Business account to send from.</p>
            </div>
          </div>
        )}

        {/* Step 2: Audience */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { id: 'manual', title: 'Manual Entry', desc: 'Type or paste numbers', icon: FileText },
                { id: 'import', title: 'Import list', desc: 'Use CSV or contacts', icon: Upload },
                { id: 'meta', title: 'Meta Lead Ads', desc: 'From Facebook/Insta', icon: Users },
              ].map((type) => (
                <div
                  key={type.id}
                  onClick={() => setRecipientType(type.id as any)}
                  className={`cursor-pointer border-2 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:border-[#0079C1]/50 hover:bg-blue-50/30 ${recipientType === type.id ? 'border-[#0079C1] bg-blue-50' : 'border-gray-100'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${recipientType === type.id ? 'bg-[#0079C1] text-white' : 'bg-gray-100 text-gray-500'}`}>
                    <type.icon className="w-6 h-6" />
                  </div>
                  <h3 className={`font-semibold ${recipientType === type.id ? 'text-[#0079C1]' : 'text-gray-900'}`}>{type.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{type.desc}</p>
                </div>
              ))}
            </div>

            {recipientType === 'manual' && (
              <div className="animate-fadeIn">
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Numbers (One per line)</label>
                <textarea
                  value={manualPhoneNumbers}
                  onChange={(e) => setManualPhoneNumbers(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0079C1] focus:border-[#0079C1] font-mono text-sm"
                  placeholder="+1234567890&#10;+919876543210"
                />
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Default Country Code:</span>
                    <select
                      value={defaultCountryCode}
                      onChange={(e) => setDefaultCountryCode(e.target.value)}
                      className="border-gray-300 rounded-md text-sm focus:ring-[#0079C1] focus:border-[#0079C1]"
                    >
                      <option value="+1">+1 (US)</option><option value="+91">+91 (IN)</option><option value="+44">+44 (UK)</option>
                    </select>
                  </div>
                  <span className="text-sm font-medium text-gray-500">
                    {manualPhoneNumbers.split('\n').filter(l => l.trim()).length} Recipients
                  </span>
                </div>
              </div>
            )}

            {recipientType === 'import' && (
              <div className="animate-fadeIn max-w-2xl mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Import Job</label>
                <select
                  value={selectedImportJobId}
                  onChange={(e) => setSelectedImportJobId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0079C1] focus:border-[#0079C1]"
                >
                  <option value="">-- Choose file --</option>
                  {completedImportJobs.map(job => (
                    <option key={job.id} value={job.id}>{job.fileName} ({job.importedRows} rows)</option>
                  ))}
                </select>
                <Link to="/campaigns/import" className="inline-block mt-2 text-sm text-[#0079C1] hover:underline font-medium">Upload new CSV</Link>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Message */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-center mb-6">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setMessageType('template')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${messageType === 'template' ? 'bg-white text-[#0079C1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Template Message
                </button>
                <button
                  onClick={() => setMessageType('free_text')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${messageType === 'free_text' ? 'bg-white text-[#0079C1] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Free Text (24h Window)
                </button>
              </div>
            </div>

            {messageType === 'template' ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Template List */}
                <div className="border border-gray-200 rounded-xl overflow-hidden flex flex-col h-[500px]">
                  <div className="p-4 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 flex justify-between items-center">
                    <span>Select Template</span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{accountTemplates.length} Approved</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {accountTemplates.map(t => (
                      <div
                        key={t.id}
                        onClick={() => handleTemplateSelect(t.id)}
                        className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-all ${selectedTemplateId === t.id ? 'border-[#0079C1] bg-blue-50/50 ring-1 ring-[#0079C1]' : 'border-gray-200'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-gray-900">{t.name}</span>
                          <span className="text-xs text-gray-500 uppercase">{t.language}</span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{t.components.find(c => c.type === 'BODY')?.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview & Variables */}
                <div className="space-y-6">
                  <div className="bg-[#e5ddd5] p-6 rounded-xl relative shadow-inner min-h-[300px]">
                    <div className="bg-white p-3 rounded-lg shadow-sm max-w-[85%] relative">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">
                        {messageBody || 'Select a template to preview...'}
                      </p>
                      <div className="text-[10px] text-gray-400 text-right mt-1">12:42 PM</div>
                    </div>
                  </div>

                  {selectedTemplate && selectedTemplate.variables.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3 text-sm">Variables</h4>
                      <div className="space-y-3">
                        {selectedTemplate.variables.map(v => (
                          <div key={v} className="flex flex-col">
                            <label className="text-xs font-semibold text-gray-500 mb-1 pl-1">{'{{' + v + '}}'}</label>
                            <input
                              type="text"
                              placeholder={`Value for ${v}`}
                              value={variableMappings[v] || ''}
                              onChange={(e) => setVariableMappings(prev => ({ ...prev, [v]: e.target.value }))}
                              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-[#0079C1] focus:border-[#0079C1]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">Free text messages can only be sent to users who have messaged you within the last 24 hours. For marketing, please use Templates.</p>
                </div>
                <textarea
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  rows={6}
                  placeholder="Type your message here..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0079C1] focus:border-[#0079C1]"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review & Schedule */}
        {currentStep === 3 && (
          <div className="animate-fadeIn max-w-3xl mx-auto space-y-8">
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-gray-500 mb-1">Campaign Name</span>
                  <span className="font-medium text-gray-900">{name}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Sender</span>
                  <span className="font-medium text-gray-900">{selectedAccount?.name}</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Recipients</span>
                  <span className="font-medium text-gray-900">{recipientCount} contacts</span>
                </div>
                <div>
                  <span className="block text-gray-500 mb-1">Message Type</span>
                  <span className="font-medium text-gray-900 capitalize">{messageType.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Sending Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center ${scheduleType === 'immediate' ? 'border-[#0079C1] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="schedule" checked={scheduleType === 'immediate'} onChange={() => setScheduleType('immediate')} className="w-5 h-5 text-[#0079C1]" />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-900">Send Immediately</span>
                    <span className="text-xs text-gray-500">Start campaign right now</span>
                  </div>
                </label>
                <label className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex items-center ${scheduleType === 'scheduled' ? 'border-[#0079C1] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="schedule" checked={scheduleType === 'scheduled'} onChange={() => setScheduleType('scheduled')} className="w-5 h-5 text-[#0079C1]" />
                  <div className="ml-3">
                    <span className="block font-medium text-gray-900">Schedule for Later</span>
                    <span className="text-xs text-gray-500">Pick a future date & time</span>
                  </div>
                </label>
              </div>

              {scheduleType === 'scheduled' && (
                <div className="mt-4 flex gap-4 animate-fadeIn">
                  <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
                  <input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-20 md:pl-72">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <Button variant="ghost" onClick={handleBack} disabled={currentStep === 0} className="text-gray-500 hover:text-gray-900">
            Back
          </Button>

          <div className="flex gap-3">
            <Link to="/campaigns">
              <Button variant="outline">Cancel</Button>
            </Link>
            {currentStep < steps.length - 1 ? (
              <Button variant="primary" onClick={handleNext} className="bg-[#0079C1] hover:bg-[#005a91] text-white px-8">
                Next Step <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button variant="primary" onClick={handleCreateCampaign} className="bg-green-600 hover:bg-green-700 text-white px-8">
                Launch Campaign <Send className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateCampaignPage;
