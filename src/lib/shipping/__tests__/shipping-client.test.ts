import { CartItem } from '@/contexts/cart-context';
import * as ShippingClient from '../shipping-client';

// Access the private createPackageDetails function using type assertion
const createPackageDetails = (ShippingClient as any).createPackageDetails;

describe('Shipping Client', () => {
  describe('createPackageDetails', () => {
    it('should return default package for empty items', () => {
      const items: CartItem[] = [];
      const packages = createPackageDetails(items);
      
      expect(packages).toHaveLength(1);
      expect(packages[0].description).toBe("Default tire package");
      expect(packages[0].weight).toBe(8); // DEFAULT_TIRE_WEIGHT_KG
    });

    it('should create packages from items with dimensions', () => {
      const items: CartItem[] = [
        {
          id: '1',
          name: 'Premium Tire',
          price: 120,
          quantity: 2,
          image: 'tire.jpg',
          size: '225/65R17',
          brandName: 'GoodTire',
          productId: 'p1',
          weight: 10,
          dimensions: {
            length: 70,
            width: 70,
            height: 22
          }
        },
        {
          id: '2',
          name: 'Economy Tire',
          price: 80,
          quantity: 4,
          image: 'tire2.jpg',
          size: '195/65R15',
          brandName: 'EcoTire',
          productId: 'p2',
          weight: 8,
          dimensions: {
            length: 65,
            width: 65,
            height: 20
          }
        }
      ];
      
      const packages = createPackageDetails(items);
      
      // We expect packages to be grouped by their dimensions
      expect(packages.length).toBeGreaterThan(0);
      
      // The first package should contain our first type of tire
      expect(packages.some(pkg => pkg.length === 70 && pkg.width === 70 && pkg.height === 22)).toBe(true);
      
      // The second type of tire should also be represented
      expect(packages.some(pkg => pkg.length === 65 && pkg.width === 65 && pkg.height === 20)).toBe(true);
    });

    it('should handle items without dimensions', () => {
      const items: CartItem[] = [
        {
          id: '1',
          name: 'Basic Tire',
          price: 100,
          quantity: 1,
          image: 'tire.jpg',
          size: '205/55R16',
          brandName: 'BasicTire',
          productId: 'p1',
          weight: 9
          // No dimensions specified
        }
      ];
      
      const packages = createPackageDetails(items);
      
      expect(packages).toHaveLength(1);
      // Should use default dimensions
      expect(packages[0].length).toBe(65); // DEFAULT_TIRE_DIAMETER_CM
      expect(packages[0].weight).toBe(9); // From the item
    });

    it('should split heavy orders into multiple packages', () => {
      const items: CartItem[] = [
        {
          id: '1',
          name: 'Heavy Truck Tire',
          price: 250,
          quantity: 8, // 8 heavy tires, should split into multiple packages
          image: 'tire.jpg',
          size: '315/80R22.5',
          brandName: 'HeavyDuty',
          productId: 'p1',
          weight: 25, // 25kg each, 8 * 25 = 200kg total
          dimensions: {
            length: 110,
            width: 110,
            height: 30
          }
        }
      ];
      
      const packages = createPackageDetails(items);
      
      // We expect multiple packages due to weight constraints (MAX_PACKAGE_WEIGHT = 50)
      expect(packages.length).toBeGreaterThanOrEqual(4); // At least 4 packages for 200kg of tires
      
      // Each package should not exceed the max weight
      packages.forEach(pkg => {
        expect(pkg.weight).toBeLessThanOrEqual(50);
      });
      
      // Total weight should be preserved
      const totalWeight = packages.reduce((sum, pkg) => sum + pkg.weight, 0);
      expect(totalWeight).toBeCloseTo(200);
    });
  });
}); 