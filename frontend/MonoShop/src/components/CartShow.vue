<template>
  <div class="cart-page container py-5">

    <!-- ถ้ามีสิทธิ์ดู -->
    <div v-if="hasPermission">
      <!-- Master -->
      <div
        v-for="(ct, cartId) in cart"
        :key="cartId"
        class="order-card card border-0 shadow-sm rounded-4 mb-4"
      >
        <div class="card-body p-4 p-md-5">
          <div class="order-header d-flex justify-content-between flex-wrap gap-3">
            <div>
              <div class="order-label">
                รายการสั่งซื้อ
              </div>
              <h4 class="order-title mb-1">
                <i class="bi bi-bag-check me-2"></i>
                คำสั่งซื้อเลขที่ {{ ct.cartId }}
              </h4>
              <div class="order-meta text-muted">
                สั่งซื้อวันที่ {{ formattedDate(ct.cartDate) }}
              </div>
            </div>

            <div class="order-summary text-end">
              <div class="order-stat">
                <span class="order-stat-label">จำนวนสินค้า</span>
                <span class="order-stat-value">
                  {{ ct.sqty }} ชิ้น
                </span>
              </div>
              <div class="order-stat">
                <span class="order-stat-label">ยอดรวม</span>
                <span class="order-stat-value text-danger">
                  {{ (ct.sprice ?? 0).toLocaleString() }} บาท
                </span>
              </div>
            </div>
          </div>

          <!-- message -->
          <div
            v-if="deleteMessage || confirmMessage"
            class="alert alert-modern mt-3 mb-0"
            :class="(deleteMessage || confirmMessage)?.includes('สำเร็จ') ? 'alert-success' : 'alert-danger'"
          >
            <i
              class="me-2"
              :class="(deleteMessage || confirmMessage)?.includes('สำเร็จ') ? 'bi bi-check-circle' : 'bi bi-exclamation-triangle'"
            ></i>
            {{ deleteMessage || confirmMessage }}
          </div>

          <!-- actions -->
          <div class="d-flex flex-wrap gap-3 justify-content-between align-items-center mt-4">
            <button
              class="btn btn-outline-danger btn-pill"
              @click="deleteCart"
              :disabled="isDeleting || isConfirming"
            >
              <i class="bi bi-cart-x-fill me-2"></i>
              {{ isDeleting ? 'กำลังลบ...' : 'ลบตะกร้าสินค้า' }}
            </button>

            <button
                class="btn btn-action btn-pill ms-auto" @click="confirmOrder" :disabled="isConfirming || isDeleting">
                <i class="bi bi-currency-dollar me-2"></i>
                {{ isConfirming ? 'กำลังยืนยัน...' : 'ยืนยันสั่งสินค้า' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Detail -->
      <div class="card border-0 shadow-sm rounded-4">
        <div class="card-body p-0">
          <div class="table-responsive">
            <table class="table table-modern mb-0 align-middle">
              <thead>
                <tr>
                  <th>#</th>
                  <th>รหัสสินค้า</th>
                  <th>สินค้า</th>
                  <th class="text-end">ราคาต่อหน่วย</th>
                  <th class="text-center">จำนวน</th>
                  <th class="text-end">เป็นเงิน</th>
                  <th class="text-center"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(ctd, pdId) in cartDtl"
                  :key="pdId"
                  class="cart-item-row"
                >
                  <td class="text-muted small">
                    {{ ctd.row_number }}
                  </td>
                  <td class="product-id-cell">
                    {{ ctd.pdId }}
                  </td>
                  <td class="product-name-cell">
                    {{ ctd.productname }}
                  </td>
                  <td class="text-end price-cell">
                    {{ ctd.price.toLocaleString() }}
                  </td>
                  <td class="text-center qty-cell">
                    <div class="qty-selector">
                      <button
                        type="button"
                        class="btn-qty"
                        @click="decrementItem(ctd)"
                        :disabled="ctd.qty <= 1 || isUpdatingItem === ctd.pdId"
                      >-</button>
                      <span class="qty-value">{{ ctd.qty }}</span>
                      <button
                        type="button"
                        class="btn-qty"
                        @click="incrementItem(ctd)"
                        :disabled="isUpdatingItem === ctd.pdId"
                      >+</button>
                    </div>
                  </td>
                  <td class="text-end price-cell">
                    {{ ((ctd.price * ctd.qty) ?? 0).toLocaleString() }}
                  </td>
                  <td class="text-center">
                    <i 
                      class="bi bi-trash-fill text-danger icon-remove" 
                      @click="deleteCartItem(ctd.pdId)"
                      :class="{ 'opacity-50': isDeletingItem === ctd.pdId }"
                      :title="isDeletingItem === ctd.pdId ? 'กำลังลบ...' : 'ลบรายการนี้'"
                    ></i>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- ถ้าไม่มีสิทธิ์ -->
    <div v-else class="mt-5">
      <div class="card border-0 shadow-sm rounded-4 error-card text-center mx-auto">
        <div class="card-body py-5 px-4 px-md-5">
          <div class="error-icon mb-3">
            <i class="bi bi-shield-lock-fill"></i>
          </div>
          <h4 class="mb-2">คุณไม่มีสิทธิ์ดูรายการนี้</h4>
          <p class="text-muted mb-4">
            กรุณาล็อกอินด้วยบัญชีผู้ซื้อที่ถูกต้อง หรือกลับไปหน้าสินค้าเพื่อเลือกตะกร้าใหม่อีกครั้ง
          </p>

          <button
            class="btn btn-primary btn-pill"
            @click="router.push('/product')"
          >
            <i class="bi bi-arrow-left me-2"></i>
            กลับไปหน้าสินค้า
          </button>

        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
import API_BASE_URL from '@/config/api';
axios.defaults.withCredentials = true

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const cart=ref([])
const cartDtl=ref([])

const cartId=ref(null)
const cusId=ref(null)

const mem_email=ref(null)
const isDeleting=ref(false)
const deleteMessage=ref('')
const isDeletingItem=ref(null)
const isUpdatingItem=ref(null)
const isConfirming=ref(false)
const confirmMessage=ref('')
const hasPermission = computed(() => {
    if (!mem_email.value || !cusId.value) {
        return false
    }
    // Trim และแปลงเป็น string เพื่อเปรียบเทียบ
    const email = String(mem_email.value).trim().toLowerCase()
    const customerId = String(cusId.value).trim().toLowerCase()
    return email === customerId
})


const formattedDate=(dateStr)=> {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth()+ 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
onMounted(async ()=>{
    cartId.value = route.params.cart_id || route.params.cartId
    
    await Promise.all([
        getMember(),
        getCart()
    ]);
    
    await getCartDtl()
})


const getCart=async ()=>{
    if (!cartId.value) {
        return
    }
    await axios.get(`${API_BASE_URL}/carts/getcart/${cartId.value}`)
        .then(res => {
            cart.value = res.data
            if (cart.value && cart.value.length > 0) {
                cusId.value = cart.value[0].cusId
            }
        })
        .catch(err => {});      
}
const getCartDtl=async ()=>{
    await axios.get(`${API_BASE_URL}/carts/getcartdtl/${cartId.value}`)
        .then(res => {
            cartDtl.value = res.data
        })
        .catch(err => {});      
}
const getMember=async ()=>{
    await axios.get(`${API_BASE_URL}/members/detail`)
        .then((res)=>{
           mem_email.value=res.data.mem_email
        })
        .catch(err=>{})
}

const deleteCartItem = async (pdId) => {
    if (!confirm(`คุณต้องการลบสินค้ารายการนี้ออกจากตะกร้าหรือไม่?`)) {
        return
    }

    if (!cartId.value || !pdId) {
        alert('ไม่พบข้อมูลที่จำเป็น')
        return
    }

    isDeletingItem.value = pdId

    try {
        const response = await axios.delete(`${API_BASE_URL}/carts/deleteitem/${cartId.value}/${pdId}`)
        
        if (response.data.success) {
            await Promise.all([
                getCart(),
                getCartDtl()
            ])
            
            const sumResponse = await axios.get(`${API_BASE_URL}/carts/sumcart/${cartId.value}`)
            if (sumResponse.data && sumResponse.data.qty) {
                cartStore.setDisplayQty(sumResponse.data.qty)
            } else {
                cartStore.setDisplayQty(0)
            }
            
            window.dispatchEvent(new Event('cart-item-deleted'))
            
            setTimeout(() => {
                if (!cartDtl.value || cartDtl.value.length === 0) {
                    router.push('/product')
                    window.dispatchEvent(new Event('cart-deleted'))
                }
            }, 100)
        } else {
            throw new Error(response.data.message || 'ลบรายการสินค้าไม่สำเร็จ')
        }
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'ลบรายการสินค้าไม่สำเร็จ'
        alert(errorMsg)
    } finally {
        isDeletingItem.value = null
    }
}

const updateItemQty = async (pdId, newQty) => {
    if (!cartId.value || !pdId || newQty < 1) return
    isUpdatingItem.value = pdId
    try {
        const response = await axios.put(`${API_BASE_URL}/carts/updateqty/${cartId.value}/${pdId}`, { qty: newQty })
        
        if (response.data?.success) {
            await Promise.all([
                getCart(),
                getCartDtl()
            ])
            
            const sumResponse = await axios.get(`${API_BASE_URL}/carts/sumcart/${cartId.value}`)
            if (sumResponse.data && sumResponse.data.qty) {
                cartStore.setDisplayQty(sumResponse.data.qty)
            } else {
                cartStore.setDisplayQty(0)
            }
            
            window.dispatchEvent(new Event('cart-item-deleted'))
        } else {
            throw new Error(response.data?.message || 'อัปเดตจำนวนไม่สำเร็จ')
        }
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'อัปเดตจำนวนไม่สำเร็จ'
        alert(errorMsg)
    } finally {
        isUpdatingItem.value = null
    }
}

const incrementItem = (ctd) => {
    updateItemQty(ctd.pdId, ctd.qty + 1)
}

const decrementItem = (ctd) => {
    if (ctd.qty <= 1) return
    updateItemQty(ctd.pdId, ctd.qty - 1)
}

const deleteCart = async () => {
    if (!confirm('คุณต้องการลบตะกร้าสินค้านี้ทั้งหมดหรือไม่?')) {
        return
    }

    if (!cartId.value) {
        alert('ไม่พบรหัสตะกร้า')
        return
    }

    isDeleting.value = true
    deleteMessage.value = ''

    try {
        const response = await axios.delete(`${API_BASE_URL}/carts/delete/${cartId.value}`)
        
        if (response.data.success) {
            deleteMessage.value = 'ลบตะกร้าสินค้าสำเร็จ'
            
            cartStore.setDisplayQty(0)
            cartStore.setId(null)
            
            alert('ลบตะกร้าสินค้าสำเร็จ')
            
            router.push('/product').then(() => {
                window.dispatchEvent(new Event('cart-deleted'))
            })
        } else {
            throw new Error(response.data.message || 'ลบตะกร้าไม่สำเร็จ')
        }
    } catch (err) {
        const errorMsg = err.response?.data?.message || err.message || 'ลบตะกร้าไม่สำเร็จ'
        deleteMessage.value = errorMsg
        alert(errorMsg)
    } finally {
        isDeleting.value = false
    }
}

const confirmOrder = async () => {
    if (!confirm('คุณต้องการยืนยันสั่งซื้อสินค้านี้หรือไม่?')) {
        return
    }

    if (!cartId.value) {
        alert('ไม่พบรหัสตะกร้า')
        return
    }

    isConfirming.value = true
    confirmMessage.value = ''

    try {
        const response = await axios.post(`${API_BASE_URL}/carts/confirm/${cartId.value}`)
        
        if (response.data.success) {
            confirmMessage.value = 'ยืนยันสั่งซื้อสำเร็จ'
            
            cartStore.setDisplayQty(0)
            cartStore.setId(null)
            
            alert(`ยืนยันสั่งซื้อสำเร็จ! รหัสคำสั่งซื้อ: ${response.data.orderId}`)
            
            router.push('/orders').then(() => {
                window.dispatchEvent(new Event('cart-deleted'))
            })
        } else {
            throw new Error(response.data.message || 'ยืนยันสั่งซื้อไม่สำเร็จ')
        }
    } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'ยืนยันสั่งซื้อไม่สำเร็จ'
        confirmMessage.value = errorMsg
        alert(errorMsg)
    } finally {
        isConfirming.value = false
    }
}
</script>

<style scoped>
.cart-page {
  min-height: 100vh;
  background: radial-gradient(circle at top, #eef2ff 0, #f9fafb 40%, #ffffff 100%);
}

.order-label {
  text-transform: uppercase;    
  font-weight: 800;              
  font-size: 1rem;             
  color: #4f46e5;                
  margin-bottom: 0.5rem;       
  letter-spacing: 0.06em;        
  opacity: 0.9;
}


/* order card */
.order-card {
  backdrop-filter: blur(6px);
}

.order-label {
  letter-spacing: 0.08em;
}

.order-title {
  font-weight: 700;
}

.order-meta {
  font-size: 0.9rem;
}

.order-summary {
  min-width: 200px;
}

.order-stat {
  display: flex;
  justify-content: flex-end;
  gap: 0.4rem;
  font-size: 0.95rem;
}

.order-stat-label {
  color: #6b7280;
}

.order-stat-value {
  font-weight: 600;
}

/* ปุ่มแบบ pill */
.btn-pill {
  border-radius: 999px;
  padding: 0.55rem 1.6rem;
  font-weight: 600;
  font-size: 0.95rem;
}

/* ปุ่มหลัก (กำหนดสีเอง ไม่อิง primary) */
.btn-action {
  background: linear-gradient(135deg, #5a32a3 0%, #6f42c1 100%);
  color: #f0e2f5; /* สีที่คุณกำหนดเอง */
  border: none;
  font-weight: 600;
  letter-spacing: 0.3px;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
  transition: all 0.28s ease;
}

/* Hover */
.btn-action:hover:not(:disabled) {
  transform: translateY(-2px);
  background: linear-gradient(135deg, #6d5dfc 0%, #7f6aff 100%);
  color: #f8f5ff; 
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.45);
}

/* Active */
.btn-action:active {
  transform: translateY(0px);
  box-shadow: 0 3px 10px rgba(79, 70, 229, 0.35);
}

/* Disabled */
.btn-action:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
}


.btn {
  transition: all 0.25s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 13px rgba(15, 23, 42, 0.15);
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.7;
  box-shadow: none;
}

/* alert modern */
.alert-modern {
  border-radius: 999px;
  padding: 0.55rem 1rem;
  display: inline-flex;
  align-items: center;
}

/* table modern */
.table-modern thead tr {
  background: #f3f4ff;
}

.table-modern thead th {
  border-bottom: none;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #6b7280;
}

.table-modern tbody td {
  border-top: 1px solid #f1f3f5;
}

.cart-item-row {
  transition: background-color 0.18s ease, transform 0.15s ease;
}

.cart-item-row:hover {
  background-color: #f9fafb;
}

.product-id-cell {
  font-size: 0.82rem;
  color: #9ca3af;
}

.product-name-cell {
  font-weight: 600;
}

.price-cell {
  font-weight: 600;
}

.quantity-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2.5rem;
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4f46e5;
  font-weight: 600;
  font-size: 0.9rem;
}

.qty-selector {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  border: 2px solid #d9d1f2;
  border-radius: 10px;
  background: #f7f2ff;
}

.btn-qty {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: none;
  background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);
  color: #f8f5ff;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-qty:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-qty:not(:disabled):hover {
  background: linear-gradient(135deg, #7b55cf 0%, #6a3cb5 100%);
  transform: translateY(-1px);
}

.qty-value {
  min-width: 28px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
  color: #3a1f6e;
}

/* ไอคอนลบ */
.icon-remove {
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.icon-remove:hover:not(.opacity-50) {
  transform: scale(1.1);
  opacity: 0.8;
}

.icon-remove.opacity-50 {
  cursor: not-allowed;
  opacity: 0.5;
}

/* error card */
.error-card {
  max-width: 520px;
}

.error-icon {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fef2f2;
  color: #dc2626;
  font-size: 1.6rem;
}

/* ปรับ padding table ให้ดูโปร่ง */
.table > :not(caption) > * > * {
  padding: 0.85rem 0.9rem;
}

/* debug text */
.debug-info p {
  margin-bottom: 0.25rem;
}
</style>
