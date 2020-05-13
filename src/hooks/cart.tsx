import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productStorage = await AsyncStorage.getItem('@GoMarket:product');

      if (productStorage) {
        setProducts(JSON.parse(productStorage));
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async product => {
      const existentProduct = products.some(item => item.id === product.id);

      if (existentProduct) {
        const incrementProduct = products.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
        setProducts(incrementProduct);

        await AsyncStorage.setItem(
          '@GoMarket:product',
          JSON.stringify(incrementProduct),
        );
        return;
      }

      const newProduct: Product = { ...product, quantity: 1 };

      setProducts([...products, newProduct]);

      await AsyncStorage.setItem(
        '@GoMarket:product',
        JSON.stringify([...products, newProduct]),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const newProduct = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
      );
      setProducts(newProduct);

      await AsyncStorage.setItem(
        '@GoMarket:product',
        JSON.stringify(newProduct),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const removeProduct = products.map(item =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item,
      );
      setProducts(removeProduct);

      const filterProducts = removeProduct.filter(
        p => !(p.id === id && p.quantity === 0),
      );

      setProducts(filterProducts);

      await AsyncStorage.setItem(
        '@GoMarket:product',
        JSON.stringify(filterProducts),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
