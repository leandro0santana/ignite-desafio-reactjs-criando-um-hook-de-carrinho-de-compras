import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const responseProduct = await api.get<Product>(`/products/${productId}`);
      const product = responseProduct.data;

      const responseStock = await api.get<Stock>(`/stock/${productId}`);
      const stock = responseStock.data;
      
      const cartExists = cart.find(productFind => productFind.id === productId);

      if(cartExists) {
        if(cartExists.amount < stock.amount) {
          const newCart = cart.map(productCart => productCart.id === product.id ? {
            ...productCart,
            amount: productCart.amount + 1,
          } : productCart);

          setCart(newCart);
    
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        } else {
          toast.error('Quantidade solicitada fora de estoque');
        }
      } else {

        const productFormatted = {
          id: product.id,
          image: product.image,
          title: product.title,
          price: product.price,
          amount: 1,
        }

        const updateCart = [
          ...cart,
          productFormatted,
        ];

        setCart(updateCart);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
      }
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartExists = cart.find(productFind => productFind.id === productId);

      if(cartExists) {
        const cartIndex = cart.findIndex(product => product.id === productId);
  
        cart.splice(cartIndex, 1);
    
        setCart(cart.filter(product => product.id !== productId));
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
      } else {
        toast.error('Erro na remoção do produto');
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const responseStock = await api.get<Stock>(`/stock/${productId}`);
      const stock = responseStock.data;

      if(amount <= stock.amount && amount >= 1) {
        const newCart = cart.map(productCart => productCart.id === productId ? {
          ...productCart,
          amount,
        } : productCart);

        setCart(newCart);
  
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
      } else {
        toast.error('Quantidade solicitada fora de estoque');
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
