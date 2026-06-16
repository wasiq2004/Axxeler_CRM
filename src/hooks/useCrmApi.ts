import { useState, useEffect } from 'react';
import { useApi } from '../contexts/ApiContext';

// Custom hook to demonstrate API usage
export const useCrmApi = () => {
  const { crmApi, metaApi } = useApi();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Example function to fetch leads
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crmApi.getLeads();
      setLeads(response.data || []);
    } catch (err) {
      setError('Failed to fetch leads');
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example function to create a lead
  const createLead = async (leadData: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await crmApi.createLead(leadData);
      // Refresh leads after creating a new one
      await fetchLeads();
      return response;
    } catch (err) {
      setError('Failed to create lead');
      console.error('Error creating lead:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Example function to connect to Meta
  const connectToMeta = async (accessToken: string) => {
    setLoading(true);
    setError(null);
    
    try {
      metaApi.setAccessToken(accessToken);
      const response = await metaApi.getAdAccounts();
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to connect to Meta');
      }
    } catch (err) {
      setError('Failed to connect to Meta');
      console.error('Error connecting to Meta:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    leads,
    loading,
    error,
    fetchLeads,
    createLead,
    connectToMeta
  };
};
