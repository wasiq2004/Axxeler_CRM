import React, { useState } from 'react';
import { Link, Plus, CheckCircle, XCircle, Key, RefreshCw, Trash2, ArrowLeft } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';
import { useCampaignModule } from '../../contexts/CampaignModuleContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '@/components/ui/Button';

const AccountsPage: React.FC = () => {
  const { accounts, connectAccount, disconnectAccount, refreshAccount, removeAccount } = useCampaignModule();
  const { user } = useAuth();
  const [connectionType, setConnectionType] = useState<'oauth' | 'manual'>('oauth');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [accountId, setAccountId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleManualConnect = () => {
    if (!phoneNumber || !accountId || !wabaId || !accessToken) {
      alert('Please fill in all fields');
      return;
    }

    // Connect the account
    connectAccount({
      accountIdFromProvider: accountId,
      name: `WhatsApp (${phoneNumber})`,
      phoneNumber,
      tokenEncrypted: accessToken,
      connectedBy: user?.id || '',
      connectedAt: new Date().toISOString(),
      status: 'connected'
    });
    
    // Reset form
    setPhoneNumber('');
    setAccountId('');
    setWabaId('');
    setAccessToken('');
    setIsVerified(false);
    alert('Account connected successfully!');
  };

  const handleOAuthConnect = () => {
    // In a real implementation, this would redirect to OAuth flow
    alert('Redirecting to Google OAuth flow...');
    
    // For demo purposes, simulate a successful OAuth connection
    setTimeout(() => {
      connectAccount({
        accountIdFromProvider: `oauth_account_${Date.now()}`,
        name: 'WhatsApp Business Account (OAuth)',
        phoneNumber: '+1234567890',
        tokenEncrypted: 'oauth_token_encrypted',
        connectedBy: user?.id || '',
        connectedAt: new Date().toISOString(),
        status: 'connected'
      });
      alert('Account connected successfully via Google OAuth!');
    }, 1500);
  };

  const handleVerifyToken = () => {
    if (!accessToken) {
      alert('Please enter an access token');
      return;
    }
    
    setIsVerifying(true);
    // Simulate API verification
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
      alert('Token verified successfully!');
    }, 1500);
  };

  const handleDisconnect = (accountId: string) => {
    if (window.confirm('Are you sure you want to disconnect this account?')) {
      disconnectAccount(accountId);
    }
  };

  const handleRemove = (accountId: string) => {
    if (window.confirm('Are you sure you want to remove this account? This action cannot be undone.')) {
      // Remove the account completely
      removeAccount(accountId);
      alert('Account removed successfully!');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <RouterLink to="/campaigns" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Campaigns
        </RouterLink>
        <h1 className="text-2xl md:text-3xl font-bold text-text-main">Campaign Accounts</h1>
        <p className="text-text-light mt-1">Connect your WhatsApp Business or Official API accounts.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connect Account</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Connect via Google OAuth</h3>
            <p className="text-sm text-gray-500 mb-4">Connect your WhatsApp Business account using Google OAuth for easier setup.</p>
            <Button 
              variant="primary" 
              size="md" 
              icon={Link}
              onClick={handleOAuthConnect}
            >
              Connect with Google OAuth
            </Button>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Manual Entry</h3>
            <p className="text-sm text-gray-500 mb-4">Manually enter your account details and API credentials.</p>
            <Button 
              variant="outline" 
              size="md" 
              icon={Key}
              onClick={() => setConnectionType('manual')}
            >
              Enter Details Manually
            </Button>
          </div>
        </div>
        
        {connectionType === 'manual' && (
          <div className="mt-6 p-4 border border-gray-200 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Enter Account Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account ID</label>
                <input
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder="Enter your Account ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WABA ID</label>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="Enter your WABA ID"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Enter your access token"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="md" 
                  onClick={handleVerifyToken}
                  disabled={isVerifying || !accessToken}
                >
                  {isVerifying ? 'Verifying...' : 'Verify Token'}
                </Button>
                
                {isVerified && (
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    <span className="text-sm">Verified</span>
                  </div>
                )}
              </div>
              
              <Button 
                variant="primary" 
                size="md" 
                onClick={handleManualConnect}
                disabled={!isVerified}
              >
                Connect Account
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Connected Accounts</h2>
        
        {accounts.length === 0 ? (
          <div className="text-center py-8">
            <XCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No accounts connected yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className={`p-2 rounded-full mr-3 ${
                    account.status === 'connected' ? 'bg-green-100' : 
                    account.status === 'expiring_soon' ? 'bg-yellow-100' : 
                    'bg-red-100'
                  }`}>
                    <CheckCircle className={`w-5 h-5 ${
                      account.status === 'connected' ? 'text-green-600' : 
                      account.status === 'expiring_soon' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{account.name}</h3>
                    <p className="text-sm text-gray-500">{account.phoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${{
                    'connected': 'bg-green-100 text-green-800',
                    'disconnected': 'bg-red-100 text-red-800',
                    'expiring_soon': 'bg-yellow-100 text-yellow-800'
                  }[account.status] || 'bg-gray-100 text-gray-800'}`}>
                    {account.status.replace('_', ' ')}
                  </span>
                  {account.status === 'expiring_soon' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      icon={RefreshCw}
                      onClick={() => {
                        refreshAccount(account.id);
                        alert('Token refreshed successfully!');
                      }}
                    >
                      Refresh
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDisconnect(account.id)}
                  >
                    Disconnect
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    icon={Trash2}
                    onClick={() => handleRemove(account.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountsPage;
