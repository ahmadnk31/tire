import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDays, Clock, PenTool, Truck, ShieldCheck, BadgeCheck } from "lucide-react";

export const metadata = {
  title: "Tire Installation Services | Premium Tire Shop",
  description: "Professional tire installation, rotation, balancing and alignment services. Schedule an appointment today.",
};

export default function InstallationPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[50vh] w-full bg-gradient-to-r from-blue-900 to-gray-900 overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10 container mx-auto flex flex-col items-center justify-center h-full text-center p-4">
          <div className="w-full max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
              Expert Tire Installation & Services
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Our professional technicians provide top-quality tire installation and maintenance to keep you safe on the road.
            </p>
            <Link href="#schedule-appointment">
              <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600 px-8 shadow-lg shadow-blue-500/30">
                Schedule Service
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Installation Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We offer a comprehensive range of tire services to ensure your vehicle's optimal performance and safety.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <PenTool className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Tire Installation</CardTitle>
                <CardDescription>Professional mounting and balancing for new tires</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Expert mounting of new tires</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Computer precision balancing</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Proper torque and inflation</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Valve stem replacement</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-blue-700 mb-2">From $20 per tire</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 12 L12 8" />
                    <path d="M12 12 L16 14" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Tire Rotation</CardTitle>
                <CardDescription>Extend tire life with regular rotation service</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Promotes even tire wear</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Multi-point inspection included</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Proper torque application</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Tire pressure adjustment</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-blue-700 mb-2">From $50 per service</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Wheel Alignment</CardTitle>
                <CardDescription>Precise alignment for optimal handling and tire life</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Computerized alignment system</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Adjusts camber, caster, and toe angles</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Prevents uneven tire wear</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Improves vehicle handling</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-blue-700 mb-2">From $89.99</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">Tire Inspection</CardTitle>
                <CardDescription>Comprehensive tire health evaluation</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Tread depth measurement</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Sidewall condition check</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Pressure testing and adjustment</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Valve stem inspection</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-green-600 mb-2">FREE</p>
                  <p className="text-sm text-gray-500">With any service</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Tire Balancing</CardTitle>
                <CardDescription>Eliminate vibration for a smooth ride</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Computerized balance technology</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Eliminates steering wheel vibration</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Prevents uneven tire wear</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Extends tire lifespan</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-blue-700 mb-2">From $15 per tire</p>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border border-gray-200 hover:border-blue-200 hover:shadow-md transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <CardTitle className="text-xl">Flat Tire Repair</CardTitle>
                <CardDescription>Quick and reliable puncture repairs</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Puncture location and assessment</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Professional patch or plug repair</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Tire re-balancing included</span>
                  </li>
                  <li className="flex items-start">
                    <BadgeCheck className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 text-sm">Safety inspection</span>
                  </li>
                </ul>
                <div className="mt-6 text-center">
                  <p className="text-lg font-bold text-blue-700 mb-2">From $25 per repair</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Installation Process Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Our Installation Process</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our expert technicians follow a meticulous process to ensure your tires are installed correctly and safely.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">1</div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">Vehicle Check-In</h3>
              <p className="text-gray-600 text-center">We inspect your vehicle and document its condition before beginning any work.</p>
              <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-1 bg-blue-200 -z-10"></div>
            </div>
            
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">2</div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">Tire Preparation</h3>
              <p className="text-gray-600 text-center">We remove old tires and prepare the wheels for new tire installation.</p>
              <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-1 bg-blue-200 -z-10"></div>
            </div>
            
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">3</div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">Mounting & Balancing</h3>
              <p className="text-gray-600 text-center">We mount your new tires and use computerized balancing for a smooth ride.</p>
              <div className="hidden lg:block absolute top-8 left-[calc(100%-8px)] w-full h-1 bg-blue-200 -z-10"></div>
            </div>
            
            <div className="relative">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">4</div>
              <h3 className="text-xl font-bold mb-3 text-center text-gray-900">Final Inspection</h3>
              <p className="text-gray-600 text-center">We perform a quality check to ensure everything is properly installed and safe.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Schedule Appointment Section */}
      <section id="schedule-appointment" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Schedule Your Appointment</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Book your tire installation or service appointment online. It's quick and easy!
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto bg-gray-50 rounded-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <p className="text-lg font-medium text-gray-900 mb-4">Choose one of the following options to schedule your appointment:</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/appointment">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                    Schedule Online
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="border-gray-300 hover:bg-gray-100 px-8">
                  Call (555) 123-4567
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="flex items-start">
                <CalendarDays className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Business Hours</h4>
                  <p className="text-gray-600 text-sm">Monday - Friday: 8:00 AM - 6:00 PM</p>
                  <p className="text-gray-600 text-sm">Saturday: 9:00 AM - 4:00 PM</p>
                  <p className="text-gray-600 text-sm">Sunday: Closed</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <Clock className="h-6 w-6 text-blue-600 mr-3 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Service Duration</h4>
                  <p className="text-gray-600 text-sm">Tire Installation: 45-60 minutes</p>
                  <p className="text-gray-600 text-sm">Tire Rotation: 30 minutes</p>
                  <p className="text-gray-600 text-sm">Wheel Alignment: 60 minutes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Find answers to common questions about our tire installation and services.
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Tabs defaultValue="installation" className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger value="installation">Installation</TabsTrigger>
                <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
                <TabsTrigger value="pricing">Pricing</TabsTrigger>
              </TabsList>
              
              <TabsContent value="installation">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">How long does tire installation take?</h3>
                    <p className="text-gray-600">Typically, a complete set of four tires takes about 45-60 minutes to install. This includes mounting, balancing, and ensuring proper inflation and torque.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Do I need an appointment for tire installation?</h3>
                    <p className="text-gray-600">While we can sometimes accommodate walk-ins, we strongly recommend scheduling an appointment to ensure prompt service and minimize your wait time.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Can I bring my own tires for installation?</h3>
                    <p className="text-gray-600">Yes, we can install tires that you've purchased elsewhere. Our standard installation rates will apply.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="maintenance">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">How often should I rotate my tires?</h3>
                    <p className="text-gray-600">We recommend rotating your tires every 5,000-7,500 miles to ensure even wear and extend tire life. This may vary based on your vehicle and driving habits.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">How do I know when I need an alignment?</h3>
                    <p className="text-gray-600">Signs that you may need an alignment include uneven tire wear, your vehicle pulling to one side, or your steering wheel being off-center when driving straight.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">How often should tires be balanced?</h3>
                    <p className="text-gray-600">Tires should be balanced when they're installed and rebalanced when you experience vibration. It's also good practice to have them balanced when doing a rotation.</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pricing">
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">What is included in your installation price?</h3>
                    <p className="text-gray-600">Our standard installation includes mounting, computer balancing, new rubber valve stems, proper torquing, and disposal of your old tires.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Do you offer any service packages?</h3>
                    <p className="text-gray-600">Yes, we offer various service packages that can include installation, alignment, and future rotations at a discounted price. Ask about our packages when you schedule your service.</p>
                  </div>
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-bold mb-2 text-gray-900">Is there an additional cost for TPMS service?</h3>
                    <p className="text-gray-600">If your vehicle has Tire Pressure Monitoring System (TPMS) sensors, there may be an additional charge for servicing these components during installation.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-6">Ready to Schedule Your Tire Service?</h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-blue-100">
            Our expert technicians are ready to help you with all your tire installation and maintenance needs.
          </p>
          <Link href="/appointment">
            <Button size="lg" className="bg-blue-500 text-white hover:bg-blue-600 px-8 py-6 text-lg shadow-lg shadow-blue-500/20">
              Book An Appointment
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}