<template>
  <div class="container orders-page mt-4">

    <h2 class="page-title">รายการคำสั่งซื้อของฉัน</h2>

    <div v-if="loading" class="text-center mt-3">กำลังโหลดข้อมูล...</div>

    <div v-else-if="orders.length === 0" class="empty-card">
      <p>คุณยังไม่มีรายการคำสั่งซื้อ</p>
    </div>

    <div v-else>
      <div
        v-for="order in orders"
        :key="order.orderId"
        class="order-card"
      >
        <!-- HEADER -->
        <div class="order-header">
          <div class="order-left">
            <div class="order-date">
              {{ formattedDate(order.orderDate) }}
            </div>

            <div class="order-title">
              คำสั่งซื้อเลขที่ {{ order.orderId }}
            </div>
          </div>

          <div class="order-right">
            <div class="order-total">
              ฿{{ (order.totalPrice ?? 0).toLocaleString() }}
            </div>

            <span :class="['status-badge', getStatusClass(order.orderStatus)]">
              {{ getStatusText(order.orderStatus) }}
            </span>

            <button
              class="toggle-btn"
              @click="toggleOrderDetail(order.orderId)"
            >
              <i
                :class="expandedOrders.includes(order.orderId)
                  ? 'bi bi-chevron-up'
                  : 'bi bi-chevron-down'"
              ></i>
            </button>
          </div>
        </div>

        <!-- DETAILS (EXPANDABLE) -->
        <transition name="fade">
          <div
            v-if="expandedOrders.includes(order.orderId)"
            class="order-details"
          >
            <div class="detail-title">
              รายการสินค้า
            </div>

            <div
              v-if="orderDetails[order.orderId]" class="detail-table">
              <!-- Header row -->
              <div class="detail-header-row">
                <div>สินค้า</div>
                <div class="text-center">จำนวน</div>
                <div class="text-end">ราคาต่อหน่วย</div>
                <div class="text-end">รวม</div>
              </div>
              
              <!-- Data rows -->
              <div
                v-for="(d, index) in orderDetails[order.orderId]"
                :key="index"
                class="detail-row"
              >
                <div class="d-name">{{ d.productname }}</div>
                <div class="d-qty"><span class="qty-highlight">{{ d.qty }} ชิ้น</span></div>
                <div class="d-price">฿{{ d.price.toLocaleString() }}</div>
                <div class="d-total">
                  ฿{{ (d.qty * d.price).toLocaleString() }}
                </div>
              </div>
            </div>

            <div v-else class="text-center text-muted py-3">
              กำลังโหลดรายละเอียด...
            </div>
          </div>
        </transition>
      </div>
    </div>

  </div>
</template>


<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';
import API_BASE_URL from '@/config/api';
axios.defaults.withCredentials = true

const orders = ref([])
const mem_email = ref(null)
const loading = ref(true)
const expandedOrders = ref([])
const orderDetails = ref({})

const formattedDate = (dateStr) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

const getStatusText = (status) => {
    const statusMap = {
        'pending': 'รอดำเนินการ',
        'confirmed': 'ยืนยันแล้ว',
        'shipped': 'จัดส่งแล้ว',
        'delivered': 'จัดส่งสำเร็จ',
        'cancelled': 'ยกเลิก'
    };
    return statusMap[status] || status;
}

const getStatusClass = (status) => {
  const classMap = {
    pending: "status-badge status-pending",
    confirmed: "status-badge status-confirmed",
    shipped: "status-badge status-shipped",
    delivered: "status-badge status-delivered",
    cancelled: "status-badge status-cancelled",
  };
  return classMap[status] || "status-badge status-default";
};


const toggleOrderDetail = async (orderId) => {
    const index = expandedOrders.value.indexOf(orderId);
    if (index > -1) {
        // ซ่อนรายละเอียด
        expandedOrders.value.splice(index, 1);
    } else {
        // แสดงรายละเอียด
        expandedOrders.value.push(orderId);
        // ดึงรายละเอียดถ้ายังไม่มี
        if (!orderDetails.value[orderId]) {
            await getOrderDetail(orderId);
        }
    }
}

