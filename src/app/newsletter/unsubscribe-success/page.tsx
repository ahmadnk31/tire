import React from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnsubscribeSuccessPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <Card className="bg-white shadow-lg rounded-lg">
        <CardHeader className="pb-6 text-center border-b">
          <div className="flex justify-center mb-4">
            <CheckCircle size={64} className="text-blue-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-blue-700">Unsubscribed Successfully</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 text-center">
          <p className="text-gray-700 mb-4">
            You have been successfully unsubscribed from our newsletter.
          </p>
          <p className="text-gray-700 mb-4">
            We&apos;re sorry to see you go. If you have a moment, we&lsquo;d appreciate your feedback on how we could improve our newsletters.
          </p>
          <p className="text-gray-700">
            You can always resubscribe at any time if you change your mind.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Link href="/" passHref>
            <Button size="lg" className="bg-primary hover:bg-primary/90">
              Return to Homepage
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}