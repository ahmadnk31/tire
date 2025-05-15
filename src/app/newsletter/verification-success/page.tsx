import React from "react";
import Link from "next/link";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function VerificationSuccessPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-lg">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg rounded-xl border-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-green-500" />
        
        <CardHeader className="pb-6 text-center relative">
          <div className="absolute inset-0 bg-green-500/10 rounded-t-xl" />
          <div className="relative">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-white p-3 shadow-md">
                <CheckCircle size={40} className="text-green-500" strokeWidth={2.5} />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-green-700">
              Email Verified Successfully!
            </CardTitle>
            <CardDescription className="text-green-600 mt-2">
              You're now part of our newsletter community
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 px-6 space-y-4 text-center">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <p className="text-gray-700 mb-2">
              Thank you for verifying your email address. Your subscription to our
              newsletter has been confirmed.
            </p>
            <p className="text-gray-700">
              You are now signed up to receive our latest updates, promotions, and
              tire care tips directly to your inbox.
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 bg-green-50 p-3 rounded-lg">
            <CheckCircle size={20} className="text-green-500" />
            <p className="text-green-700 font-medium">
              We're excited to have you join our community!
            </p>
          </div>
          
          <div className="border border-dashed border-blue-200 rounded-lg p-4 mt-6">
            <h3 className="text-blue-700 font-semibold mb-2">What happens next?</h3>
            <ul className="text-left text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-blue-700 font-bold text-xs mr-2 mt-0.5">1</span>
                <span>We'll send you our next newsletter soon</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-blue-700 font-bold text-xs mr-2 mt-0.5">2</span>
                <span>Check out our latest promotions on our website</span>
              </li>
              <li className="flex items-start">
                <span className="bg-blue-100 rounded-full w-5 h-5 flex items-center justify-center text-blue-700 font-bold text-xs mr-2 mt-0.5">3</span>
                <span>You can unsubscribe at any time</span>
              </li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-center pt-2 pb-6">
          <Link href="/" passHref>
            <Button size="lg" className={cn(
              "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600",
              "text-white shadow-md transform transition-transform hover:scale-105"
            )}>
              <ArrowLeft className="mr-2 h-5 w-5" /> Return to Homepage
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
