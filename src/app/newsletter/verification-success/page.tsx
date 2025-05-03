import React from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function VerificationSuccessPage() {
  return (
    <div className='container mx-auto py-12 px-4 max-w-lg'>
      <Card className='bg-white shadow-lg rounded-lg'>
        <CardHeader className='pb-6 text-center border-b'>
          <div className='flex justify-center mb-4'>
            <CheckCircle size={64} className='text-green-500' />
          </div>
          <CardTitle className='text-2xl font-bold text-green-700'>
            Email Verified Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className='pt-6 px-6 text-center'>
          <p className='text-gray-700 mb-4'>
            Thank you for verifying your email address. Your subscription to our
            newsletter has been confirmed.
          </p>
          <p className='text-gray-700 mb-4'>
            You are now signed up to receive our latest updates, promotions, and
            tire care tips directly to your inbox.
          </p>
          <p className='text-gray-700 font-semibold'>
            We&apos;re excited to have you join our community!
          </p>
        </CardContent>
        <CardFooter className='flex justify-center pt-2 pb-6'>
          <Link href='/' passHref>
            <Button size='lg' className='bg-primary hover:bg-primary/90'>
              Return to Homepage
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
