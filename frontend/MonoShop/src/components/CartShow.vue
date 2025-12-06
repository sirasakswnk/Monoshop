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
                  <td class="text-center">
                    <span class="quantity-pill">
                      {{ ctd.qty }}
                    </span>
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

          <!-- debug info (ยังเก็บไว้ให้ดู แต่ทำเป็นตัวเล็ก ๆ) -->
          <div class="debug-info mt-4 small text-muted">
            <p>mem_email: {{ mem_email || 'ยังไม่โหลด' }}</p>
            <p>cusId: {{ cusId || 'ยังไม่โหลด' }}</p>
            <p>cartId: {{ cartId || 'ยังไม่โหลด' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>



<script setup>
import { onMounted, ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router' //useRoute มีไว้เพื่อ อ่าน ข้อมูล useRouter มีไว้เพื่อ สั่งการ ให้เปลี่ยนหน้า
import axios from 'axios';
import { useCartStore } from '@/stores/cartStore';
axios.defaults.withCredentials = true


const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const cart=ref([])//รับข้อมูล Master
const cartDtl=ref([]) //รับข้อมูล Detail


const cartId=ref(null) //ข้อมูลจาก Database
const cusId=ref(null) //ข้อมูลจาก Database


const mem_email=ref(null) //ข้อมูลจาก Cookie ที่ Login
const isDeleting=ref(false) //สถานะการลบตะกร้า
const deleteMessage=ref('') //ข้อความผลลัพธ์การลบ
const isDeletingItem=ref(null) //สถานะการลบรายการสินค้า (เก็บ pdId ที่กำลังลบ)
const isConfirming=ref(false) //สถานะการยืนยันสั่งซื้อ
const confirmMessage=ref('') //ข้อความผลลัพธ์การยืนยัน

// Computed property เพื่อตรวจสอบสิทธิ์ (normalize ค่าก่อนเปรียบเทียบ)
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
    const month = String(date.getMonth()+ 1).padStart(2, '0'); // เดือนเริ่มต้นที่ 0, จึงต้อง +1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
onMounted(async ()=>{
    cartId.value = route.params.cart_id || route.params.cartId //อ่านค่า Cart จาก URL ที่ส่งมา (route ใช้ cart_id)
    console.log("CartShow - cartId from route:", cartId.value)
    
    // เรียก getMember และ getCart พร้อมกันเพื่อความเร็ว
    await Promise.all([
        getMember(), // ตรวจสอบผู้ใช้ -->อ่านค่าจาก Cookie
        getCart() // อ่านข้อมูลตะกร้า Master
    ]);
    
    // ตรวจสอบอีกครั้งหลังจากโหลดข้อมูลเสร็จ
    console.log('After loading - mem_email:', mem_email.value, 'cusId:', cusId.value, 'Match:', mem_email.value === cusId.value)
    
    await getCartDtl() // อ่านรายละเอียดตะกร้า Detail
})


const getCart=async ()=>{
    if (!cartId.value) {
        console.error('cartId is null or undefined')
        return
    }
    console.log('Get Cart:', cartId.value)
    await axios.get(`http://localhost:3000/carts/getcart/${cartId.value}`)
        .then(res => {
            cart.value = res.data
            console.log('Cart response:', res.data)
            // ตรวจสอบว่ามีข้อมูลก่อนเข้าถึง array
            if (cart.value && cart.value.length > 0) {
                cusId.value = cart.value[0].cusId // อ่านค่าว่าลูกค้าของเอกสารนี้เป็นใคร
                console.log('cusId loaded:', cusId.value, 'type:', typeof cusId.value)
                console.log('mem_email at this point:', mem_email.value, 'type:', typeof mem_email.value)
            } else {
                console.error('No cart data found - cart.value:', cart.value)
            }
        })
        .catch(err => {  
            console.error('Error getting cart:', err); 
        });      
}
const getCartDtl=async ()=>{
    console.log('Get Cart Detail:'+cartId.value)
    await axios.get(`http://localhost:3000/carts/getcartdtl/${cartId.value}`)
        .then(res => {
            cartDtl.value = res.data
        })
        .catch(err => {  console.error(err); });      
}
const getMember=async ()=>{
    await axios.get(`http://localhost:3000/members/detail`)
        .then((res)=>{
           mem_email.value=res.data.mem_email
           console.log('mem_email loaded:', mem_email.value, 'type:', typeof mem_email.value)
           console.log('cusId at this point:', cusId.value, 'type:', typeof cusId.value)
        })
        .catch(err=>{
            console.log('Error getting member:', err.message)
        })
}

const deleteCartItem = async (pdId) => {
    // ยืนยันก่อนลบ
    if (!confirm(`คุณต้องการลบสินค้ารายการนี้ออกจากตะกร้าหรือไม่?`)) {
        return
    }

    if (!cartId.value || !pdId) {
        alert('ไม่พบข้อมูลที่จำเป็น')
        return
    }

    isDeletingItem.value = pdId

    try {
        const response = await axios.delete(`http://localhost:3000/carts/deleteitem/${cartId.value}/${pdId}`)
        
        if (response.data.success) {
            // Refresh ข้อมูลตะกร้าและรายละเอียด
            await Promise.all([
                getCart(),
                getCartDtl()
            ])
            
            // อัพเดต cart store
            const sumResponse = await axios.get(`http://localhost:3000/carts/sumcart/${cartId.value}`)
            if (sumResponse.data && sumResponse.data.qty) {
                cartStore.setDisplayQty(sumResponse.data.qty)
            } else {
                cartStore.setDisplayQty(0)
            }
            
            // Dispatch event เพื่อให้ CartInfo refresh แบบ real-time
            window.dispatchEvent(new Event('cart-item-deleted'))
            
            // ตรวจสอบว่ายังมีสินค้าในตะกร้าหรือไม่ (ตรวจสอบหลังจาก refresh แล้ว)
            // ใช้ setTimeout เพื่อให้แน่ใจว่า cartDtl.value ได้อัพเดตแล้ว
            setTimeout(() => {
                if (!cartDtl.value || cartDtl.value.length === 0) {
                    // ถ้าไม่มีสินค้าแล้ว ให้ redirect ไปหน้าสินค้า
                    router.push('/product')
                    window.dispatchEvent(new Event('cart-deleted'))
                }
            }, 100)
        } else {
            throw new Error(response.data.message || 'ลบรายการสินค้าไม่สำเร็จ')
        }
    } catch (err) {
        console.error('Error deleting cart item:', err)
        const errorMsg = err.response?.data?.message || err.message || 'ลบรายการสินค้าไม่สำเร็จ'
        alert(errorMsg)
    } finally {
        isDeletingItem.value = null
    }
}

const deleteCart = async () => {
    // ยืนยันก่อนลบ
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
        const response = await axios.delete(`http://localhost:3000/carts/delete/${cartId.value}`)
        
        if (response.data.success) {
            deleteMessage.value = 'ลบตะกร้าสินค้าสำเร็จ'
            
            // Reset cart store
            cartStore.setDisplayQty(0)
            cartStore.setId(null)
            
            // Trigger refresh โดยการ navigate ไปหน้าอื่นก่อน แล้วค่อยกลับมา
            // หรือใช้ window.location.reload() แต่จะ reload ทั้งหน้า
            // วิธีที่ดีกว่าคือใช้ router.push แล้วให้ CartInfo refresh เอง
            
            alert('ลบตะกร้าสินค้าสำเร็จ')
            
            // ใช้ router.push แล้ว trigger refresh โดยการ force reload component
            router.push('/product').then(() => {
                // Trigger window event เพื่อให้ CartInfo refresh
                window.dispatchEvent(new Event('cart-deleted'))
            })
        } else {
            throw new Error(response.data.message || 'ลบตะกร้าไม่สำเร็จ')
        }
    } catch (err) {
        console.error('Error deleting cart:', err)
        const errorMsg = err.response?.data?.message || err.message || 'ลบตะกร้าไม่สำเร็จ'
        deleteMessage.value = errorMsg
        alert(errorMsg)
    } finally {
        isDeleting.value = false
    }
}

const confirmOrder = async () => {
    // ยืนยันก่อนสั่งซื้อ
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
        const response = await axios.post(`http://localhost:3000/carts/confirm/${cartId.value}`)
        
        if (response.data.success) {
            confirmMessage.value = 'ยืนยันสั่งซื้อสำเร็จ'
            
            // Reset cart store
            cartStore.setDisplayQty(0)
            cartStore.setId(null)
            
            alert(`ยืนยันสั่งซื้อสำเร็จ! รหัสคำสั่งซื้อ: ${response.data.orderId}`)
            
            // ไปที่หน้าดูรายการ order
            router.push('/orders').then(() => {
                // Trigger window event เพื่อให้ CartInfo refresh
                window.dispatchEvent(new Event('cart-deleted'))
            })
        } else {
            throw new Error(response.data.message || 'ยืนยันสั่งซื้อไม่สำเร็จ')
        }
    } catch (err) {
        console.error('Error confirming order:', err)
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
