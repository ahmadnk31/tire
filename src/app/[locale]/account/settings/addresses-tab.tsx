import React from 'react';
import { AddressManager } from "@/components/account/address-manager";
import { TabsContent } from "@/components/ui/tabs";

interface AddressesTabProps {
  t: (key: string) => string;
}

export function AddressesTab({ t }: AddressesTabProps) {
  return (
    <TabsContent value="addresses" className="space-y-4">
      <AddressManager t={t} />
    </TabsContent>
  );
}
