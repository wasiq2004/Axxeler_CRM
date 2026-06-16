// Meta API Service - Simulated implementation for demonstration
// In a real application, this would make actual HTTP requests to Meta's Graph API

interface MetaApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

interface AdAccount {
  id: string;
  name: string;
  account_id: string;
  currency: string;
  timezone_name: string;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
  created_time: string;
  start_time?: string;
  stop_time?: string;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  created_time: string;
  start_time?: string;
  end_time?: string;
  daily_budget?: string;
  targeting?: any;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  created_time: string;
  creative?: {
    id: string;
    name: string;
  };
}

interface Lead {
  id: string;
  created_time: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Meta API Service
export class MetaApiService {
  private static accessToken: string | null = null;
  
  static setAccessToken(token: string) {
    this.accessToken = token;
  }
  
  static async getAdAccounts(): Promise<MetaApiResponse<AdAccount[]>> {
    if (!this.accessToken) {
      return {
        data: [],
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(800);
      
      // Simulated response
      const adAccounts: AdAccount[] = [
        {
          id: 'act_123456789',
          name: 'Primary Business Account',
          account_id: '123456789',
          currency: 'USD',
          timezone_name: 'America/New_York'
        },
        {
          id: 'act_987654321',
          name: 'Secondary Business Account',
          account_id: '987654321',
          currency: 'EUR',
          timezone_name: 'Europe/London'
        }
      ];
      
      return {
        data: adAccounts,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: 'Failed to fetch ad accounts'
      };
    }
  }
  
  static async getCampaigns(adAccountId: string): Promise<MetaApiResponse<Campaign[]>> {
    if (!this.accessToken) {
      return {
        data: [],
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(1000);
      
      // Simulated response
      const campaigns: Campaign[] = [
        {
          id: 'campaign_123456789',
          name: 'Winter Sale Campaign',
          status: 'ACTIVE',
          objective: 'LEAD_GENERATION',
          created_time: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
          start_time: new Date(Date.now() - 86400000 * 7).toISOString()
        },
        {
          id: 'campaign_987654321',
          name: 'Product Launch Campaign',
          status: 'ACTIVE',
          objective: 'CONVERSIONS',
          created_time: new Date(Date.now() - 86400000 * 30).toISOString(), // 30 days ago
          start_time: new Date(Date.now() - 86400000 * 30).toISOString(),
          stop_time: new Date(Date.now() + 86400000 * 15).toISOString() // 15 days from now
        },
        {
          id: 'campaign_456789123',
          name: 'Brand Awareness Campaign',
          status: 'PAUSED',
          objective: 'BRAND_AWARENESS',
          created_time: new Date(Date.now() - 86400000 * 15).toISOString(), // 15 days ago
          start_time: new Date(Date.now() - 86400000 * 15).toISOString(),
          stop_time: new Date(Date.now() - 86400000 * 2).toISOString() // 2 days ago
        }
      ];
      
      return {
        data: campaigns,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: 'Failed to fetch campaigns'
      };
    }
  }
  
  static async getAdSets(campaignId: string): Promise<MetaApiResponse<AdSet[]>> {
    if (!this.accessToken) {
      return {
        data: [],
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(800);
      
      // Simulated response
      const adSets: AdSet[] = [
        {
          id: `adset_${campaignId}_1`,
          name: 'Ad Set 1',
          status: 'ACTIVE',
          created_time: new Date(Date.now() - 86400000 * 5).toISOString(),
          start_time: new Date(Date.now() - 86400000 * 5).toISOString(),
          daily_budget: '5000' // $50.00 in cents
        },
        {
          id: `adset_${campaignId}_2`,
          name: 'Ad Set 2',
          status: 'ACTIVE',
          created_time: new Date(Date.now() - 86400000 * 3).toISOString(),
          start_time: new Date(Date.now() - 86400000 * 3).toISOString(),
          daily_budget: '7500' // $75.00 in cents
        }
      ];
      
      return {
        data: adSets,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: 'Failed to fetch ad sets'
      };
    }
  }
  
  static async getAds(adSetId: string): Promise<MetaApiResponse<Ad[]>> {
    if (!this.accessToken) {
      return {
        data: [],
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(700);
      
      // Simulated response
      const ads: Ad[] = [
        {
          id: `ad_${adSetId}_1`,
          name: 'Image Ad',
          status: 'ACTIVE',
          created_time: new Date(Date.now() - 86400000 * 2).toISOString(),
          creative: {
            id: 'creative_1',
            name: 'Image Creative 1'
          }
        },
        {
          id: `ad_${adSetId}_2`,
          name: 'Video Ad',
          status: 'ACTIVE',
          created_time: new Date(Date.now() - 86400000 * 1).toISOString(),
          creative: {
            id: 'creative_2',
            name: 'Video Creative 1'
          }
        }
      ];
      
      return {
        data: ads,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: 'Failed to fetch ads'
      };
    }
  }
  
  static async getLeads(formId: string): Promise<MetaApiResponse<Lead[]>> {
    if (!this.accessToken) {
      return {
        data: [],
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(900);
      
      // Simulated response
      const leads: Lead[] = [
        {
          id: `lead_${formId}_1`,
          created_time: new Date().toISOString(),
          field_data: [
            { name: 'full_name', values: ['Alice Johnson'] },
            { name: 'email', values: ['alice.j@example.com'] },
            { name: 'phone_number', values: ['+1-555-123-4567'] },
            { name: 'company_name', values: ['Tech Innovations Inc.'] }
          ]
        },
        {
          id: `lead_${formId}_2`,
          created_time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          field_data: [
            { name: 'full_name', values: ['Bob Smith'] },
            { name: 'email', values: ['bob.s@example.net'] },
            { name: 'phone_number', values: ['+1-555-987-6543'] }
          ]
        }
      ];
      
      return {
        data: leads,
        success: true
      };
    } catch (error) {
      return {
        data: [],
        success: false,
        error: 'Failed to fetch leads'
      };
    }
  }
  
  static async getInsights(objectId: string, objectType: 'campaign' | 'adset' | 'ad'): Promise<MetaApiResponse<any>> {
    if (!this.accessToken) {
      return {
        data: {},
        success: false,
        error: 'No access token provided'
      };
    }
    
    try {
      // Simulate API call delay
      await delay(600);
      
      // Simulated response
      const insights = {
        id: objectId,
        spend: Math.floor(Math.random() * 5000) + 1000, // Random spend between $10-500
        clicks: Math.floor(Math.random() * 10000) + 100,
        impressions: Math.floor(Math.random() * 100000) + 1000,
        reach: Math.floor(Math.random() * 50000) + 500,
        conversions: Math.floor(Math.random() * 500) + 10
      };
      
      return {
        data: insights,
        success: true
      };
    } catch (error) {
      return {
        data: {},
        success: false,
        error: 'Failed to fetch insights'
      };
    }
  }
}

export default MetaApiService;
