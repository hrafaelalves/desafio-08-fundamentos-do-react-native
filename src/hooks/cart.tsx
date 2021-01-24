import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';
import { Alert } from 'react-native';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext>({} as CartContext);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storageProducts) {
        const parseStorageProducts = JSON.parse(storageProducts);

        setProducts(parseStorageProducts);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const findItemToIncrement = products.findIndex(
        product => product.id === id,
      );

      products[findItemToIncrement].quantity += 1;

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify([...products]),
      );

      setProducts([...products]);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const existItemInProducts = products.findIndex(
        item => item.id === product.id,
      );

      if (existItemInProducts < 0) {
        const newProduct = { quantity: 1, ...product };

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([newProduct, ...products]),
        );

        setProducts([newProduct, ...products]);
      } else {
        increment(product.id);
      }
    },
    [products, increment],
  );

  const decrement = useCallback(
    async id => {
      const findItemToDecrement = products.findIndex(
        product => product.id === id,
      );

      if (products[findItemToDecrement].quantity > 1) {
        products[findItemToDecrement].quantity -= 1;

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify(products),
        );

        setProducts([...products]);
      } else {
        const removeItemInProductsList = products.filter(
          product => product.id !== id,
        );

        await AsyncStorage.setItem(
          '@GoMarketplace:products',
          JSON.stringify([...removeItemInProductsList]),
        );

        setProducts([...removeItemInProductsList]);
      }
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
