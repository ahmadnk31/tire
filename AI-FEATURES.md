# AI Features in Tire Shop

This document describes the AI-powered features implemented in the Tire Shop application.

## 1. AI Product Description Generator

### Overview

The AI Product Description Generator uses computer vision technology to analyze tire images and automatically generate detailed, marketing-ready product descriptions. This feature saves time and ensures consistent, high-quality product descriptions across your catalog.

### How to Use

1. **From the Admin Dashboard:**
   - Navigate to Products in the admin dashboard
   - When creating or editing a product, you'll find an "AI Generate Description" button next to the description field
   - Click the button to open the AI description generator interface

2. **Using the Generator:**
   - Upload a tire image (JPEG, PNG, or WebP, max 5MB)
   - Optionally customize the AI prompt to focus on specific tire features
   - Click "Generate Description" and wait for the AI to analyze the image
   - Review the generated description and click "Use This Description" to apply it to the product

3. **Edit as Needed:**
   - The AI-generated description can be edited manually before saving
   - You can regenerate descriptions as many times as needed

### Technical Details

- Uses OpenAI's GPT-4 Vision API to analyze images and generate descriptions
- Supports multiple image formats (JPEG, PNG, WebP)
- Performance metrics are tracked in the AIUsageLog table
- Descriptions highlight key features like tire type, tread pattern, benefits, and suitable vehicle types

## 2. Improved Chat Support System

### Overview

The chat support system now includes enhanced error handling, support for multilingual chats, and proper handling of different message types (customer, agent, and system messages).

### Features

- **Robust Error Handling**: Better validation and error messages for chat operations
- **Multilingual Support**: Chat support respects the user's language preference
- **Message Type Handling**: Properly handles different message types with appropriate UI rendering
- **Real-time Updates**: Uses Pusher for real-time message delivery
- **Optimistic UI Updates**: Messages appear immediately while being sent to the server

### Technical Details

- Messages are validated on both client and server sides
- Case-insensitive message type handling
- Improved error recovery when messages fail to send
- Automatically marks agent messages as read
- Support for system-generated messages

## Setup and Configuration

### Required Environment Variables

To use the AI features, you need to set the following environment variables:

```
# OpenAI API for product descriptions
OPENAI_API_KEY=your_openai_api_key

# Pusher for real-time chat
NEXT_PUBLIC_PUSHER_APP_ID=your_pusher_app_id
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_SECRET=your_pusher_secret
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

### Database Setup

The AI features use a new `AIUsageLog` table which was added to the database schema. Run migrations to add this table:

```bash
npx prisma migrate dev --name add_ai_usage_logs
```

## Limitations and Future Improvements

- The AI description generator works best with clear, high-quality images
- Processing large images may take longer and consume more API tokens
- Currently only supports English product descriptions (multilingual support coming soon)
- Future versions will add AI-powered customer service suggestions to the chat support system 