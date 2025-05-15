/**
 * Types for GLS Shipping API integration
 */

/**
 * Address structure for transit shipments
 */
export interface TransitAddress {
  name1: string;
  name2?: string;
  street1: string;
  street2?: string;
  houseNumber?: string;
  postcode: string;
  city1: string;
  stateOrRegion?: string;
  countryCode: string; // ISO 3166-1 ALPHA 2 standard (e.g., DE for Germany)
}

/**
 * Weight with unit specification
 * GLS API expects "amount" and "KGM" as the unit
 */
export interface Weight {
  amount: number;
  unit: "KGM"; // GLS only accepts 'KGM' as weight unit
}

/**
 * Line item for transit shipment
 */
export interface TransitLineItem {
  commodityCode: string; // 6-8 digits, based on Harmonised System (HS)
  goodsDescription: string; // Description in English or import country language
  grossWeight: Weight; // Total weight with packaging
  netWeight: Weight; // Weight of goods without packaging
}

/**
 * Party responsible for exporting/importing goods
 */
export interface TransitParty {
  address: TransitAddress;
}

/**
 * Transit shipment data structure for GLS API
 */
export interface TransitShipment {
  parcelNumbers: string[]; // Must match pattern "^(\\d{11}|[A-Z0-9]{8})$"
  saveAsDraft?: boolean; // Set true to save as draft and prevent automatic processing
  exporter: TransitParty; // Exporter/sender details
  importer: TransitParty; // Importer/receiver details
  lineItems: TransitLineItem[]; // Items being shipped (1-999 items)
}
