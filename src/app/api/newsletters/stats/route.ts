import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db'; // Adjust the import based on your project structure



export async function GET() {
  try {
    // Get current date and date 30 days ago for growth calculations
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(now.getDate() - 60);

    // Get total subscribers
    const totalSubscribers = await prisma.subscriber.count({
      where: {
        subscribed: true
      }
    });

    // Get new subscribers from last 30 days
    const newSubscribers = await prisma.subscriber.count({
      where: {
        subscribed: true,
        subscribedAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    // Get sent newsletters
    const sentNewsletters = await prisma.newsletter.findMany({
      where: {
        status: 'SENT',
        sentAt: { not: null }
      }
    });

    // Total number of sent campaigns
    const sentCampaigns = sentNewsletters.length;

    // Calculate new campaigns in the last 30 days
    const newCampaigns = sentNewsletters.filter(
      newsletter => newsletter.sentAt && newsletter.sentAt >= thirtyDaysAgo
    ).length;

    // Calculate average open rate and click rate
    let totalOpenRate = 0;
    let totalClickRate = 0;
    let newslettersWithStats = 0;

    sentNewsletters.forEach(newsletter => {
      if (newsletter.openRate !== null) {
        totalOpenRate += newsletter.openRate;
        newslettersWithStats++;
      }
      
      if (newsletter.clickRate !== null) {
        totalClickRate += newsletter.clickRate;
      }
    });

    // Average open and click rates
    const openRate = newslettersWithStats > 0 ? 
      parseFloat((totalOpenRate / newslettersWithStats).toFixed(1)) : 0;
    
    const clickRate = newslettersWithStats > 0 ? 
      parseFloat((totalClickRate / newslettersWithStats).toFixed(1)) : 0;

    // Calculate growth rates
    // For previous period (60-30 days ago)
    const previousPeriodNewsSent = await prisma.newsletter.count({
      where: {
        status: 'SENT',
        sentAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });

    const previousPeriodSubscribers = await prisma.subscriber.count({
      where: {
        subscribed: true,
        subscribedAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      }
    });    // Get previous period stats for accurate growth calculation
    // Get newsletters from previous period (60-30 days ago)
    const previousPeriodNewsletters = await prisma.newsletter.findMany({
      where: {
        status: 'SENT',
        sentAt: {
          gte: sixtyDaysAgo,
          lt: thirtyDaysAgo
        }
      },
      select: {
        openRate: true,
        clickRate: true
      }
    });

    // Calculate previous period rates
    let previousPeriodOpenRate = 0;
    let previousPeriodClickRate = 0;
    let previousPeriodNewslettersWithStats = 0;

    previousPeriodNewsletters.forEach(newsletter => {
      if (newsletter.openRate !== null) {
        previousPeriodOpenRate += newsletter.openRate;
        previousPeriodNewslettersWithStats++;
      }
      
      if (newsletter.clickRate !== null) {
        previousPeriodClickRate += newsletter.clickRate;
      }
    });

    // Average previous period rates
    const avgPreviousPeriodOpenRate = previousPeriodNewslettersWithStats > 0 ? 
      parseFloat((previousPeriodOpenRate / previousPeriodNewslettersWithStats).toFixed(1)) : 0;
    
    const avgPreviousPeriodClickRate = previousPeriodNewslettersWithStats > 0 ? 
      parseFloat((previousPeriodClickRate / previousPeriodNewslettersWithStats).toFixed(1)) : 0;

    // Calculate actual growth metrics
    const campaignsGrowth = previousPeriodNewsSent > 0 ? 
      newCampaigns - previousPeriodNewsSent : newCampaigns;
    
    const subscribersGrowth = previousPeriodSubscribers > 0 ? 
      newSubscribers - previousPeriodSubscribers : newSubscribers;

    // Calculate rate changes (percentage points difference, not percent change)
    const openRateGrowth = avgPreviousPeriodOpenRate > 0 ? 
      parseFloat((openRate - avgPreviousPeriodOpenRate).toFixed(1)) : 0;
      
    const clickRateGrowth = avgPreviousPeriodClickRate > 0 ? 
      parseFloat((clickRate - avgPreviousPeriodClickRate).toFixed(1)) : 0;

    const stats = {
      totalSubscribers,
      openRate,
      sentCampaigns,
      clickRate,
      growth: {
        subscribers: subscribersGrowth,
        openRate: openRateGrowth,
        campaigns: campaignsGrowth,
        clickRate: clickRateGrowth
      }
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching newsletter stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch newsletter statistics' },
      { status: 500 }
    );
  }
}
