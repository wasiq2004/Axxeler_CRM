
import { AdLead } from '../../types';

// These mock generators are legacy utilities — not used in the production flow.
// Types are intentionally loose to avoid maintenance burden.
type MetaCampaign = any;
type MetaAdSet = any;
type MetaAd = any;

interface AdCampaign {
    id: string;
    name: string;
}

// Helper to generate mock leads
export const generateMockLeads = (campaigns: any[]): (AdLead & { isImported: boolean })[] => {
    const leads: (AdLead & { isImported: boolean })[] = [];
    const firstNames = ['John', 'Jane', 'Michael', 'Emily', 'David', 'Sarah', 'Robert', 'Jessica'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
    const companies = ['Tech Inc', 'Global Solutions', 'Innovate LLC', 'Future Corp', 'Alpha Industries', 'Omega Systems'];

    campaigns.forEach(campaign => {
        // Generate 3-8 leads per campaign
        const numLeads = Math.floor(Math.random() * 6) + 3;

        for (let i = 0; i < numLeads; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const company = companies[Math.floor(Math.random() * companies.length)];
            const date = new Date();
            date.setDate(date.getDate() - Math.floor(Math.random() * 30));

            leads.push({
                id: `lead_${campaign.id}_${i}`,
                created_time: date.toISOString(),
                ad_name: `Ad Variant ${String.fromCharCode(65 + Math.floor(Math.random() * 3))}`,
                campaign_name: campaign.name,
                form_name: 'Lead Generation Form',
                field_data: {
                    full_name: `${firstName} ${lastName}`,
                    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
                    phone_number: `+1555${Math.floor(Math.random() * 10000000).toString().padStart(7, '0')}`,
                    company_name: company
                },
                isImported: Math.random() > 0.7 // 30% chance of being imported
            });
        }
    });

    return leads.sort((a, b) => new Date(b.created_time).getTime() - new Date(a.created_time).getTime());
};

export const generateMockCampaigns = (): MetaCampaign[] => {
    return [
        {
            id: 'camp_1',
            name: 'Summer Sale 2024 - Awareness',
            status: 'ACTIVE',
            objective: 'OUTCOME_AWARENESS',
            created_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            spend: 1250.50,
            clicks: 4500,
            impressions: 125000,
            reach: 85000,
            conversions: 120,
            leads_count: 120
        },
        {
            id: 'camp_2',
            name: 'Q3 Lead Gen - Tech Sector',
            status: 'ACTIVE',
            objective: 'OUTCOME_LEADS',
            created_time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            spend: 850.75,
            clicks: 1200,
            impressions: 45000,
            reach: 30000,
            conversions: 85,
            leads_count: 85
        },
        {
            id: 'camp_3',
            name: 'Retargeting - Website Visitors',
            status: 'PAUSED',
            objective: 'OUTCOME_TRAFFIC',
            created_time: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
            stop_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            spend: 2100.00,
            clicks: 3800,
            impressions: 95000,
            reach: 60000,
            conversions: 210,
            leads_count: 210
        },
        {
            id: 'camp_4',
            name: 'New Product Launch',
            status: 'ACTIVE',
            objective: 'OUTCOME_SALES',
            created_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            spend: 450.25,
            clicks: 650,
            impressions: 15000,
            reach: 12000,
            conversions: 35,
            leads_count: 35
        },
        {
            id: 'camp_5',
            name: 'Holiday Special Promo',
            status: 'ARCHIVED',
            objective: 'OUTCOME_SALES',
            created_time: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 115 * 24 * 60 * 60 * 1000).toISOString(),
            stop_time: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
            spend: 5000.00,
            clicks: 10500,
            impressions: 350000,
            reach: 280000,
            conversions: 550,
            leads_count: 550
        }
    ];
};

export const generateMockAdSets = (campaignId: string): MetaAdSet[] => {
    return [
        {
            id: `adset_${campaignId}_1`,
            name: 'US - 25-45 - Tech Interests',
            campaign_id: campaignId,
            status: 'ACTIVE',
            created_time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: `adset_${campaignId}_2`,
            name: 'EU - 30+ - Business Owners',
            campaign_id: campaignId,
            status: 'PAUSED',
            created_time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: `adset_${campaignId}_3`,
            name: 'Lookalike - Top Spenders 1%',
            campaign_id: campaignId,
            status: 'ACTIVE',
            created_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            start_time: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
};

export const generateMockAds = (campaignId: string): MetaAd[] => {
    return [
        {
            id: `ad_${campaignId}_1`,
            name: 'Video - Product Demo v1',
            adset_id: `adset_${campaignId}_1`,
            campaign_id: campaignId,
            creative_id: `creative_${campaignId}_1`,
            status: 'ACTIVE',
            created_time: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            insights: {
                ctr: 1.2,
                cpc: 0.85,
                cpm: 12.50,
                actions: []
            }
        },
        {
            id: `ad_${campaignId}_2`,
            name: 'Image - Lifestyle Shot',
            adset_id: `adset_${campaignId}_1`,
            campaign_id: campaignId,
            creative_id: `creative_${campaignId}_2`,
            status: 'ACTIVE',
            created_time: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            insights: {
                ctr: 0.9,
                cpc: 0.65,
                cpm: 8.50,
                actions: []
            }
        },
        {
            id: `ad_${campaignId}_3`,
            name: 'Carousel - Features',
            adset_id: `adset_${campaignId}_2`,
            campaign_id: campaignId,
            creative_id: `creative_${campaignId}_3`,
            status: 'PAUSED',
            created_time: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            insights: {
                ctr: 1.5,
                cpc: 1.10,
                cpm: 15.00,
                actions: []
            }
        }
    ];
};
