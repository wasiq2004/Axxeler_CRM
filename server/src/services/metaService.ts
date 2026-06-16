import axios from 'axios';
import { env } from '../config/env.js';

const graphBase = `https://graph.facebook.com/${env.WHATSAPP_GRAPH_VERSION}`;

export interface MetaCreds {
  appId: string;
  appSecret: string;
  redirectUri: string;
  webhookVerifyToken: string;
}

export const metaService = {
  async getOAuthUrl(state: string, creds: Pick<MetaCreds, 'appId' | 'redirectUri'>) {
    const params = new URLSearchParams({
      client_id: creds.appId,
      redirect_uri: creds.redirectUri,
      state,
      scope: [
        'ads_read',
        'business_management',
        'leads_retrieval',
        'pages_read_engagement',
        'pages_show_list',
        'whatsapp_business_management',
        'whatsapp_business_messaging',
      ].join(','),
      response_type: 'code',
    });
    return `https://www.facebook.com/${env.WHATSAPP_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
  },

  async exchangeCode(code: string, creds: Pick<MetaCreds, 'appId' | 'appSecret' | 'redirectUri'>) {
    const { data } = await axios.get(`${graphBase}/oauth/access_token`, {
      params: {
        client_id: creds.appId,
        client_secret: creds.appSecret,
        redirect_uri: creds.redirectUri,
        code,
      },
    });
    return data as { access_token: string; token_type: string; expires_in?: number };
  },

  async getMe(accessToken: string) {
    const { data } = await axios.get(`${graphBase}/me`, {
      params: { access_token: accessToken, fields: 'id,name,email' },
    });
    return data as { id: string; name: string; email?: string };
  },

  async getAdAccounts(accessToken: string) {
    const { data } = await axios.get(`${graphBase}/me/adaccounts`, {
      params: { access_token: accessToken, fields: 'name,account_id,currency,timezone_name' },
    });
    return data.data || [];
  },

  async getCampaigns(accessToken: string, adAccountId: string) {
    const { data } = await axios.get(`${graphBase}/${adAccountId}/campaigns`, {
      params: {
        access_token: accessToken,
        fields: 'id,name,status,objective,created_time,start_time,stop_time,insights{spend,clicks,impressions,reach,leads}',
        limit: 100,
      },
    });
    return (data.data || []).map((c: any) => {
      const ins = c.insights?.data?.[0] || {};
      return {
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
        created_time: c.created_time,
        start_time: c.start_time,
        stop_time: c.stop_time,
        spend: parseFloat(ins.spend) || 0,
        clicks: parseInt(ins.clicks) || 0,
        impressions: parseInt(ins.impressions) || 0,
        reach: parseInt(ins.reach) || 0,
        leads_count: parseInt(ins.leads) || 0,
      };
    });
  },

  // Get Facebook Pages the user manages (needed to access Lead Ad forms)
  async getPages(accessToken: string) {
    const { data } = await axios.get(`${graphBase}/me/accounts`, {
      params: { access_token: accessToken, fields: 'id,name,access_token,category,fan_count' },
    });
    return data.data || [];
  },

  // Get Lead Gen forms for a Facebook Page
  async getLeadForms(accessToken: string, pageId: string, pageAccessToken?: string) {
    const token = pageAccessToken || accessToken;
    const { data } = await axios.get(`${graphBase}/${pageId}/leadgen_forms`, {
      params: {
        access_token: token,
        fields: 'id,name,leads_count,status,created_time,last_updated_time',
        limit: 50,
      },
    });
    return data.data || [];
  },

  // Get leads submitted to a specific Lead Form
  async getFormLeads(accessToken: string, formId: string) {
    const { data } = await axios.get(`${graphBase}/${formId}/leads`, {
      params: {
        access_token: accessToken,
        fields: 'id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id',
        limit: 200,
      },
    });
    return data.data || [];
  },

  // Get a single lead by its ID (used for webhook real-time processing)
  async getLead(accessToken: string, leadId: string) {
    const { data } = await axios.get(`${graphBase}/${leadId}`, {
      params: {
        access_token: accessToken,
        fields: 'id,created_time,field_data,ad_id,ad_name,campaign_id,campaign_name,form_id',
      },
    });
    return data;
  },

  async sendWhatsAppMessage(phoneNumberId: string, accessToken: string, payload: unknown) {
    const { data } = await axios.post(`${graphBase}/${phoneNumberId}/messages`, payload, {
      params: { access_token: accessToken },
    });
    return data;
  },

  async submitTemplate(wabaId: string, accessToken: string, payload: unknown) {
    const { data } = await axios.post(`${graphBase}/${wabaId}/message_templates`, payload, {
      params: { access_token: accessToken },
    });
    return data;
  },
};
