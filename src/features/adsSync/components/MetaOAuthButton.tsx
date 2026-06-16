import React, { useState } from 'react';
import { Facebook } from 'lucide-react';
import { useMetaAccount } from '../../../contexts/MetaAccountContext';

interface MetaOAuthButtonProps {
  onConnectSuccess?: () => void;
  onConnectError?: (error: string) => void;
}

const MetaOAuthButton: React.FC<MetaOAuthButtonProps> = ({ onConnectError }) => {
  const { initiateOAuth } = useMetaAccount();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleClick = async () => {
    setIsConnecting(true);
    try {
      // Fetches the OAuth URL from backend, then redirects browser to Meta's login
      await initiateOAuth();
      // If META_APP_ID is not configured, this throws — handled below
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to initiate OAuth';
      onConnectError?.(msg);
      setIsConnecting(false);
    }
    // If redirect succeeds, the component unmounts — no need to reset loading state
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg shadow transition-all"
    >
      <Facebook className="w-5 h-5" />
      {isConnecting ? 'Redirecting to Meta…' : 'Continue with Facebook / Meta'}
    </button>
  );
};

export default MetaOAuthButton;
