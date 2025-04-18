"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useTranslations } from "next-intl";
import CustomerSupportChat from "@/components/CustomerSupportChat";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Car, Ruler, Search, TrendingUp, Snowflake, Sun, Mountain, Gauge } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { IconRoad } from "@tabler/icons-react";

// Import our new TanStack Query hooks
import { usePopularVehicles, useVehicleMakes, useVehicleModels, useVehicleYears } from "@/hooks/use-vehicle-api";
import { Link } from "@/i18n/navigation";

// Width options for tire size (in mm)
const widthOptions = [
  "155", "165", "175", "185", "195", "205", "215", "225", "235", 
  "245", "255", "265", "275", "285", "295", "305", "315", "325", "335", "345", "355"
];

// Aspect ratio options (as %)
const aspectRatioOptions = [
  "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85"
];

// Rim diameter options (in inches)
const rimDiameterOptions = [
  "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "26", "28", "30"
];

// Popular tire types from the enum in the schema with proper icons
const popularTireTypes = [
  { id: "ALL_SEASON", name: "All Season", description: "Best for year-round use in moderate climates", icon: <Sun className="h-5 w-5" /> },
  { id: "WINTER", name: "Winter", description: "Specially designed for snow, ice, and cold temperatures", icon: <Snowflake className="h-5 w-5" /> },
  { id: "SUMMER", name: "Summer", description: "Designed for optimal performance in warm weather", icon: <Sun className="h-5 w-5" /> },
  { id: "ALL_TERRAIN", name: "All Terrain", description: "Great for on and off-road driving", icon: <Mountain className="h-5 w-5" /> },
  { id: "HIGH_PERFORMANCE", name: "High Performance", description: "Designed for speed and handling", icon: <Gauge className="h-5 w-5" /> },
  { id: "TOURING", name: "Touring", description: "Balanced comfort and performance for everyday driving", icon: <IconRoad className="h-5 w-5" /> }
];

