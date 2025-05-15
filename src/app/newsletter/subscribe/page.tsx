import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Gift, Bell, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NewsletterSubscription from '@/components/newsletter-subscription';
import { cn } from '@/lib/utils';

export default function SubscribePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center text-blue-700 hover:text-blue-900 font-medium mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Homepage
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-blue-900 mb-3">
                Join Our Newsletter
              </h1>
              <p className="text-blue-700 text-lg max-w-md">
                Stay informed with the latest tire news, exclusive deals, and expert advice
              </p>
            </div>
            
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4 border-l-4 border-green-500">
                    <div className="bg-green-50 p-2 rounded-full mr-4">
                      <Gift className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-800">Exclusive Offers</h3>
                      <p className="text-green-700 text-sm">Get access to subscriber-only discounts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4 border-l-4 border-blue-500">
                    <div className="bg-blue-50 p-2 rounded-full mr-4">
                      <Mail className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-800">Expert Advice</h3>
                      <p className="text-blue-700 text-sm">Seasonal tire tips and maintenance guidance</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center p-4 border-l-4 border-amber-500">
                    <div className="bg-amber-50 p-2 rounded-full mr-4">
                      <Bell className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800">New Arrivals</h3>
                      <p className="text-amber-700 text-sm">Be the first to know about new products</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="mt-8 text-sm text-blue-600">
                <p className="mb-2">
                  <span className="font-semibold">Privacy Policy:</span> We respect your privacy. We will never share your information with third parties.
                </p>
                <p>
                  <span className="font-semibold">Frequency:</span> We send newsletters 1-2 times per month.
                </p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-7 order-1 lg:order-2">
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-xl p-6 lg:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-30 -mt-20 -mr-20"></div>
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400 rounded-full opacity-20 -mb-20 -ml-20"></div>
              
              <div className="relative z-10">
                <div className="flex justify-center mb-6">
                  <div className="bg-white/10 backdrop-blur-sm p-3 rounded-full">
                    <Mail className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <NewsletterSubscription />
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-blue-700">10K+</div>
                <div className="text-xs text-blue-600">Happy Subscribers</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-blue-700">24</div>
                <div className="text-xs text-blue-600">Newsletters per Year</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-blue-700">100+</div>
                <div className="text-xs text-blue-600">Exclusive Offers</div>
              </div>
              <div className="bg-white/50 backdrop-blur-sm p-3 rounded-lg flex flex-col items-center text-center">
                <div className="text-2xl font-bold text-blue-700">4.9</div>
                <div className="text-xs text-blue-600">Customer Rating</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 