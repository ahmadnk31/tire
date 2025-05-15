import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import OpenAI from 'openai';

// Initialize OpenAI with your API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get form data which includes the image file
    const formData = await request.formData();
    const imageFile = formData.get('image') as File | null;
    const productId = formData.get('productId') as string | null;
    const initialPrompt = formData.get('initialPrompt') as string | null;
    
    // Validate request
    if (!imageFile) {
      return NextResponse.json({ error: 'Image file is required' }, { status: 400 });
    }
    
    // Check if image is a valid format
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validMimeTypes.includes(imageFile.type)) {
      return NextResponse.json({ 
        error: 'Invalid file format. Please upload a JPEG, PNG, or WebP image.' 
      }, { status: 400 });
    }
    
    // Convert image to buffer for OpenAI API
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');
    
    // Default prompt for tire description
    const defaultPrompt = `This is an image of a tire. Please analyze it and create a detailed product description that includes:
    1. The apparent tire type and potential use cases (all-season, winter, performance, etc.)
    2. Notable tread pattern and design features
    3. Potential benefits of this tire design
    4. Suitable vehicle types for this tire
    5. Key selling points that would appeal to customers
    
    Format the description in professional, marketing-friendly language that would be suitable for an e-commerce product page.`;
    
    // Use provided prompt or default
    const finalPrompt = initialPrompt || defaultPrompt;
    
    // Make API call to OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: finalPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${imageFile.type};base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 500,
    });
    
    // Extract the generated description
    const generatedDescription = response.choices[0]?.message?.content || 'Failed to generate description';
    
    // If a product ID was provided, update the product description in the database
    if (productId) {
      try {
        await prisma.product.update({
          where: { id: productId },
          data: { description: generatedDescription }
        });
      } catch (error) {
        console.error('Failed to update product description:', error);
        // Continue anyway since we want to return the generated description
      }
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Log the usage for analytics
    await prisma.aiUsageLog.create({
      data: {
        feature: 'PRODUCT_DESCRIPTION',
        processingTimeMs: processingTime,
        productId: productId || undefined,
        successful: true,
      }
    }).catch(error => {
      // Non-blocking error handling for logging
      console.error('Failed to log AI usage:', error);
    });
    
    return NextResponse.json({
      description: generatedDescription,
      processingTimeMs: processingTime
    });
  } catch (error: any) {
    console.error('Error generating product description:', error);
    
    // Log the error
    await prisma.aiUsageLog.create({
      data: {
        feature: 'PRODUCT_DESCRIPTION',
        error: error.message || 'Unknown error',
        successful: false,
      }
    }).catch(e => {
      console.error('Failed to log AI usage error:', e);
    });
    
    return NextResponse.json(
      { error: 'Failed to generate product description', details: error.message },
      { status: 500 }
    );
  }
} 