export default function TireFinder() {
  const router = useRouter();
  const t = useTranslations('TireFinder');
  
  // State for vehicle tab
  const [vehicleTab, setVehicleTab] = useState({
    makeId: "",
    modelId: "",
    year: "",
  });

  // State for tire size tab
  const [sizeTab, setSizeTab] = useState({
    width: "",
    ratio: "",
    diameter: "",
  });
  
  // Use React Query hooks for data fetching
  const { 
    data: makes = [], 
    isLoading: loadingMakes 
  } = useVehicleMakes();
  
  const { 
    data: models = [], 
    isLoading: loadingModels 
  } = useVehicleModels(vehicleTab.makeId);
  
  const { 
    data: years = [], 
    isLoading: loadingYears 
  } = useVehicleYears(vehicleTab.modelId);
  
  // Use TanStack Query hook for popular vehicles
  const { 
    data: popularVehicles = [], 
    isLoading: loadingPopularVehicles
  } = usePopularVehicles();

  // Function to handle make selection
  const handleMakeSelect = (makeId: string) => {
    setVehicleTab({ makeId, modelId: "", year: "" });
  };

  // Function to handle model selection
  const handleModelSelect = (modelId: string) => {
    setVehicleTab({ ...vehicleTab, modelId, year: "" });
  };

  // Function to handle year selection
  const handleYearSelect = (year: string) => {
    setVehicleTab({ ...vehicleTab, year });
  };

  // Function to search by vehicle
  const searchByVehicle = () => {
    if (vehicleTab.makeId && vehicleTab.modelId && vehicleTab.year) {
      // Construct search URL with vehicle parameters
      router.push(`/products?makeId=${vehicleTab.makeId}&modelId=${vehicleTab.modelId}&year=${vehicleTab.year}`);
    }
  };

  // Function to search by tire size
  const searchBySize = () => {
    if (sizeTab.width && sizeTab.ratio && sizeTab.diameter) {
      // Construct search URL with tire size parameters
      router.push(`/products?width=${sizeTab.width}&aspectRatio=${sizeTab.ratio}&rimDiameter=${sizeTab.diameter}`);
    }
  };

  return (
    <div className="container mx-auto py-16 px-4">
      <div className="text-center max-w-3xl mx-auto mb-12">
        <h1 className="text-4xl font-bold mb-4">{t('title')}</h1>
        <p className="text-lg text-gray-600">
          {t('subtitle')}
        </p>
      </div>
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden mb-16">
        <Tabs defaultValue="vehicle" className="w-full">
          <div className="px-6 pt-6">
            <TabsList className="w-full flex">
              <TabsTrigger value="vehicle" className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2">
                <Car className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{t('tabs.vehicle')}</span>
              </TabsTrigger>
              <TabsTrigger value="size" className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2">
                <Ruler className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm whitespace-nowrap">{t('tabs.size')}</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="vehicle" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicle.make')}</label>
                {loadingMakes ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={vehicleTab.makeId}
                    onValueChange={handleMakeSelect}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={t('vehicle.selectMake')} />
                    </SelectTrigger>
                    <SelectContent>
                      {makes.map((make) => (
                        <SelectItem key={make.id} value={make.id}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicle.model')}</label>
                {loadingModels ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={vehicleTab.modelId}
                    onValueChange={handleModelSelect}
                    disabled={!vehicleTab.makeId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={vehicleTab.makeId ? t('vehicle.selectModel') : t('vehicle.selectMakeFirst')} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('vehicle.year')}</label>
                {loadingYears ? (
                  <Skeleton className="h-9 w-full" />
                ) : (
                  <Select
                    value={vehicleTab.year}
                    onValueChange={handleYearSelect}
                    disabled={!vehicleTab.modelId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={vehicleTab.modelId ? t('vehicle.selectYear') : t('vehicle.selectModelFirst')} />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            
            <Button 
              onClick={searchByVehicle} 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              disabled={!vehicleTab.makeId || !vehicleTab.modelId || !vehicleTab.year || loadingMakes || loadingModels || loadingYears}
            >
              <Search className="mr-2 h-4 w-4" />
              {t('vehicle.findTiresButton')}
            </Button>
          </TabsContent>
            <TabsContent value="size" className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('size.width')}</label>
                <Select
                  value={sizeTab.width}
                  onValueChange={(value) => setSizeTab({ ...sizeTab, width: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('size.selectWidth')} />
                  </SelectTrigger>
                  <SelectContent>
                    {widthOptions.map((width) => (
                      <SelectItem key={width} value={width}>
                        {width} mm
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-center text-xl font-bold md:hidden mt-1">/</div>
              </div>
              
              <div className="text-center text-xl font-bold self-end mb-2 hidden md:flex justify-center items-center">/</div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('size.aspectRatio')}</label>
                <Select
                  value={sizeTab.ratio}
                  onValueChange={(value) => setSizeTab({ ...sizeTab, ratio: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('size.selectRatio')} />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatioOptions.map((ratio) => (
                      <SelectItem key={ratio} value={ratio}>
                        {ratio}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-center text-xl font-bold md:hidden mt-1">R</div>
              </div>
              
              <div className="text-center text-xl font-bold self-end mb-2 hidden md:flex justify-center items-center">R</div>
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('size.diameter')}</label>
                <Select
                  value={sizeTab.diameter}
                  onValueChange={(value) => setSizeTab({ ...sizeTab, diameter: value })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t('size.selectDiameter')} />
                  </SelectTrigger>
                  <SelectContent>
                    {rimDiameterOptions.map((diameter) => (
                      <SelectItem key={diameter} value={diameter}>
                        {diameter}"
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 bg-gray-50 p-4 rounded-md text-center">
              <p className="text-lg font-medium">
                {sizeTab.width && sizeTab.ratio && sizeTab.diameter ? (
                  <span className="text-blue-700">
                    {sizeTab.width}/{sizeTab.ratio}R{sizeTab.diameter}
                  </span>
                ) : (
                  <span className="text-gray-500">
                    {t('size.tireSizePlaceholder')}
                  </span>
                )}
              </p>
            </div>
            
            <Button 
              onClick={searchBySize} 
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700"
              disabled={!sizeTab.width || !sizeTab.ratio || !sizeTab.diameter}
            >
              <Search className="mr-2 h-4 w-4" />
              {t('size.findTiresSizeButton')}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Popular Tire Types Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">{t('tireTypes.title')}</h2>
          <p className="text-gray-600 mt-2">
            {t('tireTypes.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {popularTireTypes.map((type) => (
            <Link href={`/products?tireType=${type.id}`} key={type.id}>
              <Card className="hover:shadow-lg transition-shadow duration-300 h-full border border-gray-200 hover:border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className="text-blue-600">
                      {type.icon}
                    </div>
                    <span>{t(`tireTypes.${type.id}.name`)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{t(`tireTypes.${type.id}.description`)}</CardDescription>
                </CardContent>
                <CardFooter className="text-blue-600 text-sm font-medium">
                  {t('tireTypes.viewTires', { type: t(`tireTypes.${type.id}.name`) })}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Popular Vehicles Section */}
      <section className="mb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold">{t('popularVehicles.title')}</h2>
          <p className="text-gray-600 mt-2">
            {t('popularVehicles.subtitle')}
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {popularVehicles.map((vehicle, index) => (
            <Link 
              href={`/products?make=${encodeURIComponent(vehicle.make)}&model=${encodeURIComponent(vehicle.model)}`} 
              key={index}
              className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow duration-300 border border-gray-100 hover:border-blue-100"
            >
              <div className="aspect-square relative">
                <Image
                  src={vehicle.image}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3 text-center">
                <h3 className="font-medium text-sm">{vehicle.make}</h3>
                <p className="text-gray-600 text-sm">{vehicle.model}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
        {/* Help Section */}
      <section className="bg-gray-50 rounded-xl p-8 border border-gray-200">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-4">{t('help.title')}</h2>
          <p className="text-gray-600 mb-6">
            {t('help.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
              {t('help.contactSupport')}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => (window as any).openChatSupport?.()}>
              {t('help.chatExpert')}
            </Button>
          </div>
        </div>
      </section>
      
      {/* Customer Support Chat powered by Pusher */}
      <CustomerSupportChat />
    </div>
  );
}