import React from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export default function UnsubscribeSuccessPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 shadow-lg rounded-xl border-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500" />
        
        <CardHeader className="pb-6 text-center relative">
          <div className="absolute inset-0 bg-blue-500/10 rounded-t-xl" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-white p-3 shadow-md">
                <CheckCircle size={40} className="text-blue-500" strokeWidth={2.5} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-blue-700">
              Unsubscribed Successfully
            </CardTitle>
            <CardDescription className="text-blue-600 mt-2">
              You have been removed from our mailing list
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 px-6 space-y-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 mb-2">
              You have been successfully unsubscribed from our newsletter.
            </p>
            <p className="text-gray-700">
              We're sorry to see you go. If you have a moment, we'd appreciate your feedback on how we could improve our newsletters.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 bg-blue-50 p-3 rounded-lg">
            <RefreshCw size={20} className="text-blue-500" />
            <p className="text-blue-700 font-medium">
              You can always resubscribe at any time.
            </p>
          </div>
          
          <div className="border border-dashed border-slate-200 rounded-lg p-4 mt-6">
            <h3 className="text-slate-700 font-semibold mb-2">Feedback</h3>
            <p className="text-gray-600 text-sm mb-3">We value your opinion. Please let us know why you decided to unsubscribe:</p>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Link href="mailto:feedback@tire-shop.com?subject=Newsletter%20Feedback%3A%20Too%20Frequent" className="text-left p-2 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                Too frequent
              </Link>
              <Link href="mailto:feedback@tire-shop.com?subject=Newsletter%20Feedback%3A%20Not%20Relevant" className="text-left p-2 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                Not relevant
              </Link>
              <Link href="mailto:feedback@tire-shop.com?subject=Newsletter%20Feedback%3A%20Too%20Promotional" className="text-left p-2 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                Too promotional
              </Link>
              <Link href="mailto:feedback@tire-shop.com?subject=Newsletter%20Feedback%3A%20Other" className="text-left p-2 bg-white rounded border border-slate-200 hover:bg-slate-50 transition-colors">
                Other reason
              </Link>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between pt-2 pb-6">
          <Link href="/" passHref>
            <Button size="lg" className={cn(
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600",
              "text-white shadow-md transform transition-transform hover:scale-105"
            )}>
              <ArrowLeft className="mr-2 h-5 w-5" /> Return to Homepage
            </Button>
          </Link>
          <Link href="/newsletter/subscribe" passHref>
            <Button size="lg" variant="outline" className={cn(
              "border-blue-300 text-blue-700 hover:bg-blue-50",
              "shadow-sm transform transition-transform hover:scale-105"
            )}>
              <RefreshCw className="mr-2 h-5 w-5" /> Resubscribe
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}