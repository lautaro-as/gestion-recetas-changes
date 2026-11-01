import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  X,
  ShoppingCart,
  Trash2,
  CheckCircle2,
  Store,
  Sparkles,
  AlertCircle,
  CreditCard,
  PackageCheck,
  CheckSquare,
  Square,
  BadgeCheck,
  MapPin,
  Clock
} from 'lucide-react';

interface ShoppingCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ARG_STORES = [
  { id: 'Todas', name: 'Todas las tiendas asociadas', location: 'CABA y Gran Buenos Aires' },
  { id: 'Coto Digital', name: 'Coto Digital', location: 'Av. Cabildo 545, Belgrano, CABA' },
  { id: 'Carrefour Market', name: 'Carrefour Market', location: 'Av. Corrientes 3247, Abasto, CABA' },
  { id: 'Jumbo Hipermercado', name: 'Jumbo Hipermercado', location: 'Av. Santa Fe 3253, Palermo, CABA' },
  { id: 'Supermercados Día', name: 'Supermercados Día', location: 'Av. Rivadavia 2100, Balvanera, CABA' },
  { id: 'Mercado Central', name: 'Mercado Central de Bs As', location: 'Autopista Riccheri y Boulogne Sur Mer' },
];

export const ShoppingCartDrawer: React.FC<ShoppingCartDrawerProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    cart,
    togglePantryItem,
    removeFromCart,
    clearCart,
    selectedStoreFilter,
    setSelectedStoreFilter,
    showToast
  } = useApp();

  const [checkoutComplete, setCheckoutComplete] = useState(false);

  if (!isOpen) return null;

  // Filter items by store
  const filteredCart = selectedStoreFilter === 'Todas'
    ? cart
    : cart.filter((item) => item.storeName === selectedStoreFilter || item.ingredient?.storeName === selectedStoreFilter);

  // Active items to buy (those NOT already in pantry)
  const itemsToBuy = filteredCart.filter((item) => !item.haveInPantry);
  const itemsInPantry = filteredCart.filter((item) => item.haveInPantry);

  // Total in Argentine Pesos (ARS)
  const subtotal = itemsToBuy.reduce((sum, item) => sum + (item.ingredient?.estimatedPrice || 0), 0);
  const totalSaved = itemsInPantry.reduce((sum, item) => sum + (item.ingredient?.estimatedPrice || 0), 0);
  const deliveryFee = itemsToBuy.length > 0 ? 2500 : 0; // $ 2.500 ARS envío conjunto
  const grandTotal = subtotal + deliveryFee;

  const currentStoreInfo = ARG_STORES.find(s => s.id === selectedStoreFilter) || ARG_STORES[0];

  const handleSimulateCheckout = () => {
    setCheckoutComplete(true);
    showToast('¡Pedido confirmado con las tiendas argentinas asociadas!');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 bg-[#E09F3E] text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[26px]">shopping_cart</span>
            <div>
              <h3 className="font-bold text-base leading-tight font-display">
                Carrito de Ingredientes
              </h3>
              <p className="text-xs text-amber-100">
                {cart.length} ingredientes en lista • Precios en ARS ($)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-amber-100 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar carrito"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Content */}
        {checkoutComplete ? (
          <div className="p-8 text-center my-auto space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[36px]">check_circle</span>
            </div>
            <h4 className="font-bold font-display text-xl text-stone-900">
              ¡Pedido Realizado con Éxito!
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Tus ingredientes han sido ordenados directamente en las tiendas argentinas asociadas seleccionadas ({selectedStoreFilter === 'Todas' ? 'Coto, Carrefour, Jumbo, Día y Mercado Central' : selectedStoreFilter}). Recibirás la entrega en tu dirección asignada en CABA / GBA.
            </p>
            <div className="p-4 bg-[#F6F3F2] rounded-2xl border border-stone-200 text-left text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Total abonado:</span>
                <strong className="text-emerald-700 text-sm">$ {grandTotal.toLocaleString('es-AR')}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500">Ingredientes pedidos:</span>
                <strong className="text-stone-800">{itemsToBuy.length} ítems</strong>
              </div>
              {totalSaved > 0 && (
                <div className="flex justify-between items-center text-emerald-800 font-semibold pt-1 border-t border-stone-200">
                  <span>Ahorro en tu despensa:</span>
                  <span>$ {totalSaved.toLocaleString('es-AR')}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                clearCart();
                setCheckoutComplete(false);
                onClose();
              }}
              className="w-full py-2.5 bg-[#E09F3E] hover:bg-[#835500] text-white font-bold rounded-full text-xs transition-colors cursor-pointer"
            >
              Listo y Volver a Cocinar
            </button>
          </div>
        ) : cart.length === 0 ? (
          <div className="p-8 text-center my-auto space-y-3">
            <div className="w-14 h-14 bg-stone-100 text-stone-400 rounded-3xl flex items-center justify-center mx-auto">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <h4 className="font-bold text-stone-800 text-base">Tu carrito está vacío</h4>
            <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
              Visita cualquier receta del catálogo y presiona "Comprar Ingredientes" para armar tu lista de compras virtual con supermercados argentinos asociados.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Store Filter Selector with Argentine supermarkets */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-700 uppercase flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-amber-600" />
                  Filtrar por Tienda Asociada:
                </span>
                <span className="text-[10px] text-stone-400 font-normal">
                  Red argentina oficial
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedStoreFilter}
                  onChange={(e) => setSelectedStoreFilter(e.target.value)}
                  className="w-full px-3 py-2 pr-8 rounded-xl border border-stone-300 text-xs bg-stone-50 font-bold text-stone-800 focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none appearance-none cursor-pointer"
                >
                  {ARG_STORES.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined text-[20px] text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  expand_more
                </span>
              </div>

              {/* Store verified banner */}
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200/80 flex items-center justify-between text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5 truncate">
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{currentStoreInfo.location}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold shrink-0 ml-1">
                  Stock Verificado
                </span>
              </div>
            </div>

            {/* Smart Pantry Tip Card - Improved explanation & visual design */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50/50 to-stone-50 rounded-2xl border-2 border-amber-300/90 p-4 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-[#E09F3E] text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
                  💡
                </span>
                <div>
                  <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                    Ahorro Inteligente en tu Despensa
                  </h4>
                  <span className="text-[10px] text-amber-800 font-medium">
                    No pagues dos veces por lo que ya tienes en casa
                  </span>
                </div>
              </div>

              <p className="text-xs text-stone-700 leading-relaxed">
                ¿Ya cuentas con alguno de estos productos en tu cocina o alacena?
                Marca la casilla <strong>"Ya lo tengo en casa"</strong> al lado de cada ingrediente.
                El sistema lo descontará inmediatamente de tu lista de compra y de tu total a pagar,
                optimizando tu presupuesto para adquirir únicamente lo que te hace falta en las tiendas asociadas.
              </p>

              {itemsInPantry.length > 0 && (
                <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{itemsInPantry.length} {itemsInPantry.length === 1 ? 'producto descontado' : 'productos descontados'}</span>
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                    Ahorraste $ {totalSaved.toLocaleString('es-AR')}
                  </span>
                </div>
              )}
            </div>

            {/* Items List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 uppercase">
                  Ingredientes por Comprar ({itemsToBuy.length})
                </span>
                <button
                  onClick={clearCart}
                  className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Vaciar carrito
                </button>
              </div>

              {itemsToBuy.length === 0 && itemsInPantry.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-sm font-bold text-emerald-900 block">
                    ¡Todos los ingredientes están cubiertos por tu despensa!
                  </span>
                  <p className="text-xs text-emerald-700">
                    No necesitas comprar ningún ingrediente en este momento. Ahorraste el 100% de la compra.
                  </p>
                </div>
              )}

              {itemsToBuy.map((item) => {
                const stockLevel = item.ingredient?.stockLevel || 'alto';
                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2 hover:border-amber-200 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <button
                          type="button"
                          onClick={() => togglePantryItem(item.id)}
                          title="Marcar como ya disponible en mi despensa (no comprar)"
                          className="mt-0.5 text-stone-400 hover:text-amber-600 cursor-pointer p-0.5"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                        <div>
                          <div className="text-xs font-bold text-stone-900">
                            {item.ingredient.quantity} {item.ingredient.unit} {item.ingredient.name}
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5">
                            Receta: <strong className="text-stone-700">{item.recipeTitle}</strong>
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5 flex items-center gap-1">
                            <Store className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="font-semibold text-stone-700">{item.storeName || item.ingredient.storeName}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-700">
                          $ {item.ingredient.estimatedPrice.toLocaleString('es-AR')}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-300 hover:text-red-500 p-1 mt-1 cursor-pointer transition-colors"
                          title="Eliminar del carrito"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Stock check indicator & store availability */}
                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-stone-100">
                      <span className="flex items-center gap-1 text-stone-500">
                        <Clock className="w-3 h-3 text-stone-400" />
                        <span>Disponibilidad en góndola:</span>
                      </span>

                      {stockLevel === 'alto' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          <span>En stock (15+ un.)</span>
                        </span>
                      )}
                      {stockLevel === 'medio' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                          <span>Stock moderado (5 un.)</span>
                        </span>
                      )}
                      {stockLevel === 'bajo' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-orange-100 text-orange-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                          <span>¡Últimas unidades!</span>
                        </span>
                      )}
                      {stockLevel === 'agotado' && (
                        <span className="px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          <span>Agotado temporal</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Items in Pantry section */}
              {itemsInPantry.length > 0 && (
                <div className="pt-3 border-t border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-400 uppercase">
                      En mi despensa personal ({itemsInPantry.length})
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">
                      Ahorro: $ {totalSaved.toLocaleString('es-AR')}
                    </span>
                  </div>
                  {itemsInPantry.map((item) => (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 flex items-center justify-between text-xs opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => togglePantryItem(item.id)}
                          className="text-emerald-600 cursor-pointer p-0.5 shrink-0"
                          title="Desmarcar y volver a incluir en la compra"
                        >
                          <CheckSquare className="w-4 h-4" />
                        </button>
                        <span className="line-through text-stone-500 truncate">
                          {item.ingredient.name} ({item.ingredient.quantity} {item.ingredient.unit})
                        </span>
                      </div>
                      <span className="text-[11px] text-emerald-700 font-bold shrink-0 ml-2">
                        +$ {item.ingredient.estimatedPrice.toLocaleString('es-AR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Checkout Summary */}
        {!checkoutComplete && cart.length > 0 && (
          <div className="p-5 bg-stone-50 border-t border-stone-200 shrink-0 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex justify-between">
                <span>Subtotal ingredientes:</span>
                <span className="font-semibold text-stone-900">$ {subtotal.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex justify-between">
                <span>Envío estimado (CABA/GBA):</span>
                <span className="font-semibold text-stone-900">
                  {deliveryFee > 0 ? `$ ${deliveryFee.toLocaleString('es-AR')}` : 'Sin costo'}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>Total a pagar:</span>
                <span className="text-emerald-700 text-base">$ {grandTotal.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateCheckout}
              disabled={itemsToBuy.length === 0}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-stone-300 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>Comprar en Tiendas Asociadas ($ {grandTotal.toLocaleString('es-AR')})</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
