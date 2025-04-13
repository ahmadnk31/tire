import { useState, useEffect, useRef } from 'react';
import { useLoadScript, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ["places"];
type AddressData = {
  addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    formatted: string;
};

export default function AddressAutocomplete({ onAddressSelected, placeholder }: { onAddressSelected: (data: AddressData) => void; placeholder?: string; }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });
  
  const [address, setAddress] = useState("");
  const autocompleteRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoaded || !window.google || !autocompleteRef.current) return;
    
    const autocomplete = new window.google.maps.places.Autocomplete(
      autocompleteRef.current,
      { types: ['address'] }
    );
    
    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      
      if (!place.geometry) return;
      
      // Extract address components
      const addressComponents = place.address_components || [];
      const extractAddressComponent = (type: string, short = false) => {
        const component = addressComponents.find(c => c.types.includes(type));
        return component ? (short ? component.short_name : component.long_name) : "";
      };
      
      // Format the address data to your required structure
      const addressData = {
        addressLine1: `${extractAddressComponent('street_number')} ${extractAddressComponent('route')}`.trim(),
        addressLine2: '',
        city: extractAddressComponent('locality'),
        state: extractAddressComponent('administrative_area_level_1'),
        postalCode: extractAddressComponent('postal_code'),
        country: extractAddressComponent('country'),
        formatted: place.formatted_address || "",
      };
      
      setAddress(place.formatted_address ?? "");
      
      // Pass the formatted address up to the parent component
      onAddressSelected(addressData);
    });
  }, [isLoaded, onAddressSelected]);

  if (loadError) return <div>Error loading Google Maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div>
      <input
        ref={autocompleteRef}
        type="text"
        placeholder={placeholder || "Enter your address"}
        value={address}
        onChange={e => setAddress(e.target.value)}
        className="w-full p-2 border rounded-md"
      />
    </div>
  );
}