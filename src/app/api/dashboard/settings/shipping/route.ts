import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { ShippingService } from "@/lib/shipping/shipping-service";
import { prisma } from "@/lib/db";

// Key for storing the default shipping provider in the database
const DEFAULT_SHIPPING_PROVIDER_KEY = 'default_shipping_provider';

/**
 * GET /api/dashboard/settings/shipping
 * Retrieves current shipping settings including available providers and default provider
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin/retailer permissions
    const session = await getServerSession(authOptions);
    if (!session?.user || 
        (session.user.role !== "ADMIN" && session.user.role !== "RETAILER")) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 403 }
      );
    }

    // Get available providers and current default provider
    const availableProviders = await ShippingService.getAvailableProviders();
    const defaultProvider = await ShippingService.getDefaultProvider();

    // Check if we have a setting in the database
    const storedSetting = await prisma.systemSetting.findUnique({
      where: {
        key: DEFAULT_SHIPPING_PROVIDER_KEY
      }
    });

    // If we have a stored setting, use it and make sure the service is updated
    if (storedSetting && storedSetting.value !== defaultProvider) {
      await ShippingService.setDefaultProvider(storedSetting.value);
      return NextResponse.json({
        availableProviders,
        defaultProvider: storedSetting.value
      });
    }
    
    // If no stored setting but we have a default, save it
    if (!storedSetting && defaultProvider) {
      await prisma.systemSetting.create({
        data: {
          key: DEFAULT_SHIPPING_PROVIDER_KEY,
          value: defaultProvider
        }
      });
    }

    return NextResponse.json({
      availableProviders,
      defaultProvider
    });
  } catch (error) {
    console.error("Error fetching shipping settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dashboard/settings/shipping
 * Updates shipping settings, such as the default provider
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin permissions
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized access. Only admins can change shipping settings." },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { defaultProvider } = body;

    if (!defaultProvider) {
      return NextResponse.json(
        { error: "Default provider is required" },
        { status: 400 }
      );
    }

    // Make sure the provider exists
    const availableProviders = await ShippingService.getAvailableProviders();
    if (!availableProviders.includes(defaultProvider)) {
      return NextResponse.json(
        { error: `Provider '${defaultProvider}' not found` },
        { status: 400 }
      );
    }

    // Update the default provider in the shipping service
    await ShippingService.setDefaultProvider(defaultProvider);

    // Store or update the setting in the database
    await prisma.systemSetting.upsert({
      where: {
        key: DEFAULT_SHIPPING_PROVIDER_KEY
      },
      update: {
        value: defaultProvider
      },
      create: {
        key: DEFAULT_SHIPPING_PROVIDER_KEY,
        value: defaultProvider
      }
    });

    // Return updated settings
    return NextResponse.json({
      defaultProvider,
      availableProviders,
      message: `Default provider updated to ${defaultProvider}`
    });
  } catch (error) {
    console.error("Error updating shipping settings:", error);
    return NextResponse.json(
      { error: "Failed to update shipping settings" },
      { status: 500 }
    );
  }
}