const getOrderDetail = async (orderId) => {
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/detail/${orderId}`);
        orderDetails.value[orderId] = response.data;
    } catch (err) {
        console.error('Error getting order detail:', err);
    }
}

const getOrders = async () => {
    if (!mem_email.value) {
        loading.value = false;
        return;
    }
    
    try {
        const response = await axios.get(`${API_BASE_URL}/orders/${mem_email.value}`);
        orders.value = response.data;
    } catch (err) {
        console.error('Error getting orders:', err);
    } finally {
        loading.value = false;
    }
}

const getMember = async () => {
    try {
        const response = await axios.get(`${API_BASE_URL}/members/detail`);
        mem_email.value = response.data.mem_email;
    } catch (err) {
        console.error('Error getting member:', err.message);
    }
}

onMounted(async () => {
    await getMember();
    await getOrders();
})
</script>

<style scoped lang="scss">
.orders-page {
  padding-bottom: 2rem;
}

.page-title {
  font-size: 1.35rem;
  font-weight: 700;
  color: #4c1d95;
  margin-bottom: 1.5rem;
}

/* Empty card */
.empty-card {
  background: #faf5ff;
  padding: 1.5rem;
  border-radius: 1rem;
  text-align: center;
  color: #6b21a8;
  font-weight: 500;
}

/* CARD */
.order-card {
  background: white;
  border-radius: 1.2rem;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1.2rem;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: 0.25s ease;
}

.order-card:hover {
  box-shadow: 0 5px 18px rgba(0,0,0,0.08);
}

/* HEADER */
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-left {
  display: flex;
  flex-direction: column;
}

.order-date {
  font-size: 0.9rem;
  color: #9ca3af;
}

.order-title {
  font-size: 1rem;
  font-weight: 600;
  color: #4b5563;
}

/* Right section */
.order-right {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.order-total {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.qty-highlight {
  background: #f3e8ff;      /* ม่วงอ่อน */
  color: #6d28d9;           /* ม่วงเข้ม */
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 1rem;
  font-size: 0.85rem;
  display: inline-block;
}

/* Status badge */
.status-badge {
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-pending {
  background: #fef9c3;
  color: #b45309;
}

.status-confirmed {
  background: #e0f2fe;
  color: #03a10e;
}

.status-shipped {
  background: #ede9fe;
  color: #5b21b6;
}

.status-delivered {
  background: #dcfce7;
  color: #166534;
}

.status-cancelled {
  background: #fee2e2;
  color: #b91c1c;
}

/* Toggle button */
.toggle-btn {
  border: none;
  background: transparent;
  font-size: 1.1rem;
  color: #6b7280;
  cursor: pointer;
  transition: 0.2s;
}

.toggle-btn:hover {
  color: #4c1d95;
}

/* DETAILS SECTION */
.order-details {
  margin-top: 1.2rem;
  background: linear-gradient(90deg, #1e004c 0%, #783a84 100%);
  padding: 1rem;
  border-radius: 0.9rem;
  border: 1px solid #ede9fe;
}

.detail-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #fcfcfc;
  margin-bottom: 0.8rem;
}

/* Rows inside details */
.detail-table {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

/* header row */
.detail-header-row {
  display: grid;
  grid-template-columns: 1.6fr 0.8fr 0.9fr 1fr;
  column-gap: 0.5rem;
  padding: 0 0.5rem 0.2rem;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #e5e7eb;
  margin-bottom: 0.2rem;
}

.detail-row {
  display: grid;
  grid-template-columns: 2.1fr 1.2fr 1.2fr 0.1fr;
  column-gap: 0.5rem;
  padding: 0.7rem 0.5rem;
  background: white;
  border-radius: 0.6rem;
  border: 1px solid #f3e8ff;
}

.detail-row div {
  font-size: 0.86rem;
  font-weight: 800;
  color: #4b5563;
}

.d-total {
  font-weight: 700;
  color: #6d28d9;
}

/* Smooth expand animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}
</style>
